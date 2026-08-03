<script setup lang="ts">
// Reasoning Chain Inspector — makes a conversation chain's reasoning legible in
// four stages: Annotation → Concepts → Variants → Execution. Port of the
// reference React component, aligned to the estate:
//   - the annotation layer is bound to the governed semantic-role KIND vocabulary
//     (regis-entity-graph#22) + the KE type/dictionary registries, not hard-coded
//     strings (see features/reasoning-chain/kindVocabulary.ts);
//   - candidate plans are ranked by the GOVERNED variant scorer with teeth
//     (dedup + parsimony + declared-path tie-break; features/.../scoreVariants.ts);
//   - annotations are AUTHORABLE: add/overwrite/define/promote emit governed,
//     versioned, receipted authorship events into the KE loop (keAuthorship.ts).
//
// The annotation→concept-graph derivation IS the token-tree→KG: regis NLU
// semantic-role head + span-alignment (regis-entity-graph#27) + HellGraph. This
// surface augments the graph dock + reasoning trace per conversation chain
// (cockpit context is set so the global Graph dock reflects the active example).
import { computed, onMounted, ref, watch } from 'vue';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import { useCockpit } from '../stores/cockpit';
import { useAuth } from '../stores/auth';
import { EXAMPLES, type Example, type Token, type TokenConcept } from '../features/reasoning-chain/examples';
import {
  KIND_META, PROVENANCE_META, kindForConcept, paletteForConcept,
  type AnnotationKind, type ProvenanceClass,
} from '../features/reasoning-chain/kindVocabulary';
import { scoreVariants, type ScoredVariant } from '../features/reasoning-chain/scoreVariants';
import {
  useAuthorshipLedger, promoteConceptToDictionaryTerm, defineEntityType,
  defineRelationType, overrideConcept, type AuthorshipEvent,
} from '../features/reasoning-chain/keAuthorship';

const cockpit = useCockpit();
const auth = useAuth();
const author = computed(() => auth.user?.email ?? 'operator');

type StageKey = 'annotation' | 'concepts' | 'variants' | 'execution';
const STAGES: { key: StageKey; label: string }[] = [
  { key: 'annotation', label: '1 · Annotation' },
  { key: 'concepts', label: '2 · Concepts' },
  { key: 'variants', label: '3 · Variants' },
  { key: 'execution', label: '4 · Execution' },
];

const exampleId = ref('A');
const stage = ref<StageKey>('annotation');
const example = computed<Example>(() => EXAMPLES.find((e) => e.id === exampleId.value) ?? EXAMPLES[0]);
const mode = ref(example.value.modes[0].key);
watch(example, (e) => { mode.value = e.modes[0].key; });

// ---- authorship (human overrides supersede learned; prior retained) ----
const ledger = useAuthorshipLedger();
// Human overrides recorded this session, keyed by concept label.
const overrides = ref<Record<string, string>>({});
const selectedConcept = ref<{ label: string; kind: AnnotationKind } | null>(null);

function provenanceOf(concept: TokenConcept): ProvenanceClass {
  if (overrides.value[concept.l]) return 'human_authored';
  return concept.provenance ?? 'learned';
}
function kindOf(concept: TokenConcept): AnnotationKind {
  return kindForConcept(concept.c, concept.l);
}
function selectConcept(concept: TokenConcept) {
  selectedConcept.value = { label: concept.l, kind: kindOf(concept) };
}
function record(e: AuthorshipEvent) {
  ledger.record(e);
  if (e.action === 'overwrite') overrides.value = { ...overrides.value, [e.term]: e.version };
}
function onPromote() {
  const s = selectedConcept.value; if (!s) return;
  record(promoteConceptToDictionaryTerm(s.label, s.kind, KIND_META[s.kind].label, { author: author.value }).event);
}
function onDefineType() {
  const s = selectedConcept.value; if (!s) return;
  const rel = s.kind === 'RELATION' || s.kind === 'POSSESSION';
  const built = rel
    ? defineRelationType(s.label, s.kind, 'SUBJECT', 'OBJECT', { author: author.value })
    : defineEntityType(s.label, s.kind, { author: author.value });
  record(built.event);
}
function onOverride() {
  const s = selectedConcept.value; if (!s) return;
  record(overrideConcept(s.label, s.kind, s.label, { author: author.value, note: 'human override of learned label' }));
}

// ---- governed scoring ----
const variants = computed(() => example.value.variants[mode.value] ?? []);
const scoring = computed(() => example.value.scoring[mode.value]);
const scoreResult = computed(() => scoreVariants(variants.value, scoring.value));
const rankedVariants = computed<ScoredVariant[]>(() => scoreResult.value.ranked);
const executionOutcome = computed(() => example.value.execution[mode.value]);
// The dedup story is meaningful when the raw scorer left a tie (example A).
const showsDedup = computed(() => scoreResult.value.rawMargin === 0 && scoreResult.value.collapsedTo < scoreResult.value.collapsedFrom);

// ---- concept-graph layout (token depth-grid + parent edges + concept satellites) ----
interface GNode { i: number; x: number; y: number; token: Token }
const graphNodes = computed<GNode[]>(() => {
  const toks = example.value.tokens;
  const n = toks.length;
  const maxDepth = Math.max(1, ...toks.map((t) => t.depth));
  return toks.map((t, i) => ({
    i,
    x: 12 + (t.depth / maxDepth) * 60,
    y: n <= 1 ? 50 : 7 + (i * 86) / (n - 1),
    token: t,
  }));
});
const graphEdges = computed(() =>
  graphNodes.value
    .filter((g) => g.token.parent != null)
    .map((g) => ({ a: g, b: graphNodes.value[g.token.parent as number] }))
    .filter((e) => !!e.b),
);
interface Satellite { key: string; tx: number; ty: number; cx: number; cy: number; fill: string; ring: string; label: string; kind: AnnotationKind }
const satellites = computed<Satellite[]>(() => {
  const out: Satellite[] = [];
  for (const g of graphNodes.value) {
    g.token.concepts.forEach((c, ci) => {
      const pal = paletteForConcept(c.c, c.l);
      out.push({
        key: `${g.i}-${ci}`,
        tx: g.x, ty: g.y,
        cx: Math.min(96, g.x + 14),
        cy: Math.max(3, Math.min(97, g.y + (ci - (g.token.concepts.length - 1) / 2) * 5)),
        fill: pal.bg, ring: pal.ring, label: c.l, kind: kindForConcept(c.c, c.l),
      });
    });
  }
  return out;
});

// Legend: only the KINDs actually present in this example (bound to vocabulary).
const legendKinds = computed<AnnotationKind[]>(() => {
  const set = new Set<AnnotationKind>();
  for (const t of example.value.tokens) for (const c of t.concepts) set.add(kindForConcept(c.c, c.l));
  return Array.from(set);
});

function setCockpitContext() {
  cockpit.setContext({
    surface: 'Reasoning Chain Inspector',
    entityLabel: `Example ${example.value.id} · ${example.value.label}`,
    detail: example.value.question,
    route: '/noetica/reasoning-chain',
  });
}
onMounted(setCockpitContext);
watch([example, mode], setCockpitContext);
</script>

<template>
  <section class="rci" aria-labelledby="rci-title">
    <SurfaceHeader title="Reasoning Chain Inspector" eyebrow="Noetica · reasoning trace · governed vocabulary">
      <template #badge>
        <span class="rci-badge">L2</span>
        <span class="rci-badge rci-badge--fixture">seed fixtures</span>
      </template>
    </SurfaceHeader>

    <p id="rci-title" class="rci-lede">
      Four stages make a conversation chain legible: <b>Annotation</b> (dep + governed semantic-role KIND),
      <b>Concepts</b> (the token-tree → knowledge graph), <b>Variants</b> (candidate plans, ranked by the governed
      scorer), and <b>Execution</b> (resolved vs a declared gap). The annotation → concept-graph derivation is the
      token-tree → KG: regis NLU semantic-role head + span-alignment (#27) + HellGraph.
    </p>

    <BoundaryNotice
      label="fixture · seed conversation chains"
      tone="muted"
      message="Fixture-backed over three seed conversation chains; live conversation-chain binding is a tracked follow-up. KINDs are bound to regis-entity-graph#22; authorship events are held in an in-memory ledger (unsigned) — the durable KE-workbench contract seals them."
      aria-label="Reasoning Chain Inspector boundary"
    />

    <!-- example selector + question card -->
    <div class="rci-picker" role="tablist" aria-label="Example">
      <button
        v-for="e in EXAMPLES" :key="e.id" type="button" class="rci-pill"
        :class="{ on: exampleId === e.id }" role="tab" :aria-selected="exampleId === e.id"
        @click="exampleId = e.id"
      >{{ e.id }} · {{ e.label }}</button>
    </div>

    <div class="rci-q">
      <span class="rci-q-k">question</span>
      <span class="rci-q-text mono">"{{ example.question }}"</span>
      <div class="rci-modes">
        <button
          v-for="m in example.modes" :key="m.key" type="button" class="rci-mode"
          :class="{ on: mode === m.key }" @click="mode = m.key"
        >{{ m.label }}</button>
      </div>
    </div>

    <!-- stage tabs -->
    <nav class="rci-stages" aria-label="Stages">
      <button
        v-for="s in STAGES" :key="s.key" type="button" class="rci-stage"
        :class="{ on: stage === s.key }" @click="stage = s.key"
      >{{ s.label }}</button>
    </nav>

    <div class="rci-body">
      <!-- STAGE 1 · ANNOTATION -->
      <div v-if="stage === 'annotation'" class="rci-annot">
        <ol class="rci-tree">
          <li
            v-for="(t, i) in example.tokens" :key="i" class="rci-tok"
            :style="{ paddingLeft: `${t.depth * 1.4 + 0.2}rem` }"
          >
            <span class="rci-tok-word">{{ t.text }}</span>
            <span class="rci-tok-pos mono">{{ t.pos }}</span>
            <span class="rci-tok-dep">{{ t.dep }}</span>
            <span
              v-for="(c, ci) in t.concepts" :key="ci" class="rci-tag"
              :class="{ sel: selectedConcept?.label === c.l }"
              :style="{ background: paletteForConcept(c.c, c.l).bg, color: paletteForConcept(c.c, c.l).text, boxShadow: `inset 0 0 0 1px ${paletteForConcept(c.c, c.l).ring}` }"
              :title="`${KIND_META[kindOf(c)].label} — ${KIND_META[kindOf(c)].gloss} · ${PROVENANCE_META[provenanceOf(c)].label}`"
              @click="selectConcept(c)"
            >
              <span class="rci-tag-prov" aria-hidden="true">{{ PROVENANCE_META[provenanceOf(c)].glyph }}</span>
              {{ c.l }}
              <span class="rci-tag-kind">{{ kindOf(c) }}</span>
            </span>
            <span v-if="!t.concepts.length" class="rci-tag rci-tag--untyped" title="Untyped — no resolved concept">untyped</span>
          </li>
        </ol>

        <!-- authoring affordance: add / overwrite / define / promote -->
        <aside class="rci-author" aria-label="Knowledge-engineering authoring">
          <div class="rci-author-h">Author into the KE loop</div>
          <p class="rci-author-hint">
            Select a concept tag, then author it. Terms are learned + <b>versioned</b> (never a match rule); a human
            override supersedes the learned value and keeps the prior as a version. Events are receipted (unsigned
            until the KE workbench seals them).
          </p>
          <div v-if="selectedConcept" class="rci-author-sel">
            selected <b class="mono">{{ selectedConcept.label }}</b>
            <span class="rci-tag-kind">{{ selectedConcept.kind }}</span>
          </div>
          <div v-else class="rci-author-sel rci-dim">no concept selected</div>
          <div class="rci-author-btns">
            <button type="button" :disabled="!selectedConcept" @click="onPromote">＋ Promote → dictionary term</button>
            <button type="button" :disabled="!selectedConcept" @click="onDefineType">◆ Define type</button>
            <button type="button" :disabled="!selectedConcept" @click="onOverride">✎ Overwrite (human)</button>
          </div>

          <div v-if="ledger.events.value.length" class="rci-ledger">
            <div class="rci-ledger-h">Authorship ledger · governed &amp; versioned</div>
            <ul>
              <li v-for="ev in ledger.events.value" :key="ev.id">
                <span class="rci-led-act">{{ ev.action }}</span>
                <span class="mono">{{ ev.term }}</span>
                <span class="rci-tag-kind">{{ ev.kind }}</span>
                <span class="rci-led-v">{{ ev.version }}</span>
                <span class="rci-led-prov">{{ PROVENANCE_META[ev.provenanceClass].glyph }} {{ PROVENANCE_META[ev.provenanceClass].label }}</span>
                <span class="rci-led-rcpt">{{ ev.receipt }}</span>
                <span v-if="ev.priorVersion" class="rci-led-prior">supersedes {{ ev.priorVersion.value }} ({{ ev.priorVersion.version }})</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <!-- STAGE 2 · CONCEPTS (token-tree → KG) -->
      <div v-else-if="stage === 'concepts'" class="rci-graph-wrap">
        <svg class="rci-graph" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Concept graph derived from the token tree">
          <line v-for="(e, i) in graphEdges" :key="`pe${i}`" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" class="rci-edge" />
          <line v-for="s in satellites" :key="`se${s.key}`" :x1="s.tx" :y1="s.ty" :x2="s.cx" :y2="s.cy" class="rci-cedge" :stroke="s.ring" />
          <g v-for="g in graphNodes" :key="`tn${g.i}`">
            <circle :cx="g.x" :cy="g.y" r="1.7" class="rci-tnode" />
            <text :x="g.x" :y="g.y - 2.4" text-anchor="middle" class="rci-tlabel">{{ g.token.text }}</text>
          </g>
          <g v-for="s in satellites" :key="`sn${s.key}`">
            <circle :cx="s.cx" :cy="s.cy" r="1.5" :fill="s.fill" :stroke="s.ring" stroke-width="0.4" />
            <text :x="s.cx + 2.2" :y="s.cy + 0.8" class="rci-clabel">{{ s.label }}</text>
          </g>
        </svg>
        <div class="rci-legend">
          <span v-for="k in legendKinds" :key="k" class="rci-legend-item">
            <i class="rci-sw" :style="{ background: KIND_META[k].palette.bg, boxShadow: `inset 0 0 0 1px ${KIND_META[k].palette.ring}` }" />
            {{ KIND_META[k].label }} <span class="rci-dim">· {{ k }}</span>
          </span>
        </div>
        <p class="rci-note">
          Nodes are tokens on a dependency depth-grid; grey edges are parse dependencies, colored edges bind each
          token to its learned concept, typed by governed KIND. This derivation is the token-tree → knowledge graph.
        </p>
      </div>

      <!-- STAGE 3 · VARIANTS (governed scorer) -->
      <div v-else-if="stage === 'variants'" class="rci-variants">
        <div class="rci-score-ribbon" :class="{ warn: scoreResult.rawMargin === 0 }">
          <span><b>Governed scorer</b> · dedup + parsimony + declared-path tie-break</span>
          <span>raw top-1 margin <b :class="{ tie: scoreResult.rawMargin === 0 }">{{ scoreResult.rawMargin.toFixed(2) }}</b></span>
          <span>→ governed margin <b class="clear">{{ scoreResult.margin.toFixed(2) }}</b></span>
          <span v-if="showsDedup" class="rci-dim">collapsed {{ scoreResult.collapsedFrom }} → {{ scoreResult.collapsedTo }} plans</span>
        </div>
        <p v-if="showsDedup" class="rci-note">
          The raw scorer left an exact tie (margin 0.00) — selection would depend on tie-break order, not signal.
          After collapsing plan-equivalent variants and penalizing redundant hops, the top-1 separates cleanly.
        </p>

        <ol class="rci-vlist">
          <li v-for="(v, i) in rankedVariants" :key="v.key" class="rci-variant" :class="{ top: i === 0 }">
            <div class="rci-v-head">
              <span v-if="i === 0" class="rci-v-top">top-1</span>
              <span class="rci-v-text">{{ v.text }}</span>
              <span class="rci-v-score" :title="`coverage ${v.coverage} · redundant hops ${v.redundantHops}`">{{ v.score.toFixed(2) }}</span>
              <span v-if="v.collapsedFrom > 1" class="rci-v-collapsed">×{{ v.collapsedFrom }} collapsed</span>
            </div>
            <div class="rci-chain">
              <span
                v-for="(h, hi) in v.canonicalChain" :key="hi" class="rci-hop"
                :style="{ background: paletteForConcept(h.cat as any, h.concept).bg, color: paletteForConcept(h.cat as any, h.concept).text }"
              >
                <b>{{ h.concept }}</b>
                <small class="mono">{{ h.executor }} · {{ h.weight.toFixed(3) }}</small>
              </span>
            </div>
            <div v-if="v.note" class="rci-v-note">{{ v.note }}</div>
          </li>
        </ol>
      </div>

      <!-- STAGE 4 · EXECUTION -->
      <div v-else class="rci-exec" :class="executionOutcome.status">
        <div class="rci-exec-status">
          <span class="rci-exec-badge" :class="executionOutcome.status">
            {{ executionOutcome.status === 'resolved' ? 'RESOLVED' : 'UNRESOLVED · declared gap' }}
          </span>
        </div>
        <p class="rci-exec-note">{{ executionOutcome.note }}</p>
        <blockquote class="rci-exec-resp" :class="{ gap: executionOutcome.status === 'gap' }">
          "{{ executionOutcome.response }}"
        </blockquote>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rci { padding: 1.25rem 1.75rem 2.5rem; color: var(--text); max-width: 1080px; }
.rci-badge { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid var(--line-2); border-radius: 999px; padding: 0.08rem 0.5rem; color: var(--text-2); }
.rci-badge--fixture { color: var(--text-3); }
.rci-lede { color: var(--text-2); font-size: 0.9rem; line-height: 1.5; max-width: 72ch; margin: 0.6rem 0 0.9rem; }
.rci-lede b { color: var(--text); font-weight: 600; }
.mono { font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
.rci-dim { color: var(--text-3); }

.rci-picker { display: flex; gap: 0.5rem; margin: 1rem 0 0.75rem; flex-wrap: wrap; }
.rci-pill, .rci-mode, .rci-stage { background: var(--surface); border: 1px solid var(--line); color: var(--text-2); border-radius: 8px; padding: 0.32rem 0.7rem; font-size: 0.82rem; cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s; }
.rci-pill.on { color: var(--text); border-color: var(--accent); background: var(--accent-soft); }
.rci-pill:hover, .rci-mode:hover, .rci-stage:hover { color: var(--text); }

.rci-q { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 0.7rem 0.9rem; }
.rci-q-k { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
.rci-q-text { font-size: 0.95rem; color: var(--text); }
.rci-modes { margin-left: auto; display: flex; gap: 0.4rem; }
.rci-mode.on { color: var(--text); border-color: var(--accent); }

.rci-stages { display: flex; gap: 0.4rem; margin: 1rem 0 0.75rem; border-bottom: 1px solid var(--line); padding-bottom: 0.6rem; flex-wrap: wrap; }
.rci-stage.on { color: var(--text); border-color: var(--accent); background: var(--accent-soft); }

.rci-body { margin-top: 0.5rem; }

/* Stage 1 */
.rci-annot { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.9fr); gap: 1.25rem; }
@media (max-width: 860px) { .rci-annot { grid-template-columns: 1fr; } }
.rci-tree { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.3rem; }
.rci-tok { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding: 0.18rem 0; border-bottom: 1px dotted var(--line); }
.rci-tok-word { font-weight: 600; color: var(--text); min-width: 3.5rem; }
.rci-tok-pos { font-size: 0.68rem; color: var(--text-3); }
.rci-tok-dep { font-size: 0.68rem; color: var(--text-2); background: var(--surface-2); border-radius: 5px; padding: 0.02rem 0.35rem; }
.rci-tag { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; border-radius: 6px; padding: 0.08rem 0.45rem; cursor: pointer; font-weight: 600; }
.rci-tag.sel { outline: 2px solid var(--accent); outline-offset: 1px; }
.rci-tag--untyped { background: #e7e5df; color: #4a4640; font-weight: 500; }
.rci-tag-prov { font-size: 0.72rem; opacity: 0.85; }
.rci-tag-kind { font-size: 0.56rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.72; }

.rci-author { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 0.85rem; align-self: start; }
.rci-author-h { font-weight: 700; font-size: 0.82rem; margin-bottom: 0.35rem; }
.rci-author-hint { font-size: 0.72rem; color: var(--text-2); line-height: 1.45; margin: 0 0 0.6rem; }
.rci-author-sel { font-size: 0.78rem; margin-bottom: 0.5rem; }
.rci-author-btns { display: flex; flex-direction: column; gap: 0.4rem; }
.rci-author-btns button { background: var(--surface-2); border: 1px solid var(--line-2); color: var(--text); border-radius: 7px; padding: 0.38rem 0.6rem; font-size: 0.78rem; cursor: pointer; text-align: left; }
.rci-author-btns button:disabled { opacity: 0.4; cursor: not-allowed; }
.rci-author-btns button:not(:disabled):hover { border-color: var(--accent); }
.rci-ledger { margin-top: 0.8rem; border-top: 1px solid var(--line); padding-top: 0.6rem; }
.rci-ledger-h { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); margin-bottom: 0.4rem; }
.rci-ledger ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.rci-ledger li { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; font-size: 0.7rem; color: var(--text-2); }
.rci-led-act { text-transform: uppercase; font-weight: 700; font-size: 0.6rem; color: var(--accent); }
.rci-led-v { color: var(--text-3); }
.rci-led-prov { color: var(--text-2); }
.rci-led-rcpt { color: var(--text-3); font-style: italic; }
.rci-led-prior { color: var(--text-3); }

/* Stage 2 */
.rci-graph-wrap { display: flex; flex-direction: column; gap: 0.6rem; }
.rci-graph { width: 100%; aspect-ratio: 16 / 9; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
.rci-edge { stroke: var(--line-2); stroke-width: 0.3; }
.rci-cedge { stroke-width: 0.25; opacity: 0.7; }
.rci-tnode { fill: var(--text-2); }
.rci-tlabel { fill: var(--text); font-size: 2.1px; font-weight: 600; }
.rci-clabel { fill: var(--text-2); font-size: 1.9px; }
.rci-legend { display: flex; flex-wrap: wrap; gap: 0.9rem; font-size: 0.72rem; color: var(--text-2); }
.rci-legend-item { display: inline-flex; align-items: center; gap: 0.35rem; }
.rci-sw { width: 0.75rem; height: 0.75rem; border-radius: 3px; display: inline-block; }
.rci-note { font-size: 0.74rem; color: var(--text-2); line-height: 1.45; max-width: 74ch; }

/* Stage 3 */
.rci-variants { display: flex; flex-direction: column; gap: 0.7rem; }
.rci-score-ribbon { display: flex; flex-wrap: wrap; gap: 0.9rem; align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 0.55rem 0.8rem; font-size: 0.78rem; color: var(--text-2); }
.rci-score-ribbon.warn { border-color: var(--amber, #d9a63a); }
.rci-score-ribbon b { color: var(--text); }
.rci-score-ribbon b.tie { color: #d9a63a; }
.rci-score-ribbon b.clear { color: #22c55e; }
.rci-vlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.55rem; }
.rci-variant { background: var(--surface); border: 1px solid var(--line); border-radius: 9px; padding: 0.6rem 0.75rem; }
.rci-variant.top { border-color: #22c55e; box-shadow: inset 3px 0 0 #22c55e; }
.rci-v-head { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; }
.rci-v-top { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; color: #22c55e; border: 1px solid #22c55e; border-radius: 999px; padding: 0.02rem 0.4rem; }
.rci-v-text { color: var(--text); font-size: 0.86rem; }
.rci-v-score { margin-left: auto; font-weight: 700; font-size: 0.95rem; color: var(--text); }
.rci-v-collapsed { font-size: 0.64rem; color: var(--text-3); }
.rci-chain { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
.rci-hop { display: inline-flex; flex-direction: column; border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.74rem; }
.rci-hop small { font-size: 0.6rem; opacity: 0.85; }
.rci-v-note { margin-top: 0.45rem; font-size: 0.72rem; color: #d9a63a; }

/* Stage 4 */
.rci-exec { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 1rem 1.1rem; }
.rci-exec-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 999px; padding: 0.2rem 0.7rem; }
.rci-exec-badge.resolved { color: #22c55e; border: 1px solid #22c55e; }
.rci-exec-badge.gap { color: #ef4444; border: 1px solid #ef4444; }
.rci-exec-note { color: var(--text-2); font-size: 0.86rem; line-height: 1.5; margin: 0.7rem 0; max-width: 76ch; }
.rci-exec-resp { border-left: 3px solid var(--line-2); margin: 0; padding: 0.3rem 0 0.3rem 0.8rem; color: var(--text); }
.rci-exec-resp.gap { font-style: italic; color: var(--text-2); border-left-color: #ef4444; }
</style>

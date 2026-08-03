<script setup lang="ts">
// Knowledge Studio — knowledge-engineering / IE workspace.
// Screen parity with IBM Watson Knowledge Studio: Assets (Documents, Entity Types,
// Relation Types, Dictionaries), Rule-based Model (Rules, Versions), Machine
// Learning Model (Pre-annotation, Annotation Tasks, Performance, Versions).
// Rendered in the cockpit's epistemic-Carbon language, plus the governance
// columns WKS does not have.
import { computed, ref } from 'vue';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import {
  lifecycle, nav, documentSets, annotationSets, entityTypes, relationTypes,
  dictionaries, regexes, rules, annotationTasks, performance, perfGateThreshold,
  versions, beyondParity,
} from '../features/knowledge-studio/fixture';

const active = ref('documents');
const docTab = ref<'sets' | 'annotation' | 'all'>('sets');
const ruleRail = ref<'rules' | 'dictionaries' | 'regex'>('regex');

const activeLabel = computed(() => {
  for (const g of nav) {
    const hit = g.items.find((i) => i.id === active.value);
    if (hit) return hit.label;
  }
  return '';
});

const failing = computed(() => performance.filter((p) => p.gate === 'fail'));
const macroF1 = computed(
  () => performance.reduce((s, p) => s + p.f1, 0) / performance.length,
);
</script>

<template>
  <section class="ks" aria-labelledby="ks-title">
    <SurfaceHeader title="Knowledge Studio" eyebrow="Knowledge engineering · information extraction">
      <template #badge>
        <span class="ks-badge">workspace</span>
        <span class="ks-badge ks-badge--fixture">fixture</span>
      </template>
    </SurfaceHeader>

    <p id="ks-title" class="ks-lede">
      Author a type system, dictionaries and rules; adjudicate ground truth; train, evaluate and promote an
      extraction model. Screen-for-screen parity with Watson Knowledge Studio — plus capture provenance,
      licence provenance, an observed-vs-derived split, and a promotion gate that <b>refuses</b> rather than warns.
    </p>

    <BoundaryNotice
      label="fixture · no annotator runs"
      tone="muted"
      message="Fixture-backed workspace. No extraction model executes and no document is really ingested; a live extractor (slate/nlp, SynapseIQ) swaps in behind the same shape. Metrics shown are illustrative fixtures, not measured performance."
      aria-label="Knowledge Studio boundary"
    />

    <!-- LIFECYCLE -->
    <section class="ks-life" aria-label="Data ingestion and model lifecycle">
      <div class="ks-life-h">
        <span class="ks-life-k">Ingestion &amp; model lifecycle</span>
        <span class="ks-life-retrain">↻ retraining loop: evaluate → develop</span>
      </div>
      <ol class="ks-life-row">
        <li v-for="s in lifecycle" :key="s.id" class="ks-stage" :class="`st-${s.state}`">
          <span class="ks-stage-dot" aria-hidden="true" />
          <span class="ks-stage-label">{{ s.label }}</span>
          <span class="ks-stage-note">{{ s.note }}</span>
          <span class="ks-stage-owner">{{ s.owner }}</span>
        </li>
      </ol>
    </section>

    <!-- WORKSPACE -->
    <div class="ks-workspace">
      <!-- left rail -->
      <nav class="ks-rail" aria-label="Knowledge Studio assets">
        <div v-for="g in nav" :key="g.group || 'misc'" class="ks-rail-group">
          <p v-if="g.group" class="ks-rail-h">{{ g.group }}</p>
          <button
            v-for="i in g.items"
            :key="i.id"
            type="button"
            class="ks-rail-item"
            :aria-current="active === i.id ? 'page' : undefined"
            @click="active = i.id"
          >
            <span>{{ i.label }}</span>
            <span v-if="i.badge" class="ks-rail-badge">{{ i.badge }}</span>
          </button>
        </div>
      </nav>

      <!-- main pane -->
      <section class="ks-pane" :aria-label="activeLabel">
        <h2 class="ks-pane-title">{{ activeLabel }}</h2>

        <!-- DOCUMENTS -->
        <template v-if="active === 'documents'">
          <div class="ks-tabs" role="tablist">
            <button role="tab" :aria-selected="docTab === 'sets'" @click="docTab = 'sets'">Document Sets ({{ documentSets.length }})</button>
            <button role="tab" :aria-selected="docTab === 'annotation'" @click="docTab = 'annotation'">Annotation Sets ({{ annotationSets.length }})</button>
            <button role="tab" :aria-selected="docTab === 'all'" @click="docTab = 'all'">Documents (All, 1284)</button>
          </div>
          <div class="ks-actions">
            <button type="button" class="ks-btn" disabled>Create Annotation Sets</button>
            <button type="button" class="ks-btn ks-btn--ghost" disabled>Upload Document Sets</button>
            <button type="button" class="ks-btn ks-btn--ghost ks-btn--right" disabled>Download Document Sets</button>
          </div>
          <p class="ks-gated">Write actions are disabled — this surface has no ingestion authority.</p>

          <div v-if="docTab === 'sets'" class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Name</th><th class="n">Documents</th><th>Last modified</th><th>Capture receipt</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="d in documentSets" :key="d.name" :class="{ 'is-bad': d.status === 'quarantined' }">
                  <td class="ks-strong">{{ d.name }}</td>
                  <td class="n">{{ d.documents.toLocaleString() }}</td>
                  <td class="ks-dim">{{ d.lastModified }}</td>
                  <td class="ks-mono">{{ d.captureReceipt }}</td>
                  <td><span class="ks-pill" :class="d.status === 'admitted' ? 'ok' : 'bad'">{{ d.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="docTab === 'annotation'" class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Name</th><th class="n">Documents</th><th>Annotator</th><th>Status</th><th class="n">Agreement (κ)</th></tr></thead>
              <tbody>
                <tr v-for="a in annotationSets" :key="a.name">
                  <td class="ks-strong">{{ a.name }}</td>
                  <td class="n">{{ a.documents }}</td>
                  <td class="ks-mono">{{ a.annotator }}</td>
                  <td><span class="ks-pill" :class="a.status === 'adjudicated' ? 'ok' : 'warn'">{{ a.status }}</span></td>
                  <td class="n">{{ a.agreement ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-else class="ks-empty">1,284 documents across 4 sets. 332 are quarantined pending capture provenance and are excluded from every downstream set.</p>
        </template>

        <!-- ENTITY TYPES -->
        <template v-else-if="active === 'entity-types'">
          <div class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Type</th><th>Roles</th><th class="n">Mentions</th><th class="n">F1</th><th>Value kind</th></tr></thead>
              <tbody>
                <tr v-for="e in entityTypes" :key="e.name">
                  <td><span class="ks-swatch" :style="{ background: e.color }" aria-hidden="true" /><b class="ks-strong">{{ e.name }}</b></td>
                  <td class="ks-dim">{{ e.roles }}</td>
                  <td class="n">{{ e.mentions.toLocaleString() }}</td>
                  <td class="n" :class="e.f1 !== null && e.f1 < perfGateThreshold ? 'is-lowv' : ''">{{ e.f1 ?? '—' }}</td>
                  <td><span class="ks-pill" :class="e.valueKind === 'observed' ? 'ok' : 'warn'">{{ e.valueKind }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="ks-note">A <b>derived</b> type is modelled, not observed in the text — it can never be presented downstream as a filed fact.</p>
        </template>

        <!-- RELATION TYPES -->
        <template v-else-if="active === 'relation-types'">
          <div class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Relation</th><th>Subject</th><th>Object</th><th class="n">Instances</th><th class="n">F1</th></tr></thead>
              <tbody>
                <tr v-for="r in relationTypes" :key="r.name">
                  <td class="ks-strong">{{ r.name }}</td>
                  <td class="ks-mono">{{ r.subject }}</td>
                  <td class="ks-mono">{{ r.object }}</td>
                  <td class="n">{{ r.instances.toLocaleString() }}</td>
                  <td class="n" :class="r.f1 !== null && r.f1 < perfGateThreshold ? 'is-lowv' : ''">{{ r.f1 ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- DICTIONARIES -->
        <template v-else-if="active === 'dictionaries'">
          <div class="ks-actions">
            <button type="button" class="ks-btn" disabled>Create Dictionary</button>
            <button type="button" class="ks-btn ks-btn--ghost" disabled>Upload CSV / ZIP</button>
          </div>
          <div class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Dictionary</th><th class="n">Terms</th><th>Maps to</th><th>Source</th><th>Licence</th></tr></thead>
              <tbody>
                <tr v-for="d in dictionaries" :key="d.name" :class="{ 'is-bad': d.licence.startsWith('UNKNOWN') }">
                  <td class="ks-strong">{{ d.name }}</td>
                  <td class="n">{{ d.terms.toLocaleString() }}</td>
                  <td class="ks-mono">{{ d.mappedType }}</td>
                  <td class="ks-dim">{{ d.source }}</td>
                  <td><span class="ks-pill" :class="d.licence.startsWith('UNKNOWN') ? 'bad' : 'ok'">{{ d.licence }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="ks-note">Unknown-licence term lists are <b>blocked from training</b> rather than silently used — the Lawful Learning invariant.</p>
        </template>

        <!-- RULES (three-pane, WKS shape) -->
        <template v-else-if="active === 'rules'">
          <div class="ks-rules">
            <nav class="ks-rules-rail" aria-label="Rule editor">
              <button type="button" :aria-current="ruleRail === 'rules' ? 'true' : undefined" @click="ruleRail = 'rules'">Rules</button>
              <button type="button" :aria-current="ruleRail === 'dictionaries' ? 'true' : undefined" @click="ruleRail = 'dictionaries'">Dictionaries</button>
              <button type="button" :aria-current="ruleRail === 'regex' ? 'true' : undefined" @click="ruleRail = 'regex'">Regex</button>
            </nav>

            <div class="ks-rules-main">
              <h3 v-if="ruleRail === 'regex'">Regular Expressions</h3>
              <h3 v-else-if="ruleRail === 'rules'">Rules</h3>
              <h3 v-else>Dictionaries in scope</h3>

              <div v-if="ruleRail === 'regex'" class="ks-tablewrap">
                <table class="ks-table">
                  <thead><tr><th>Name</th><th>Pattern</th><th>Captures as</th><th class="n">Matches</th></tr></thead>
                  <tbody>
                    <tr v-for="r in regexes" :key="r.name">
                      <td class="ks-strong">{{ r.name }}</td>
                      <td class="ks-mono ks-pattern">{{ r.pattern }}</td>
                      <td class="ks-mono">{{ r.capturesAs }}</td>
                      <td class="n">{{ r.matches.toLocaleString() }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else-if="ruleRail === 'rules'" class="ks-tablewrap">
                <table class="ks-table">
                  <thead><tr><th>Rule</th><th>Pattern</th><th>Produces</th><th class="n">Precision</th><th>State</th></tr></thead>
                  <tbody>
                    <tr v-for="r in rules" :key="r.name" :class="{ 'is-off': !r.enabled }">
                      <td class="ks-strong">{{ r.name }}</td>
                      <td class="ks-mono ks-pattern">{{ r.pattern }}</td>
                      <td class="ks-mono">{{ r.producesType }}</td>
                      <td class="n" :class="r.precision < perfGateThreshold ? 'is-lowv' : ''">{{ r.precision }}</td>
                      <td><span class="ks-pill" :class="r.enabled ? 'ok' : 'off'">{{ r.enabled ? 'enabled' : 'disabled' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul v-else class="ks-list">
                <li v-for="d in dictionaries" :key="d.name">{{ d.name }} — <span class="ks-mono">{{ d.mappedType }}</span></li>
              </ul>
            </div>

            <aside class="ks-rules-class" aria-label="Class">
              <h3>Class</h3>
              <p class="ks-dim">Check a class to display its occurrences in the document.</p>
              <label v-for="e in entityTypes" :key="e.name" class="ks-check">
                <input type="checkbox" checked disabled />
                <span class="ks-swatch" :style="{ background: e.color }" aria-hidden="true" />
                <span class="ks-mono">{{ e.name }}</span>
              </label>
            </aside>
          </div>
          <p class="ks-gated">Rule authoring is read-only on this surface — edits require the knowledge-engineering plane.</p>
        </template>

        <!-- PRE-ANNOTATION -->
        <template v-else-if="active === 'pre-annotation'">
          <p class="ks-note">
            Pre-annotation runs the current model over an unannotated set so annotators correct rather than start blank.
            Model pre-annotations are recorded as a <b>separate annotator identity</b> (<span class="ks-mono">gemma-2-9b-it</span>)
            so machine and human labels never silently merge into ground truth.
          </p>
          <div class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Set</th><th class="n">Documents</th><th>Annotator</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="a in annotationSets.filter((x) => x.annotator.includes('-'))" :key="a.name">
                  <td class="ks-strong">{{ a.name }}</td>
                  <td class="n">{{ a.documents }}</td>
                  <td class="ks-mono">{{ a.annotator }}</td>
                  <td><span class="ks-pill warn">{{ a.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- ANNOTATION TASKS -->
        <template v-else-if="active === 'annotation-tasks'">
          <div class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Task</th><th>Assignees</th><th class="n">Progress</th><th class="n">Agreement (κ)</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="t in annotationTasks" :key="t.name">
                  <td class="ks-strong">{{ t.name }}</td>
                  <td class="ks-mono">{{ t.assignee }}</td>
                  <td class="n">
                    {{ t.completed }}/{{ t.documents }}
                    <span class="ks-bar" aria-hidden="true"><span :style="{ width: `${(t.completed / t.documents) * 100}%` }" /></span>
                  </td>
                  <td class="n" :class="t.agreement !== null && t.agreement < 0.8 ? 'is-lowv' : ''">{{ t.agreement ?? '—' }}</td>
                  <td><span class="ks-pill" :class="t.status === 'adjudicated' ? 'ok' : 'warn'">{{ t.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="ks-note">Agreement below <b>0.80</b> is surfaced here rather than buried in a report — a low-agreement round is visible <b>before</b> it becomes ground truth.</p>
        </template>

        <!-- PERFORMANCE -->
        <template v-else-if="active === 'performance'">
          <div class="ks-stats">
            <div class="ks-stat"><span class="v">{{ macroF1.toFixed(2) }}</span><p>macro F1 across {{ performance.length }} types</p></div>
            <div class="ks-stat"><span class="v is-bad">{{ failing.length }}</span><p>types below the {{ perfGateThreshold }} gate threshold</p></div>
            <div class="ks-stat"><span class="v is-bad">blocked</span><p>promotion gate verdict — fail-closed, not advisory</p></div>
          </div>
          <div class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Type</th><th class="n">Precision</th><th class="n">Recall</th><th class="n">F1</th><th class="n">Support</th><th>Gate</th></tr></thead>
              <tbody>
                <tr v-for="p in performance" :key="p.type" :class="{ 'is-bad': p.gate === 'fail' }">
                  <td class="ks-strong ks-mono">{{ p.type }}</td>
                  <td class="n">{{ p.precision }}</td>
                  <td class="n">{{ p.recall }}</td>
                  <td class="n">
                    {{ p.f1 }}
                    <span class="ks-bar" aria-hidden="true"><span :class="p.gate === 'fail' ? 'is-bad' : ''" :style="{ width: `${p.f1 * 100}%` }" /></span>
                  </td>
                  <td class="n">{{ p.support }}</td>
                  <td><span class="ks-pill" :class="p.gate === 'pass' ? 'ok' : 'bad'">{{ p.gate }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="ks-note ks-note--bad">
            <b>Deploy is blocked.</b> OBLIGATION (0.71) and RISK_FACTOR (0.63) sit under the {{ perfGateThreshold }} threshold, and
            <span class="ks-mono">ml-v4</span> carries no signed receipt. The gate refuses; it does not warn and proceed.
          </p>
        </template>

        <!-- VERSIONS -->
        <template v-else-if="active === 'rule-versions' || active === 'ml-versions'">
          <div class="ks-tablewrap">
            <table class="ks-table">
              <thead><tr><th>Version</th><th>Created</th><th class="n">F1</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>
                <tr
                  v-for="v in versions.filter((x) => (active === 'ml-versions' ? x.kind === 'machine-learning' : x.kind === 'rule-based'))"
                  :key="v.version"
                  :class="{ 'is-bad': v.status === 'blocked' }"
                >
                  <td class="ks-strong ks-mono">{{ v.version }}</td>
                  <td class="ks-dim">{{ v.created }}</td>
                  <td class="n">{{ v.f1 ?? '—' }}</td>
                  <td>
                    <span class="ks-pill" :class="v.status === 'promoted' ? 'ok' : v.status === 'blocked' ? 'bad' : 'warn'">{{ v.status }}</span>
                  </td>
                  <td class="ks-mono" :class="v.receipt.startsWith('unsigned') ? 'is-lowv' : ''">{{ v.receipt }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="ks-note">Every promoted version carries a hash-sealed receipt binding model, training set and evaluation.</p>
        </template>

        <!-- SETTINGS / HELP -->
        <template v-else-if="active === 'settings'">
          <p class="ks-note">Workspace settings — type-system import/export, annotator roles, adjudication policy, and the promotion-gate thresholds. Read-only on this fixture surface.</p>
        </template>
        <template v-else>
          <p class="ks-note">
            Author entity and relation types first, then dictionaries and rules, then adjudicate ground truth before training.
            The lifecycle strip above shows where this workspace currently sits.
          </p>
        </template>
      </section>
    </div>

    <!-- BEYOND PARITY -->
    <section class="ks-beyond" aria-label="Beyond Watson Knowledge Studio">
      <div class="ks-beyond-h">
        <h2>Beyond parity</h2>
        <span class="ks-beyond-tag">what WKS does not ship</span>
      </div>
      <div class="ks-beyond-grid">
        <article v-for="b in beyondParity" :key="b.title" class="ks-beyond-card">
          <h3>{{ b.title }}</h3>
          <p>{{ b.detail }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.ks {
  height: 100%; min-height: 0; overflow-y: auto;
  padding: 1rem 1.25rem 2.5rem; background: var(--bg); color: var(--text);
  display: flex; flex-direction: column; gap: 1rem;
}
.ks-badge {
  font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
  color: var(--accent); background: var(--accent-soft); border-radius: 4px; padding: 0.05rem 0.32rem;
}
.ks-badge--fixture { color: var(--amber); background: var(--amber-soft); }
.ks-lede { margin: 0; max-width: 96ch; font-size: var(--fs-base); line-height: 1.55; color: var(--text-2); }
.ks-lede b { color: var(--text); }

/* lifecycle */
.ks-life { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 0.85rem 1rem; }
.ks-life-h { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 0.7rem; }
.ks-life-k { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 700; color: var(--text-3); }
.ks-life-retrain { font-size: 0.56rem; color: var(--up); font-weight: 700; }
.ks-life-row { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(126px, 1fr)); gap: 0.5rem; }
.ks-stage { display: flex; flex-direction: column; gap: 0.15rem; border-top: 2px solid var(--line-2); padding-top: 0.45rem; }
.ks-stage-dot { width: 0.4rem; height: 0.4rem; border-radius: 999px; background: var(--line-2); }
.ks-stage-label { font-size: var(--fs-xs); font-weight: 700; color: var(--text-2); }
.ks-stage-note { font-size: 0.58rem; color: var(--text-3); line-height: 1.35; }
.ks-stage-owner { font-size: 0.54rem; font-family: var(--mono, ui-monospace), monospace; color: var(--text-3); opacity: 0.8; }
.ks-stage.st-done { border-top-color: var(--up); } .ks-stage.st-done .ks-stage-dot { background: var(--up); } .ks-stage.st-done .ks-stage-label { color: var(--up); }
.ks-stage.st-active { border-top-color: var(--accent); } .ks-stage.st-active .ks-stage-dot { background: var(--accent); } .ks-stage.st-active .ks-stage-label { color: var(--accent); }
.ks-stage.st-blocked { border-top-color: var(--down); } .ks-stage.st-blocked .ks-stage-dot { background: var(--down); } .ks-stage.st-blocked .ks-stage-label { color: var(--down); }

/* workspace */
.ks-workspace { display: grid; grid-template-columns: 190px 1fr; gap: 0.9rem; align-items: start; }
@media (max-width: 820px) { .ks-workspace { grid-template-columns: 1fr; } }

.ks-rail { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 0.55rem; display: flex; flex-direction: column; gap: 0.6rem; }
.ks-rail-group { display: flex; flex-direction: column; gap: 0.1rem; }
.ks-rail-h { margin: 0 0 0.2rem; font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: var(--text-3); padding: 0 0.4rem; }
.ks-rail-item {
  display: flex; align-items: center; justify-content: space-between; gap: 0.4rem;
  background: transparent; border: 0; border-radius: 6px; padding: 0.32rem 0.45rem;
  font-size: var(--fs-xs); color: var(--text-2); cursor: pointer; text-align: left; width: 100%;
}
.ks-rail-item:hover { background: var(--surface-2); color: var(--text); }
.ks-rail-item[aria-current='page'] { background: var(--accent-soft); color: var(--accent); font-weight: 700; }
.ks-rail-item:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--accent-soft); }
.ks-rail-badge { font-size: 0.52rem; font-variant-numeric: tabular-nums; color: var(--text-3); }

.ks-pane { border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); padding: 0.9rem 1rem; min-height: 320px; }
.ks-pane-title { margin: 0 0 0.75rem; font-size: var(--fs-lg); font-weight: 640; letter-spacing: -0.01em; }

.ks-tabs { display: flex; gap: 0.15rem; border-bottom: 1px solid var(--line); margin-bottom: 0.7rem; flex-wrap: wrap; }
.ks-tabs button {
  background: transparent; border: 0; border-bottom: 2px solid transparent; padding: 0.4rem 0.7rem;
  font-size: var(--fs-xs); color: var(--text-3); cursor: pointer;
}
.ks-tabs button[aria-selected='true'] { color: var(--accent); border-bottom-color: var(--accent); font-weight: 700; }

.ks-actions { display: flex; gap: 0.45rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.ks-btn {
  border: 1px solid var(--accent); background: var(--accent); color: #17130a; border-radius: 7px;
  padding: 0.32rem 0.7rem; font-size: var(--fs-xs); font-weight: 700; cursor: not-allowed; opacity: 0.55;
}
.ks-btn--ghost { background: transparent; color: var(--text-2); border-color: var(--line-2); }
.ks-btn--right { margin-left: auto; }
.ks-gated { margin: 0.25rem 0 0.6rem; font-size: 0.58rem; color: var(--amber); }

.ks-tablewrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius-sm); }
.ks-table { width: 100%; border-collapse: collapse; min-width: 620px; font-size: var(--fs-xs); }
.ks-table th, .ks-table td { padding: 0.45rem 0.6rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
.ks-table tbody tr:last-child td { border-bottom: none; }
.ks-table tbody tr:hover td { background: var(--surface-2); }
.ks-table th { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--text-3); background: var(--surface-2); }
.ks-table th.n, .ks-table td.n { text-align: right; font-variant-numeric: tabular-nums; }
.ks-strong { font-weight: 640; color: var(--text); }
.ks-dim { color: var(--text-3); }
.ks-mono { font-family: var(--mono, ui-monospace), monospace; font-size: 0.62rem; color: var(--text-2); }
.ks-pattern { max-width: 300px; overflow-wrap: anywhere; }
.is-lowv { color: var(--down) !important; }
tr.is-bad td { background: rgba(240, 101, 106, 0.07); }
tr.is-off td { opacity: 0.55; }

.ks-pill {
  display: inline-block; font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.05em;
  font-weight: 700; border-radius: 3px; padding: 0.05rem 0.34rem; white-space: nowrap;
}
.ks-pill.ok { color: var(--up); background: rgba(75, 191, 115, 0.14); }
.ks-pill.warn { color: var(--amber); background: var(--amber-soft); }
.ks-pill.bad { color: var(--down); background: rgba(240, 101, 106, 0.14); }
.ks-pill.off { color: var(--neutral); background: rgba(139, 148, 158, 0.14); }

.ks-swatch { display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 2px; margin-right: 0.35rem; vertical-align: middle; }
.ks-bar { display: block; height: 0.2rem; margin-top: 0.2rem; border-radius: 999px; background: var(--line-2); overflow: hidden; }
.ks-bar span { display: block; height: 100%; background: var(--accent); }
.ks-bar span.is-bad { background: var(--down); }

.ks-note { margin: 0.6rem 0 0; font-size: 0.62rem; color: var(--text-3); line-height: 1.5; }
.ks-note b { color: var(--text-2); }
.ks-note--bad { color: var(--down); }
.ks-note--bad b { color: var(--down); }
.ks-empty { margin: 0; font-size: var(--fs-xs); color: var(--text-3); }
.ks-list { margin: 0; padding-left: 1rem; font-size: var(--fs-xs); color: var(--text-2); display: flex; flex-direction: column; gap: 0.25rem; }

/* rules three-pane */
.ks-rules { display: grid; grid-template-columns: 84px 1fr 190px; gap: 0.7rem; align-items: start; }
@media (max-width: 900px) { .ks-rules { grid-template-columns: 1fr; } }
.ks-rules-rail { display: flex; flex-direction: column; gap: 0.2rem; }
.ks-rules-rail button {
  background: transparent; border: 1px solid var(--line); border-radius: 6px; padding: 0.4rem 0.3rem;
  font-size: 0.58rem; color: var(--text-3); cursor: pointer;
}
.ks-rules-rail button[aria-current='true'] { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); font-weight: 700; }
.ks-rules-main h3, .ks-rules-class h3 { margin: 0 0 0.5rem; font-size: var(--fs-base); font-weight: 640; }
.ks-rules-class { border-left: 1px solid var(--line); padding-left: 0.7rem; }
.ks-rules-class .ks-dim { font-size: 0.58rem; margin: 0 0 0.5rem; }
.ks-check { display: flex; align-items: center; gap: 0.3rem; font-size: 0.58rem; margin-bottom: 0.22rem; color: var(--text-2); }

.ks-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.7rem; margin-bottom: 0.8rem; }
.ks-stat { border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.6rem 0.75rem; background: var(--surface-2); }
.ks-stat .v { display: block; font-size: 1.5rem; font-weight: 700; color: var(--accent); line-height: 1; font-variant-numeric: tabular-nums; }
.ks-stat .v.is-bad { color: var(--down); }
.ks-stat p { margin: 0.3rem 0 0; font-size: 0.58rem; color: var(--text-3); line-height: 1.35; }

/* beyond parity */
.ks-beyond {
  border: 1px solid var(--accent-soft); border-left: 2px solid var(--teal);
  border-radius: var(--radius-sm); background: rgba(45, 212, 191, 0.06); padding: 0.9rem 1rem;
}
.ks-beyond-h { display: flex; align-items: baseline; gap: 0.6rem; margin-bottom: 0.6rem; }
.ks-beyond-h h2 { margin: 0; font-size: var(--fs-md); font-weight: 640; }
.ks-beyond-tag { font-size: 0.54rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; color: var(--teal); }
.ks-beyond-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.7rem; }
.ks-beyond-card h3 { margin: 0 0 0.2rem; font-size: var(--fs-sm); font-weight: 640; color: var(--text); }
.ks-beyond-card p { margin: 0; font-size: 0.62rem; color: var(--text-2); line-height: 1.5; }

@media (max-width: 720px) { .ks { padding: 0.85rem 0.9rem 2rem; } }
</style>

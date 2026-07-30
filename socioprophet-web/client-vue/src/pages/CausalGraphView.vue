<script setup lang="ts">
/**
 * CausalGraphView — read-only cockpit surface for a CausalGraphSnapshot.
 *
 * Minimal by design. This is the plumbing: it demonstrates that a snapshot
 * loaded from the API round-trips into a rendered surface, and that every
 * edge exposes its warrant on click. Styling and interactive layout come
 * later; a designer or later PR can turn the list into a real DAG.
 *
 * What the surface commits to today (the W11 principle):
 *   - Every edge line shows its warrant excerpts on demand.
 *   - Every hypothesis reports its claim status distinctly (proposed /
 *     evidenced / scored), so a viewer can tell a well-evidenced contested
 *     claim from a thinly-sourced confident one.
 *   - Nothing renders that hasn't passed assertWellFormed — an unwarranted
 *     edge or a broken snapshot throws, not silently displays.
 */
import { computed, ref } from 'vue';
import {
  assertWellFormed,
  contributionSummary,
  demoAutoPartsSnapshot,
  severityBadge,
  warrantsForEdge,
  warrantsForHypothesis,
} from '../features/causal-graph/state';
import type { CausalEdge, CausalHypothesis } from '../features/causal-graph/types';

const snapshot = ref(demoAutoPartsSnapshot);

// Validate at mount time; a malformed snapshot is a bug to surface, not to render.
assertWellFormed(snapshot.value);

const hypothesisById = computed(() => {
  const m: Record<string, CausalHypothesis> = {};
  for (const h of snapshot.value.hypotheses) m[h.id] = h;
  return m;
});

const expandedEdgeId = ref<string | null>(null);
const expandedHypId = ref<string | null>(null);

function toggleEdge(edge: CausalEdge) {
  expandedEdgeId.value = expandedEdgeId.value === edge.id ? null : edge.id;
}
function toggleHyp(h: CausalHypothesis) {
  expandedHypId.value = expandedHypId.value === h.id ? null : h.id;
}
</script>

<template>
  <section class="causal-graph-view">
    <header>
      <h1>{{ snapshot.displayName }}</h1>
      <p class="graph-ref">
        <code>{{ snapshot.graphRef }}</code>
      </p>
    </header>

    <section class="hypotheses" aria-label="Hypotheses">
      <h2>Hypotheses</h2>
      <ul>
        <li
          v-for="h in snapshot.hypotheses"
          :key="h.id"
          class="hypothesis"
        >
          <button
            type="button"
            class="row"
            :aria-expanded="expandedHypId === h.id"
            :aria-controls="`hyp-drill-${h.id}`"
            @click="toggleHyp(h)"
          >
            <span class="label">{{ h.label }}</span>
            <span class="badge" :data-tone="severityBadge(h).tone">
              {{ severityBadge(h).label }}
            </span>
          </button>
          <p class="statement">{{ h.hypothesis }}</p>
          <div
            v-show="expandedHypId === h.id"
            class="drill-down"
            :id="`hyp-drill-${h.id}`"
          >
            <!-- Contents render only when open (v-if inside), so DOM stays
                 small while the container stays present for aria-controls. -->
            <template v-if="expandedHypId === h.id">
              <p v-if="h.warrantRefs.length === 0" class="no-warrants">
                No warrants attached yet — status is
                <em>{{ h.claimStatus }}</em>.
              </p>
              <ul v-else class="warrants">
                <li
                  v-for="w in warrantsForHypothesis(snapshot, h)"
                  :key="w.id"
                >
                  <p class="excerpt">"{{ w.excerpt }}"</p>
                  <p class="source"><code>{{ w.sourceDocRef }}</code></p>
                </li>
              </ul>
            </template>
          </div>
        </li>
      </ul>
    </section>

    <section class="edges" aria-label="Causal edges">
      <h2>Causal edges</h2>
      <ul>
        <li
          v-for="edge in snapshot.edges"
          :key="edge.id"
          class="edge"
        >
          <button
            type="button"
            class="row"
            :aria-expanded="expandedEdgeId === edge.id"
            :aria-controls="`edge-drill-${edge.id}`"
            @click="toggleEdge(edge)"
          >
            <span class="direction">
              {{ hypothesisById[edge.fromRef]?.label ?? edge.fromRef }}
              →
              {{ hypothesisById[edge.toRef]?.label ?? edge.toRef }}
            </span>
            <span class="sign" :data-sign="edge.sign">
              {{ edge.sign }}
            </span>
          </button>
          <p class="summary">{{ contributionSummary(edge) }}</p>
          <div
            v-show="expandedEdgeId === edge.id"
            class="drill-down"
            :id="`edge-drill-${edge.id}`"
          >
            <template v-if="expandedEdgeId === edge.id">
              <h3>Warrants</h3>
              <ul class="warrants">
                <li
                  v-for="w in warrantsForEdge(snapshot, edge)"
                  :key="w.id"
                >
                  <p class="excerpt">"{{ w.excerpt }}"</p>
                  <p class="source"><code>{{ w.sourceDocRef }}</code></p>
                </li>
              </ul>
            </template>
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.causal-graph-view { padding: 1rem 1.5rem; max-width: 900px; }
h1 { margin: 0 0 0.25rem; }
.graph-ref code { font-size: 0.85em; opacity: 0.7; }
section + section { margin-top: 1.5rem; }
h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; }
ul { list-style: none; padding: 0; margin: 0.5rem 0 0; }
.hypothesis, .edge {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 0.5rem;
}
.row { display: flex; justify-content: space-between; align-items: center; width: 100%;
  background: none; border: 0; padding: 0; color: inherit; cursor: pointer; font-size: 1rem; }
.label, .direction { font-weight: 600; }
.badge { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 3px; opacity: 0.9; }
.badge[data-tone="neutral"] { background: rgba(120,120,120,0.25); }
.badge[data-tone="informational"] { background: rgba(80,150,220,0.3); }
.badge[data-tone="confident"] { background: rgba(80,200,120,0.3); }
.sign[data-sign="positive"] { color: #7dd39a; }
.sign[data-sign="negative"] { color: #e39a7d; }
.statement, .summary { margin: 0.4rem 0 0; font-size: 0.9rem; opacity: 0.85; }
.drill-down { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.15); }
.excerpt { font-style: italic; margin: 0 0 0.25rem; }
.source code { font-size: 0.8em; opacity: 0.7; }
.no-warrants em { font-style: normal; opacity: 0.8; }
</style>

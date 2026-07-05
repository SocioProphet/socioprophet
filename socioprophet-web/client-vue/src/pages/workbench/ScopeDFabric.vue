<!-- SCOPE-D · collector-policy fabric — the flagship native Vue+Carbon port of
     public/workbench/scoped_carbon.html. Renders the STAGE BODY only; App.vue owns
     the real .sp-shell (topbar / tabbar / left-rail / breadcrumbs / agent-shell).
     Same spec data and layout as the render-harness screen, composed from the
     native workbench primitive components instead of injected DOMStrings. This is
     the first screen of the render-harness → native-component migration
     (DOSSIER §7 #1/#4); the enforcement/operator/Orion/wargame surfaces follow the
     same pattern. -->
<template>
  <div class="wb-stage-body">
    <header class="surface-header">
      <div>
        <p class="eyebrow">Domain surface</p>
        <h1>SCOPE-D · collector-policy fabric</h1>
        <p class="surface-summary">
          Built from the same primitives as every other surface. Nodes = collector lanes,
          edges = policy flow, verdict = admissibility, steps = axiom chain A1–A7.
        </p>
      </div>
      <PTag text="E4/E5/E6 clear" kind="green" />
    </header>

    <div class="wb-scope-grid">
      <div>
        <div class="section-title">Axiom chain</div>
        <PSteps :list="axioms" />
      </div>

      <PGraphCanvas
        :hub="hub"
        :satellites="satellites"
        :height="520"
        hint="SCOPE-D collector-policy lane · fail-closed"
      />

      <div class="wb-scope-col">
        <PVerdict title="admissibility gate" :items="gateItems" />
        <PCard title="Collector throughput">
          <PBars :rows="throughput" />
        </PCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PBars, { type BarRow } from '../../components/workbench/PBars.vue';
import PCard from '../../components/workbench/PCard.vue';
import PGraphCanvas, { type EdgeNodeSpec } from '../../components/workbench/PGraphCanvas.vue';
import PSteps, { type Step } from '../../components/workbench/PSteps.vue';
import PTag from '../../components/workbench/PTag.vue';
import PVerdict from '../../components/workbench/PVerdict.vue';
import type { NodeSpec } from '../../components/workbench/PNode.vue';

// Spec data — verbatim from scoped_carbon.html.
const hub: NodeSpec = { label: 'SCOPE-D gate', icon: '⛨', count: null, type: 'blue', size: 44 };

const satellites: EdgeNodeSpec[] = [
  { label: 'E4 · collect', icon: '◉', count: '12', type: 'green', x: 20, y: 24, verb: 'policy', kind: 'flow', curve: true },
  { label: 'E5 · transform', icon: '◉', count: '12', type: 'green', x: 20, y: 72, verb: 'policy', kind: 'flow', curve: true },
  { label: 'E6 · engage', icon: '◉', count: '12', type: 'green', x: 74, y: 28, verb: 'gated', kind: 'flow', curve: true },
  { label: 'engagement_ready', icon: '✓', count: null, type: 'blue', x: 78, y: 70, verb: 'E4∧E5∧E6', kind: 'flow', curve: true },
];

const axioms: Step[] = [
  { op: 'A1 · authored-not-operated', count: '✓', active: true },
  { op: 'A2 · do-not-link', count: '✓' },
  { op: 'A3 · do-not-learn', count: '✓' },
  { op: 'A4 · consent boundary', count: '✓' },
  { op: 'A5 · provenance', count: '✓' },
  { op: 'A6 · fail-closed', count: '✓' },
  { op: 'A7 · Michael-only E-gate', count: '✓' },
  { op: 'Starting Point', start: true },
];

const gateItems: [string, string][] = [
  ['E4 collect', 'POS'],
  ['E5 transform', 'POS'],
  ['E6 engage', 'POS'],
  ['resolver', 'admissible'],
];

const throughput: BarRow[] = [
  { label: 'E4 ingest', value: 1975, color: 'var(--sp-green)' },
  { label: 'E5 transform', value: 1724, color: 'var(--sp-green)' },
  { label: 'E6 engage', value: 842, color: 'var(--sp-blue)' },
];
</script>

<style scoped>
.wb-stage-body {
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
}
.surface-summary {
  margin: 0.4rem 0 0;
  max-width: 56rem;
  color: var(--sp-gray-60, #525252);
}
.wb-scope-grid {
  display: grid;
  grid-template-columns: 230px 1fr 300px;
  gap: 1rem;
}
.wb-scope-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (max-width: 960px) {
  .wb-scope-grid {
    grid-template-columns: 1fr;
  }
}
</style>

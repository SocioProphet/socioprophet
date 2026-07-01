<template>
  <section class="pg-page" aria-labelledby="pg-title">
    <header class="pg-hero">
      <div>
        <p class="pg-kicker">Personal Knowledge Graph · {{ mode }}</p>
        <h1 id="pg-title">Your person-graph</h1>
        <p class="pg-lede">
          The default graph a person is built over — Self at the centre, grown from
          your workspace (contacts, calendar, mail, documents). Every node and edge
          is bound to the workspace source it came from.
        </p>
      </div>
      <div class="pg-scorecard" aria-label="Graph size">
        <span class="pg-score">{{ snapshot.summary.node_count }}</span>
        <span class="pg-score-label">nodes · {{ snapshot.summary.edge_count }} edges</span>
      </div>
    </header>

    <BoundaryNotice
      :label="mode === 'live' ? 'live' : 'fixture'"
      :message="mode === 'live'
        ? 'Live person-graph from the managed HellGraph via memory-mesh.'
        : 'Fixture person-graph. Wire VITE_PERSON_GRAPH_API_BASE to the workspace_ingestion backend for live data.'"
    />

    <RouteStatePanel
      :state="mode === 'live' ? 'ready' : 'mock'"
      :title="mode === 'live' ? 'Live graph' : 'Fixture graph'"
      :message="loadError
        ? `Backend unavailable (${loadError}); showing the fixture person-graph.`
        : `${groups.length} entity groups and ${snapshot.edges.length} relationships loaded. External-KG links are reference-only.`"
    />

    <!-- Ego view: Self at centre, neighbours around it -->
    <section class="pg-ego" aria-label="Ego graph">
      <svg :viewBox="`0 0 ${EGO_W} ${EGO_H}`" role="img" class="pg-ego-svg">
        <title>Ego graph: Self connected to {{ neighbours.length }} entities</title>
        <line
          v-for="n in neighbours"
          :key="`l-${n.node.id}`"
          :x1="EGO_W / 2" :y1="EGO_H / 2" :x2="n.x" :y2="n.y"
          class="pg-ego-edge"
        />
        <g>
          <circle :cx="EGO_W / 2" :cy="EGO_H / 2" r="30" class="pg-ego-self" />
          <text :x="EGO_W / 2" :y="EGO_H / 2 + 4" text-anchor="middle" class="pg-ego-self-t">You</text>
        </g>
        <g v-for="n in neighbours" :key="`n-${n.node.id}`">
          <circle :cx="n.x" :cy="n.y" r="22" :class="['pg-ego-node', `pg-ego-node--${n.node.kind.toLowerCase()}`]" />
          <text :x="n.x" :y="n.y - 28" text-anchor="middle" class="pg-ego-node-t">{{ n.node.label }}</text>
          <text :x="(EGO_W / 2 + n.x) / 2" :y="(EGO_H / 2 + n.y) / 2 - 4" text-anchor="middle" class="pg-ego-rel">{{ n.relation }}</text>
        </g>
      </svg>
    </section>

    <!-- Entities grouped by kind -->
    <section class="pg-grid" aria-label="Entities">
      <article v-for="group in groups" :key="group.kind" class="pg-card">
        <h2>{{ group.kind }} <span class="pg-count">{{ group.nodes.length }}</span></h2>
        <ul class="pg-entities">
          <li v-for="entity in group.nodes" :key="entity.id" class="pg-entity">
            <div>
              <strong>{{ entity.label }}</strong>
              <p class="pg-prov">{{ entity.provenance_refs.join(', ') }}</p>
            </div>
          </li>
        </ul>
      </article>
    </section>

    <!-- Provenance ledger -->
    <section class="pg-card pg-prov-ledger" aria-label="Provenance">
      <h2>Sources <span class="pg-count">{{ sources.length }}</span></h2>
      <ul class="pg-sources">
        <li v-for="src in sources" :key="src"><code>{{ src }}</code></li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import {
  demoPersonGraphSnapshot,
  fetchPersonGraphSnapshotWithFallback,
  type PersonGraphMode,
  type PersonGraphSnapshot,
} from '../api/personGraphApi';
import type { KGNode } from '../runtime-adapters/knowledgeGraphClient';

const EGO_W = 720;
const EGO_H = 360;

const snapshot = ref<PersonGraphSnapshot>(demoPersonGraphSnapshot());
const mode = ref<PersonGraphMode>('fixture');
const loadError = ref<string | undefined>(undefined);

onMounted(async () => {
  const result = await fetchPersonGraphSnapshotWithFallback();
  snapshot.value = result.snapshot;
  mode.value = result.mode;
  loadError.value = result.error;
});

const groups = computed(() => {
  const byKind = new Map<string, KGNode[]>();
  for (const n of snapshot.value.nodes) {
    if (n.kind === 'Self') continue;
    if (!byKind.has(n.kind)) byKind.set(n.kind, []);
    byKind.get(n.kind)!.push(n);
  }
  return [...byKind.entries()].map(([kind, nodes]) => ({ kind, nodes }));
});

// First-degree neighbours of Self, laid out on a circle for the ego SVG.
const neighbours = computed(() => {
  const selfId = snapshot.value.self.id;
  const nodeById = new Map(snapshot.value.nodes.map((n) => [n.id, n]));
  const direct = snapshot.value.edges.filter((e) => e.source === selfId);
  const cx = EGO_W / 2;
  const cy = EGO_H / 2;
  const radius = 130;
  return direct.map((e, i) => {
    const angle = (2 * Math.PI * i) / Math.max(direct.length, 1) - Math.PI / 2;
    const node = nodeById.get(e.target) ?? { id: e.target, label: e.target, kind: 'Thing', properties: {}, provenance_refs: [] };
    return { node, relation: e.predicate, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
});

const sources = computed(() => {
  const set = new Set<string>();
  for (const n of snapshot.value.nodes) n.provenance_refs.forEach((r) => set.add(r));
  for (const e of snapshot.value.edges) e.provenance_refs.forEach((r) => set.add(r));
  return [...set].sort();
});
</script>

<style scoped>
.pg-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
.pg-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; }
.pg-kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; opacity: 0.7; margin: 0; }
.pg-hero h1 { margin: 0.25rem 0; font-size: 1.6rem; }
.pg-lede { margin: 0; max-width: 60ch; opacity: 0.85; }
.pg-scorecard { text-align: right; }
.pg-score { display: block; font-size: 2rem; font-weight: 700; }
.pg-score-label { font-size: 0.75rem; opacity: 0.7; }

.pg-ego { border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 0.5rem; }
.pg-ego-svg { width: 100%; height: auto; }
.pg-ego-edge { stroke: rgba(148, 163, 184, 0.5); stroke-width: 1.4; }
.pg-ego-self { fill: #2563eb; }
.pg-ego-self-t { fill: #fff; font-size: 12px; font-weight: 700; }
.pg-ego-node { fill: #475569; }
.pg-ego-node--person { fill: #0d9488; }
.pg-ego-node--organization { fill: #b45309; }
.pg-ego-node--event { fill: #7c3aed; }
.pg-ego-node--document { fill: #0369a1; }
.pg-ego-node-t { fill: currentColor; font-size: 11px; font-weight: 600; }
.pg-ego-rel { fill: currentColor; font-size: 9px; opacity: 0.65; }

.pg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.pg-card { border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 1rem; }
.pg-card h2 { margin: 0 0 0.75rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.pg-count { font-size: 0.75rem; background: rgba(148, 163, 184, 0.2); border-radius: 999px; padding: 0.1rem 0.5rem; }
.pg-entities, .pg-sources { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.pg-entity strong { display: block; }
.pg-prov { margin: 0.15rem 0 0; font-size: 0.7rem; opacity: 0.6; font-family: ui-monospace, monospace; }
.pg-prov-ledger code { font-size: 0.72rem; }
</style>

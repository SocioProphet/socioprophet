<template>
  <section class="surface" aria-label="Knowledge Graph">
    <header class="head">
      <div>
        <p v-if="scope && !scope.isPrimary" class="kg-eyebrow">{{ scope.domain }}</p>
        <h1>{{ scope && !scope.isPrimary ? scope.label : 'Knowledge Graph' }}</h1>
        <p>Live HellGraph subgraph — view-scoped, degree-ranked. Click a node to re-root.</p>
      </div>
      <div class="views">
        <button v-for="v in views" :key="v" class="vbtn" :class="{ on: view === v }" @click="view = v; root = ''; load()">{{ v }}</button>
        <button class="btn" @click="root = ''; load()">Reset</button>
      </div>
    </header>

    <div class="bar">
      <span v-if="health" class="stat">graph: <b>{{ health.nodes ?? '—' }}</b> nodes · <b>{{ health.edges ?? '—' }}</b> edges</span>
      <span v-if="data" class="stat">showing <b>{{ data.nodes.length }}</b> · <b>{{ data.links.length }}</b> links</span>
      <span v-if="root" class="rooted">rooted at <b>{{ rootLabel }}</b></span>
    </div>

    <p v-if="error" class="error">{{ error }} — run the Agent Machine (dev:app) with the HellGraph sidecar.</p>
    <p v-else-if="!data" class="muted">Loading subgraph…</p>
    <p v-else-if="data.nodes.length === 0" class="muted">No nodes in this view yet — ingest interactions to populate the graph.</p>

    <div v-else class="canvas-wrap">
      <svg :viewBox="`0 0 ${W} ${H}`" class="canvas" role="img" aria-label="graph">
        <line v-for="(l, i) in laidLinks" :key="i" :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
              :class="{ primary: l.primary }" />
        <g v-for="n in laidNodes" :key="n.id" class="node" :class="{ featured: n.featured }"
           :transform="`translate(${n.x},${n.y})`" @click="reRoot(n.id)">
          <circle :r="n.r" :fill="catColor(n.category)" :stroke-width="n.id === root ? 3 : 1" />
          <text :y="n.r + 11" text-anchor="middle">{{ trim(n.label) }}</text>
        </g>
      </svg>
      <div class="legend">
        <span v-for="c in legend" :key="c.cat" class="lg"><i :style="{ background: c.color }" />{{ c.cat }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
// Reads the CANONICAL hellgraph-service (shared with the Prophet Studio Graph Explorer) — one graph
// across every surface. Types still come from agentMachineApi (the surface contract is mirrored).
import { graphSurface, graphHealth } from '../services/hellgraphApi';
import type { SurfaceResult, GraphHealth } from '../services/agentMachineApi';
import { navScopeForPath } from '../config/cockpitNav';

const route = useRoute();
// Active lens — e.g. the Ontology & Epistemology capability realized here.
const scope = computed(() => navScopeForPath(route.path));

const views = ['all', 'knowledge', 'tech', 'people'] as const;
const view = ref<(typeof views)[number]>('all');
const root = ref('');
const data = ref<SurfaceResult | null>(null);
const health = ref<GraphHealth | null>(null);
const error = ref('');

const W = 720, H = 460;

async function load() {
  error.value = '';
  try { data.value = await graphSurface(view.value, 34, root.value); }
  catch (e) { error.value = e instanceof Error ? e.message : 'unreachable'; }
}
function reRoot(id: string) { root.value = id; load(); }

onMounted(async () => {
  // Deep-link: other surfaces (e.g. Supply Chain) re-root the graph on a node.
  const r = typeof route.query.root === 'string' ? route.query.root : '';
  if (r) root.value = r;
  void load();
  try { health.value = await graphHealth(); } catch { /* health is best-effort */ }
});

const rootLabel = computed(() => data.value?.nodes.find((n) => n.id === root.value)?.label ?? root.value);

// Deterministic radial layout: highest-degree node at center, rest on a ring
// ordered by degree (bigger = closer in). No external force lib — self-contained SVG.
const laidNodes = computed(() => {
  const nodes = [...(data.value?.nodes ?? [])].sort((a, b) => b.degree - a.degree);
  if (!nodes.length) return [];
  const cx = W / 2, cy = H / 2;
  const maxDeg = Math.max(1, ...nodes.map((n) => n.degree));
  return nodes.map((n, i) => {
    const r = 7 + Math.round((n.degree / maxDeg) * 11);
    if (i === 0) return { ...n, x: cx, y: cy, r };
    const ring = i <= 12 ? 1 : 2;
    const inRing = i <= 12 ? i - 1 : i - 13;
    const count = ring === 1 ? Math.min(12, nodes.length - 1) : nodes.length - 13;
    const ang = (inRing / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
    const rad = ring === 1 ? 130 : 205;
    return { ...n, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad * 0.82, r };
  });
});

const laidLinks = computed(() => {
  const pos = new Map(laidNodes.value.map((n) => [n.id, n]));
  return (data.value?.links ?? []).flatMap((l) => {
    const s = pos.get(l.source), t = pos.get(l.target);
    return s && t ? [{ x1: s.x, y1: s.y, x2: t.x, y2: t.y, primary: l.primary }] : [];
  });
});

const PALETTE: Record<string, string> = {
  learning: '#4ade80', knowledge: '#4ade80', tech: '#60a5fa', code: '#60a5fa',
  people: '#f472b6', person: '#f472b6', concept: '#a78bfa', topic: '#fbbf24', default: '#94a3b8',
};
const catColor = (c: string) => PALETTE[c] ?? PALETTE.default;
const legend = computed(() => {
  const cats = [...new Set((data.value?.nodes ?? []).map((n) => n.category))].slice(0, 6);
  return cats.map((cat) => ({ cat, color: catColor(cat) }));
});
const trim = (s: string) => (s.length > 18 ? s.slice(0, 17) + '…' : s);
</script>

<style scoped>
.surface { display: grid; gap: 1rem; max-width: 900px; margin: 1rem auto; padding: 1.5rem 1.75rem; background: var(--bg); color: rgba(255, 255, 255, 0.92); border: 1px solid var(--line-2); border-radius: 16px; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
h1 { margin: 0; font-size: 1.25rem; } .head p { margin: 0.25rem 0 0; color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; }
.head .kg-eyebrow { margin: 0 0 0.1rem; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); }
.views { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.vbtn { border: 1px solid rgba(255, 255, 255, 0.16); background: transparent; color: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 0.25rem 0.6rem; font-size: 0.75rem; text-transform: capitalize; cursor: pointer; } .vbtn.on { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border-color: transparent; }
.btn { border: 1px solid rgba(255, 255, 255, 0.18); background: transparent; color: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 0.25rem 0.6rem; font-size: 0.75rem; cursor: pointer; }
.bar { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.76rem; color: rgba(255, 255, 255, 0.6); }
.bar b { color: rgba(255, 255, 255, 0.9); } .rooted { color: #93c5fd; }
.error { color: #fca5a5; font-size: 0.85rem; } .muted { color: rgba(255, 255, 255, 0.5); font-size: 0.82rem; }
.canvas-wrap { border: 1px solid var(--line-2); border-radius: 16px; background: radial-gradient(circle at 50% 40%, rgba(216, 162, 80, 0.05), transparent 70%), var(--surface); overflow: hidden; }
.canvas { width: 100%; display: block; }
.canvas line { stroke: rgba(255, 255, 255, 0.1); stroke-width: 1; } .canvas line.primary { stroke: rgba(147, 197, 253, 0.4); stroke-width: 1.4; }
.node { cursor: pointer; } .node circle { stroke: rgba(255, 255, 255, 0.55); transition: r 0.15s; } .node:hover circle { stroke: #fff; }
.node text { fill: rgba(255, 255, 255, 0.72); font-size: 8.5px; pointer-events: none; } .node.featured text { fill: #fff; font-weight: 600; }
.legend { display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 0.5rem 0.9rem; border-top: 1px solid rgba(255, 255, 255, 0.08); }
.lg { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.68rem; color: rgba(255, 255, 255, 0.6); text-transform: capitalize; } .lg i { width: 9px; height: 9px; border-radius: 50%; }
</style>

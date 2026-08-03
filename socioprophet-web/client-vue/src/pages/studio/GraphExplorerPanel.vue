<script setup lang="ts">
/**
 * Graph Explorer — the marketing Platform Explorer feature set (Graph mode Topology/Vector/Hybrid,
 * Explore mode Global/Local/DRIFT, similarity threshold, topic constituents, category legend, node
 * details) brought into the canonical Vue app, PLUS a Kiali-style runtime overlay (per-node health
 * + traffic from the estate's telemetry / catalog-gateway).
 *
 * Consume-not-fork: the graph logic is the ported, DOM-free model in features/graph-explorer.
 * Data is loaded live-first (HellGraph + catalog-gateway) with a bundled/fixture fallback, so the
 * panel is data-driven, never hand-maintained prose.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3';
import LiveToggle from '../../components/LiveToggle.vue';
import {
  applyRuntimeOverlay,
  CATEGORY_LEGEND,
  colorForHealth,
  colorForNode,
  computeActiveGraph,
  runtimeSummary,
} from '../../features/graph-explorer/model';
import { loadRuntimeTopology, loadSurfaceGraph } from '../../features/graph-explorer/dataSource';
import type {
  ExplorerState,
  GraphMode,
  ExploreMode,
  RuntimeTopology,
  SurfaceGraph,
} from '../../features/graph-explorer/types';
import { SURFACE_GRAPH_FIXTURE } from '../../features/graph-explorer/fixture';
import { RUNTIME_TOPOLOGY_FIXTURE } from '../../features/graph-explorer/fixture';

const WIDTH = 1100;
const HEIGHT = 720;

/** Seed synchronously with the fixture so the panel (and tests) render immediately; live load overwrites. */
const graph = shallowRef<SurfaceGraph>(SURFACE_GRAPH_FIXTURE);
const runtime = shallowRef<RuntimeTopology>(RUNTIME_TOPOLOGY_FIXTURE);
const graphSource = ref<'live' | 'bundled' | 'fixture'>('fixture');
const runtimeSource = ref<'live' | 'fixture'>('fixture');
const liveState = ref<'idle' | 'loading' | 'live' | 'error'>('idle');

const state = reactive<ExplorerState>({
  viewMode: 'topology',
  searchMode: 'global',
  threshold: 0.12,
  showTopics: false,
  showExternal: true,
  query: '',
  selectedId: null,
  expandedSurfaceId: null,
});

const showRuntime = ref(true);

const legend = CATEGORY_LEGEND;

// ── Derived graph ─────────────────────────────────────────────────────────────
const active = computed(() => computeActiveGraph(graph.value, state));
const annotated = computed(() => applyRuntimeOverlay(active.value.nodes, showRuntime.value ? runtime.value : null));
const summary = computed(() => runtimeSummary(showRuntime.value ? runtime.value : null));

// ── Static force layout (settled synchronously — deterministic, no timers) ──────
type PositionedNode = ReturnType<typeof applyRuntimeOverlay>[number] & { x: number; y: number };
const positioned = ref<PositionedNode[]>([]);
const posMap = computed(() => new Map(positioned.value.map((n) => [n.id, n])));

function relayout() {
  const nodes = annotated.value.map((n, i) => {
    const angle = (i / Math.max(1, annotated.value.length)) * Math.PI * 2;
    const radius = n.type === 'topic' ? 260 : 180;
    return { ...n, x: WIDTH / 2 + Math.cos(angle) * radius, y: HEIGHT / 2 + Math.sin(angle) * radius };
  });
  const idset = new Set(nodes.map((n) => n.id));
  const links = active.value.links
    .filter((l) => idset.has(l.source) && idset.has(l.target))
    .map((l) => ({ ...l }));

  const sim = forceSimulation(nodes)
    .force(
      'link',
      forceLink(links)
        .id((d: unknown) => (d as { id: string }).id)
        .distance((l: unknown) => {
          const t = (l as { type?: string }).type;
          return t === 'constituent' ? 70 : t === 'vector' ? 150 : 115;
        })
        .strength((l: unknown) => ((l as { type?: string }).type === 'vector' ? 0.2 : 0.45)),
    )
    .force('charge', forceManyBody().strength((d: unknown) => ((d as { type: string }).type === 'topic' ? -110 : -340)))
    .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
    .force('collision', forceCollide().radius((d: unknown) => ((d as { type: string }).type === 'topic' ? 16 : 34)))
    .stop();

  for (let i = 0; i < 300; i += 1) sim.tick();
  for (const n of nodes as PositionedNode[]) {
    n.x = Math.max(30, Math.min(WIDTH - 30, n.x));
    n.y = Math.max(30, Math.min(HEIGHT - 30, n.y));
  }
  positioned.value = nodes as PositionedNode[];
}

const renderLinks = computed(() =>
  active.value.links
    .map((l) => {
      const a = posMap.value.get(l.source);
      const b = posMap.value.get(l.target);
      return a && b ? { ...l, x1: a.x, y1: a.y, x2: b.x, y2: b.y } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null),
);

// Populate synchronously so the first render already has the settled layout (no empty first paint).
relayout();
watch([() => ({ ...state }), showRuntime, graph, runtime], relayout, { deep: true });

// ── Selection / details ─────────────────────────────────────────────────────────
const selectedNode = computed(() => {
  if (!state.selectedId) return null;
  return (
    annotated.value.find((n) => n.id === state.selectedId) ??
    applyRuntimeOverlay(
      graph.value.nodes.filter((n) => n.id === state.selectedId),
      showRuntime.value ? runtime.value : null,
    )[0] ??
    null
  );
});

function selectNode(id: string) {
  state.selectedId = state.selectedId === id ? null : id;
}
function toggleExpand(id: string) {
  state.expandedSurfaceId = state.expandedSurfaceId === id ? null : id;
}

function isNeighbor(id: string): boolean {
  if (!state.selectedId) return true;
  if (id === state.selectedId) return true;
  return active.value.links.some(
    (l) =>
      (l.source === state.selectedId && l.target === id) ||
      (l.target === state.selectedId && l.source === id),
  );
}

function docsHref(node: NonNullable<typeof selectedNode.value>): string | null {
  const raw = String(node.docs_path ?? '');
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('/documentation/')) return raw;
  if (raw.startsWith('/guide/')) return `/documentation${raw.replace(/\/?$/, '/')}`;
  return `/documentation/guide/${raw.replace(/^\/+/, '').replace(/\/?$/, '/')}`;
}

// ── Live data ─────────────────────────────────────────────────────────────────
async function goLive() {
  liveState.value = 'loading';
  try {
    const [g, r] = await Promise.all([loadSurfaceGraph(), loadRuntimeTopology()]);
    graph.value = g.graph;
    graphSource.value = g.source;
    runtime.value = r.runtime;
    runtimeSource.value = r.source;
    // "live" only if at least one plane actually reached a live endpoint.
    liveState.value = g.source === 'live' || r.source === 'live' ? 'live' : 'error';
  } catch {
    liveState.value = 'error';
  }
}

onMounted(relayout);
onBeforeUnmount(() => {
  /* nothing to tear down — the simulation is settled synchronously */
});

const modes: { value: GraphMode; label: string }[] = [
  { value: 'topology', label: 'Topology' },
  { value: 'vector', label: 'Vector similarity' },
  { value: 'hybrid', label: 'Hybrid' },
];
const exploreModes: { value: ExploreMode; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'local', label: 'Local' },
  { value: 'drift', label: 'DRIFT-like' },
];
</script>

<template>
  <div class="ge">
    <!-- Controls -->
    <aside class="ge-controls card">
      <h3>Controls</h3>

      <label class="fld" for="ge-mode">Graph mode</label>
      <select id="ge-mode" v-model="state.viewMode" class="ge-mode-graph">
        <option v-for="m in modes" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
      <p class="hint">Topology uses curated links. Vector computes similarity from the ontology. Hybrid combines both.</p>

      <label class="fld" for="ge-explore">Explore mode</label>
      <select id="ge-explore" v-model="state.searchMode" class="ge-mode-explore">
        <option v-for="m in exploreModes" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
      <p class="hint">Global = full topology · Local = immediate neighbours · DRIFT-like = wider neighbourhood.</p>

      <label class="fld" for="ge-threshold">Similarity threshold <span class="mono">{{ state.threshold.toFixed(2) }}</span></label>
      <input
        id="ge-threshold"
        v-model.number="state.threshold"
        class="ge-threshold"
        type="range"
        min="0"
        max="0.6"
        step="0.01"
      />

      <label class="chk"><input v-model="state.showTopics" type="checkbox" class="ge-show-topics" /> Show topic constituents</label>
      <label class="chk"><input v-model="state.showExternal" type="checkbox" /> Show external sites</label>
      <label class="chk"><input v-model="showRuntime" type="checkbox" class="ge-show-runtime" /> Runtime overlay (health + traffic)</label>

      <label class="fld" for="ge-query">Filter</label>
      <input id="ge-query" v-model="state.query" type="search" class="ge-query" placeholder="academy, trust, governance…" />

      <div class="legend">
        <div class="legend-title">Category</div>
        <div v-for="c in legend" :key="c.key" class="legend-item">
          <span class="dot" :style="{ background: c.color }"></span>{{ c.label }}
        </div>
      </div>

      <div v-if="showRuntime" class="legend">
        <div class="legend-title">Runtime health</div>
        <div class="legend-item"><span class="dot" :style="{ background: colorForHealth('healthy') }"></span>Healthy · {{ summary.healthy }}</div>
        <div class="legend-item"><span class="dot" :style="{ background: colorForHealth('degraded') }"></span>Degraded · {{ summary.degraded }}</div>
        <div class="legend-item"><span class="dot" :style="{ background: colorForHealth('down') }"></span>Down · {{ summary.down }}</div>
      </div>
    </aside>

    <!-- Graph canvas -->
    <section class="ge-canvas card">
      <div class="ge-toolbar">
        <span class="pill">{{ active.nodes.length }} nodes</span>
        <span class="pill">{{ active.links.length }} edges</span>
        <span class="pill" :class="graphSource === 'live' ? 'good' : ''">ontology: {{ graphSource }}</span>
        <span v-if="showRuntime" class="pill" :class="runtimeSource === 'live' ? 'good' : ''">runtime: {{ runtimeSource }}</span>
        <LiveToggle :state="liveState" label="Go live" live-text="Live" @click="goLive" />
      </div>
      <svg class="ge-svg" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" aria-label="Prophet Platform graph explorer">
        <g class="ge-edges">
          <line
            v-for="(l, i) in renderLinks"
            :key="`e${i}`"
            class="ge-edge"
            :class="`link-${l.type ?? 'curated'}`"
            :x1="l.x1"
            :y1="l.y1"
            :x2="l.x2"
            :y2="l.y2"
          />
        </g>
        <g class="ge-nodes">
          <g
            v-for="n in positioned"
            :key="n.id"
            class="ge-node"
            :class="[`type-${n.type}`, showRuntime ? `health-${n.runtime.health}` : '', n.id === state.selectedId ? 'selected' : '', isNeighbor(n.id) ? '' : 'dim']"
            :transform="`translate(${n.x},${n.y})`"
            @click="selectNode(n.id)"
          >
            <circle
              :r="n.type === 'topic' ? 9 : 22"
              :fill="colorForNode(n)"
              :stroke="showRuntime && n.type === 'surface' ? colorForHealth(n.runtime.health) : '#ffffff'"
              :stroke-width="showRuntime && n.type === 'surface' && n.runtime.health !== 'unknown' ? 4 : 2"
            />
            <text
              v-if="n.type === 'surface' || state.showTopics || state.expandedSurfaceId"
              class="ge-label"
              :y="n.type === 'topic' ? -14 : 38"
              text-anchor="middle"
            >{{ n.label }}</text>
          </g>
        </g>
      </svg>
    </section>

    <!-- Details -->
    <aside class="ge-detail card">
      <h3>Details</h3>
      <p v-if="!selectedNode" class="desc">Select a node to inspect its description, routes, related surfaces, topic constituents — and its live runtime health.</p>
      <template v-else>
        <div class="det-title">{{ selectedNode.label }}</div>
        <div class="small">
          {{ selectedNode.type }}<template v-if="selectedNode.category"> · {{ selectedNode.category }}</template><template v-if="selectedNode.status"> · {{ selectedNode.status }}</template>
        </div>
        <p class="desc">{{ selectedNode.description || 'No description available.' }}</p>

        <div v-if="showRuntime && selectedNode.type === 'surface'" class="runtime-block" :class="`health-${selectedNode.runtime.health}`">
          <div class="kpi-l">Runtime</div>
          <div class="rt-row">
            <span class="rt-badge" :style="{ color: colorForHealth(selectedNode.runtime.health) }">● {{ selectedNode.runtime.health }}</span>
            <span v-if="selectedNode.runtime.service" class="mono small">{{ selectedNode.runtime.service }}</span>
          </div>
          <div class="rt-metrics">
            <span>{{ (selectedNode.runtime.rps ?? 0).toFixed(0) }} rps</span>
            <span>{{ ((selectedNode.runtime.errorRate ?? 0) * 100).toFixed(1) }}% err</span>
            <span>p95 {{ (selectedNode.runtime.p95Ms ?? 0).toFixed(0) }} ms</span>
          </div>
        </div>

        <button v-if="selectedNode.type === 'surface'" class="btn ghost expand-btn" @click="toggleExpand(selectedNode.id)">
          {{ state.expandedSurfaceId === selectedNode.id ? 'Collapse constituents' : 'Expand constituents' }}
        </button>

        <template v-if="(selectedNode.audiences ?? []).length">
          <div class="kpi-l">Audiences</div>
          <div class="badges"><span v-for="a in selectedNode.audiences" :key="a" class="pill">{{ a }}</span></div>
        </template>
        <template v-if="(selectedNode.topic_constituents ?? []).length">
          <div class="kpi-l">Topic constituents</div>
          <div class="badges"><span v-for="t in selectedNode.topic_constituents" :key="t" class="pill">{{ t }}</span></div>
        </template>
        <template v-if="(selectedNode.related_surfaces ?? []).length">
          <div class="kpi-l">Related surfaces</div>
          <ul class="rel"><li v-for="r in selectedNode.related_surfaces" :key="r">{{ r }}</li></ul>
        </template>

        <div class="kpi-l">Links</div>
        <div class="det-links">
          <a v-if="selectedNode.landing_page" :href="selectedNode.landing_page">Landing page</a>
          <a v-if="docsHref(selectedNode)" :href="docsHref(selectedNode)!" target="_blank" rel="noopener">Documentation</a>
          <template v-if="state.showExternal">
            <a v-for="s in selectedNode.related_sites ?? []" :key="s" :href="s" target="_blank" rel="noopener">{{ s }}</a>
          </template>
        </div>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.ge { display: grid; grid-template-columns: 260px minmax(0, 1fr) 320px; gap: 0.9rem; height: calc(100vh - 12rem); min-height: 560px; }
.ge-controls, .ge-detail { overflow: auto; }
.ge-canvas { display: flex; flex-direction: column; min-height: 0; padding: 0.6rem; }
.ge h3 { margin: 0 0 0.7rem; font-size: 0.95rem; }
.hint { color: var(--muted); font-size: 0.72rem; margin: 0.25rem 0 0.9rem; }
.ge select, .ge input[type='search'] { width: 100%; margin-bottom: 0.2rem; }
.ge input[type='range'] { width: 100%; margin: 0.2rem 0 0.9rem; }
.chk { display: flex; align-items: center; gap: 0.45rem; font-size: 0.82rem; color: var(--text); margin: 0.35rem 0; cursor: pointer; }
.chk input { width: auto; }
.legend { margin-top: 1rem; display: grid; gap: 0.4rem; }
.legend-title { color: var(--faint); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; }
.legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--muted); }
.dot { width: 0.8rem; height: 0.8rem; border-radius: 999px; display: inline-block; }
.ge-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem; margin-bottom: 0.5rem; }
.ge-svg { flex: 1; min-height: 0; width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; }
.ge-edge { stroke: #64748b; stroke-width: 2; opacity: 0.7; }
.ge-edge.link-vector { stroke: #94a3b8; stroke-width: 1.5; stroke-dasharray: 5 4; }
.ge-edge.link-constituent { stroke: #475569; stroke-width: 1.3; opacity: 0.6; }
.ge-node { cursor: pointer; }
.ge-node.dim { opacity: 0.25; }
.ge-node.selected circle { stroke: var(--accent); stroke-width: 4; }
.ge-label { fill: var(--text); font-size: 12px; font-weight: 600; pointer-events: none; }
.type-topic .ge-label { fill: var(--muted); font-size: 11px; font-weight: 500; }
.det-title { font-size: 1.05rem; font-weight: 600; }
.small { color: var(--muted); font-size: 0.78rem; margin: 0.15rem 0 0.4rem; }
.badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.3rem 0 0.7rem; }
.rel { margin: 0.3rem 0 0.7rem; padding-left: 1.1rem; color: var(--muted); font-size: 0.82rem; }
.kpi-l { color: var(--faint); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.6rem; }
.det-links { display: grid; gap: 0.3rem; margin-top: 0.3rem; }
.det-links a { color: var(--accent-ink, var(--accent)); font-size: 0.82rem; text-decoration: none; word-break: break-all; }
.det-links a:hover { text-decoration: underline; }
.runtime-block { border: 1px solid var(--border-2); border-left: 3px solid var(--muted); border-radius: 8px; padding: 0.5rem 0.6rem; margin: 0.6rem 0; }
.runtime-block.health-healthy { border-left-color: var(--good); }
.runtime-block.health-degraded { border-left-color: var(--warn); }
.runtime-block.health-down { border-left-color: var(--bad); }
.rt-row { display: flex; align-items: center; gap: 0.5rem; }
.rt-badge { font-weight: 600; font-size: 0.82rem; text-transform: capitalize; }
.rt-metrics { display: flex; gap: 0.7rem; margin-top: 0.35rem; color: var(--muted); font-size: 0.76rem; font-family: var(--mono, monospace); }
.expand-btn { margin: 0.4rem 0 0.2rem; }
</style>

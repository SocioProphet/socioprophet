<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { loadGraph, EPISTEMIC_COLORS, type GraphView, type GraphNode, type GraphEdge } from "../services/studioApi";

const props = defineProps<{ project: string }>();
const view = ref<GraphView | null>(null);
const loading = ref(true);
const error = ref("");
const selected = ref<SimNode | null>(null);
const hovered = ref<SimNode | null>(null);

// ── the graph explorer: a real force-directed layout (Bostock's velocity-Verlet, hand-rolled — no
// external lib) with Tufte layering — edges recede, epistemic-mode colour is the only ink that varies,
// neighbourhood comes to focus on hover. Bloom colours by label; we colour by EPISTEMIC STATUS + carry
// provenance per node. That's the moat, drawn on their own field.

const VB_W = 900, VB_H = 560;                 // viewBox coordinate space (SVG scales responsively)
interface SimNode extends GraphNode { x: number; y: number; vx: number; vy: number; fx: number | null; fy: number | null; deg: number; r: number }
type SimEdge = { id: string; s: SimNode; t: SimNode; label: string; weight: number };

const simNodes = shallowRef<SimNode[]>([]);
const simEdges = shallowRef<SimEdge[]>([]);
const frame = ref(0);                          // one reactive tick per rAF → template re-reads positions
const transform = ref({ k: 1, x: 0, y: 0 });   // pan/zoom in viewBox units

let raf = 0, alpha = 0;
const adjacency = new Map<string, Set<string>>();

function color(mode: string) { return EPISTEMIC_COLORS[mode] ?? EPISTEMIC_COLORS.unknown; }

// ── build the simulation from a GraphView ─────────────────────────────────────
function build(v: GraphView) {
  const nodes: SimNode[] = v.nodes.map((n, i) => {
    // seed on a circle (deterministic, avoids the degenerate all-at-centre start)
    const a = (i / Math.max(1, v.nodes.length)) * Math.PI * 2;
    return { ...n, x: VB_W / 2 + Math.cos(a) * 160, y: VB_H / 2 + Math.sin(a) * 160,
             vx: 0, vy: 0, fx: null, fy: null, deg: 0, r: 6 };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: SimEdge[] = [];
  adjacency.clear();
  for (const e of (v.edges ?? []) as GraphEdge[]) {
    const s = byId.get(e.source), t = byId.get(e.target);
    if (!s || !t) continue;                    // induced subgraph should prevent this, but be safe
    edges.push({ id: e.id, s, t, label: e.label, weight: e.weight ?? 1 });
    s.deg++; t.deg++;
    (adjacency.get(s.id) ?? adjacency.set(s.id, new Set()).get(s.id)!).add(t.id);
    (adjacency.get(t.id) ?? adjacency.set(t.id, new Set()).get(t.id)!).add(s.id);
  }
  for (const n of nodes) n.r = 5 + Math.sqrt(n.deg) * 3;   // radius encodes degree (Tufte: encode the data)
  simNodes.value = nodes; simEdges.value = edges;
  reheat();
}

// ── force tick: charge (repulsion) + links (springs) + gravity + light collision ──
const L = 92, CHARGE = -520, LINK_K = 0.45, GRAV = 0.028, VDECAY = 0.62;
function tick() {
  const ns = simNodes.value, es = simEdges.value;
  const n = ns.length;
  // many-body repulsion (O(n²) — fine to a few hundred nodes)
  for (let i = 0; i < n; i++) {
    const a = ns[i];
    for (let j = i + 1; j < n; j++) {
      const b = ns[j];
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 1;
      const f = (CHARGE * alpha) / d2;
      const d = Math.sqrt(d2); dx /= d; dy /= d;
      a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
      // light collision so labels don't stack
      const min = a.r + b.r + 6;
      if (d < min) { const push = (min - d) / d * 0.5 * alpha * 6; a.vx += dx * push; a.vy += dy * push; b.vx -= dx * push; b.vy -= dy * push; }
    }
  }
  // link springs
  for (const e of es) {
    let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y, d = Math.hypot(dx, dy) || 1;
    const f = ((d - L) / d) * LINK_K * alpha;
    dx *= f; dy *= f;
    e.s.vx += dx; e.s.vy += dy; e.t.vx -= dx; e.t.vy -= dy;
  }
  // centering gravity + integrate
  for (const p of ns) {
    p.vx += (VB_W / 2 - p.x) * GRAV * alpha;
    p.vy += (VB_H / 2 - p.y) * GRAV * alpha;
    if (p.fx != null) { p.x = p.fx; p.vx = 0; } else { p.vx *= VDECAY; p.x += p.vx; }
    if (p.fy != null) { p.y = p.fy; p.vy = 0; } else { p.vy *= VDECAY; p.y += p.vy; }
  }
  alpha *= 0.985;
}
function loop() {
  tick(); frame.value++;
  if (alpha > 0.02) raf = requestAnimationFrame(loop); else raf = 0;
}
function reheat() { alpha = Math.max(alpha, 0.9); if (!raf) raf = requestAnimationFrame(loop); }

// ── pointer: drag nodes, pan/zoom the field ───────────────────────────────────
const svgEl = ref<SVGSVGElement | null>(null);
let dragNode: SimNode | null = null, panning = false, panStart = { x: 0, y: 0, tx: 0, ty: 0 };

function toViewBox(clientX: number, clientY: number) {
  const svg = svgEl.value!; const r = svg.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * VB_W, y: ((clientY - r.top) / r.height) * VB_H };
}
function toGraph(clientX: number, clientY: number) {
  const vb = toViewBox(clientX, clientY); const t = transform.value;
  return { x: (vb.x - t.x) / t.k, y: (vb.y - t.y) / t.k };
}
function onNodeDown(n: SimNode, ev: PointerEvent) {
  ev.stopPropagation(); dragNode = n; n.fx = n.x; n.fy = n.y; reheat();
  (ev.target as Element).setPointerCapture?.(ev.pointerId);
}
function onBgDown(ev: PointerEvent) {
  panning = true; panStart = { x: ev.clientX, y: ev.clientY, tx: transform.value.x, ty: transform.value.y };
}
function onMove(ev: PointerEvent) {
  if (dragNode) { const g = toGraph(ev.clientX, ev.clientY); dragNode.fx = g.x; dragNode.fy = g.y; reheat(); }
  else if (panning) {
    const svg = svgEl.value!; const r = svg.getBoundingClientRect();
    transform.value = { ...transform.value,
      x: panStart.tx + ((ev.clientX - panStart.x) / r.width) * VB_W,
      y: panStart.ty + ((ev.clientY - panStart.y) / r.height) * VB_H };
  }
}
function onUp() { if (dragNode) { dragNode.fx = null; dragNode.fy = null; dragNode = null; } panning = false; }
function onWheel(ev: WheelEvent) {
  ev.preventDefault();
  const vb = toViewBox(ev.clientX, ev.clientY); const t = transform.value;
  const k = Math.min(4, Math.max(0.3, t.k * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
  // keep the point under the cursor fixed while zooming (Bostock zoom-to-cursor)
  transform.value = { k, x: vb.x - ((vb.x - t.x) / t.k) * k, y: vb.y - ((vb.y - t.y) / t.k) * k };
}
function resetView() { transform.value = { k: 1, x: 0, y: 0 }; reheat(); }

// ── focus: hovered node + its neighbourhood come forward, the rest recede (Tufte layering) ──
const focusId = computed(() => hovered.value?.id ?? selected.value?.id ?? null);
function nodeDim(n: SimNode) {
  const f = focusId.value; if (!f) return false;
  return n.id !== f && !adjacency.get(f)?.has(n.id);
}
function edgeDim(e: SimEdge) {
  const f = focusId.value; if (!f) return false;
  return e.s.id !== f && e.t.id !== f;
}
const showLabels = computed(() => (simNodes.value.length <= 40) || transform.value.k > 1.4);

// ── data readouts (Tufte: the distribution is a dense strip, not chartjunk) ──
const dist = computed(() => Object.entries(view.value?.epistemic_distribution ?? {}).sort((a, b) => b[1] - a[1]));
const total = computed(() => view.value?.count ?? 0);
const edgeTotal = computed(() => view.value?.edge_count ?? view.value?.edges?.length ?? 0);

async function load() {
  loading.value = true; error.value = ""; selected.value = null; hovered.value = null;
  try { const v = await loadGraph(props.project); view.value = v; build(v); }
  catch (e) { error.value = e instanceof Error ? e.message : "failed to load graph"; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.project, load);
onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf); });

// stroke width encodes edge weight (Tufte: encode the datum, keep it thin so edges recede)
function edgeW(e: SimEdge) { return Math.min(4, 0.8 + Math.sqrt(e.weight)); }
</script>

<template>
  <div class="ge">
    <header class="ge-head">
      <div>
        <h2>⧉ Knowledge graph <span class="cnt">{{ total }} nodes · {{ edgeTotal }} edges</span></h2>
        <p class="sub">A force-directed explorer where every node carries its <b>epistemic status</b> and <b>provenance</b> — what a graph explorer shows that Neo4j Bloom can't.</p>
      </div>
      <div class="tools">
        <button class="tbtn" @click="resetView" title="reset pan/zoom">⤢</button>
        <button class="tbtn" @click="load" :disabled="loading" title="reload">↻</button>
      </div>
    </header>

    <!-- epistemic distribution — the governance readout no incumbent surfaces -->
    <div v-if="total" class="dist">
      <div class="bar">
        <span v-for="[mode, n] in dist" :key="mode" :style="{ width: (n / total * 100) + '%', background: color(mode) }" :title="`${mode}: ${n}`" />
      </div>
      <div class="legend">
        <span v-for="[mode, n] in dist" :key="mode" class="lg"><i :style="{ background: color(mode) }" /> {{ mode }} · {{ n }}</span>
      </div>
    </div>

    <p v-if="view?.stub" class="note">Preview — sample provenance graph. Live once VITE_STUDIO_API is wired.</p>
    <p v-if="loading" class="msg">Loading graph…</p>
    <p v-else-if="error" class="msg err">{{ error }}</p>
    <p v-else-if="!total" class="msg">Graph is empty for this project. Run an extraction to populate it (Extraction → Run).</p>

    <div v-else class="canvas-wrap">
      <svg ref="svgEl" class="canvas" :viewBox="`0 0 ${VB_W} ${VB_H}`" @pointerdown="onBgDown"
           @pointermove="onMove" @pointerup="onUp" @pointerleave="onUp" @wheel="onWheel">
        <g :transform="`translate(${transform.x},${transform.y}) scale(${transform.k})`" :data-frame="frame">
          <!-- edges recede (thin, muted); dim out of focus -->
          <g class="edges" stroke-linecap="round">
            <line v-for="e in simEdges" :key="e.id" :x1="e.s.x" :y1="e.s.y" :x2="e.t.x" :y2="e.t.y"
                  :stroke-width="edgeW(e)" :class="{ dim: edgeDim(e) }" />
          </g>
          <!-- nodes: fill = epistemic mode (the ink that carries meaning), radius = degree -->
          <g class="nodes">
            <g v-for="n in simNodes" :key="n.id" :class="{ dim: nodeDim(n), sel: selected?.id === n.id }"
               :transform="`translate(${n.x},${n.y})`" @pointerdown="onNodeDown(n, $event)"
               @pointerenter="hovered = n" @pointerleave="hovered = null" @click.stop="selected = n">
              <circle :r="n.r" :fill="color(n.epistemic_mode)"
                      :stroke="selected?.id === n.id ? '#202124' : '#fff'" :stroke-width="selected?.id === n.id ? 2 : 1.2" />
              <text v-if="showLabels || hovered?.id === n.id || selected?.id === n.id"
                    :x="n.r + 4" y="4" class="lbl">{{ n.name }}</text>
            </g>
          </g>
        </g>
      </svg>
      <div class="hint">drag nodes · scroll to zoom · drag background to pan</div>
    </div>

    <transition name="slide">
      <aside v-if="selected" class="prov">
        <button class="x" @click="selected = null">✕</button>
        <div class="pk">Node</div>
        <h3>{{ selected.name }}</h3>
        <dl>
          <div><dt>epistemic mode</dt><dd><span class="pill" :style="{ borderColor: color(selected.epistemic_mode), color: color(selected.epistemic_mode) }">{{ selected.epistemic_mode }}</span></dd></div>
          <div><dt>degree</dt><dd>{{ selected.deg }} edge(s)</dd></div>
          <div v-if="selected.source"><dt>source</dt><dd>{{ selected.source }}</dd></div>
          <div v-if="selected.extractor"><dt>extractor</dt><dd>{{ selected.extractor }}</dd></div>
          <div><dt>labels</dt><dd>{{ selected.labels.join(", ") }}</dd></div>
          <div><dt>atom id</dt><dd class="mono">{{ selected.id }}</dd></div>
        </dl>
        <div class="acts"><button class="primary" title="replay how this fact was derived (KE-5)">How derived?</button><button title="agents in this project already retrieve this">Share to team</button></div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.ge { font: 14px/1.5 system-ui, sans-serif; color: #202124; position: relative; }
.ge-head { display: flex; justify-content: space-between; align-items: flex-start; }
.ge-head h2 { font-size: 18px; margin: 0; } .ge-head .cnt { font-size: 12px; color: #5f6368; font-weight: 400; }
.ge-head .sub { color: #5f6368; margin: 4px 0 12px; max-width: 640px; } .ge-head .sub b { color: #202124; }
.tools { display: flex; gap: 6px; }
.tbtn { border: 1px solid #dadce0; background: #fff; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; font-size: 14px; }
.tbtn:hover { background: #f8f9fa; }

.dist { margin: 4px 0 12px; }
.dist .bar { display: flex; height: 8px; border-radius: 5px; overflow: hidden; background: #eceff1; }
.dist .bar span { display: block; }
.dist .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 12px; color: #5f6368; }
.dist .lg i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 4px; vertical-align: middle; }

.canvas-wrap { position: relative; border: 1px solid #e8eaed; border-radius: 12px; background:
  radial-gradient(circle at 1px 1px, #f1f3f4 1px, transparent 0) 0 0 / 22px 22px, #fff; overflow: hidden; }
.canvas { display: block; width: 100%; height: 560px; touch-action: none; cursor: grab; }
.canvas:active { cursor: grabbing; }
.edges line { stroke: #c4cad1; transition: opacity .15s; }
.edges line.dim { opacity: .12; }
.nodes g { cursor: pointer; transition: opacity .15s; }
.nodes g.dim { opacity: .18; }
.nodes .lbl { font: 500 11px/1 system-ui, sans-serif; fill: #202124; paint-order: stroke; stroke: #fff; stroke-width: 3px; stroke-linejoin: round; pointer-events: none; }
.hint { position: absolute; bottom: 8px; left: 10px; font-size: 11px; color: #9aa0a6; pointer-events: none; }

.note { font-size: 12px; color: #b06000; background: #fef7e0; border-radius: 8px; padding: 6px 10px; margin: 0 0 12px; }
.msg { color: #5f6368; } .msg.err { color: #c5221f; }

.prov { position: absolute; top: 74px; right: 8px; width: 300px; background: #fff; border: 1px solid #e8eaed; border-radius: 12px; padding: 16px 18px; box-shadow: -2px 2px 16px rgba(60,64,67,.14); }
.prov .x { position: absolute; top: 10px; right: 12px; border: none; background: none; cursor: pointer; color: #5f6368; }
.prov .pk { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #5f6368; }
.prov h3 { margin: 4px 0 12px; font-size: 17px; }
.prov dl { margin: 0; } .prov dl > div { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px solid #f1f3f4; }
.prov dt { color: #5f6368; min-width: 96px; font-size: 12px; } .prov dd { margin: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
.prov .mono { font-family: ui-monospace, monospace; font-size: 11px; }
.prov .pill { border: 1.5px solid; border-radius: 8px; padding: 0 8px; font-size: 12px; font-weight: 600; }
.prov .acts { display: flex; gap: 8px; margin-top: 14px; }
.prov .acts button { border: 1px solid #dadce0; background: #fff; border-radius: 16px; padding: 5px 12px; font-size: 12px; cursor: pointer; }
.prov .acts button.primary { background: #1a73e8; color: #fff; border-color: #1a73e8; }
.slide-enter-active, .slide-leave-active { transition: transform .18s, opacity .18s; }
.slide-enter-from, .slide-leave-to { transform: translateX(16px); opacity: 0; }
</style>

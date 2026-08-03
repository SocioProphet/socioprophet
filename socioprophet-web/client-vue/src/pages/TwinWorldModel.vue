<template>
  <section class="twm-page" aria-labelledby="twm-title">
    <header class="twm-hero">
      <div>
        <p class="twm-kicker">Twin World Model · {{ mode }}</p>
        <h1 id="twm-title">Twin world model</h1>
        <p class="twm-lede">
          A twin is a geospatially-grounded state-space world model. Twins are
          located on the common operating picture, wired into an ontology, and
          driven by a governed impulse core — <code>x⁺ = A·x + B·(G·u)</code> —
          where a closed gate holds the twin fail-closed.
        </p>
      </div>
      <div class="twm-scorecard" aria-label="Fleet size">
        <span class="twm-score">{{ twins.length }}</span>
        <span class="twm-score-label">twins · {{ counts.verified }} verified</span>
      </div>
    </header>

    <BoundaryNotice
      :label="mode === 'live' ? 'live' : 'fixture'"
      :message="mode === 'live'
        ? 'Live twin registry from the cloud-twin service; the GAIA risk field is an advisory demonstration overlay, not a production hazard plane.'
        : 'Fixture twin registry (client-side). Wire VITE_CLOUD_TWIN_API_BASE to the cloud-twin service for live twins. The geospatial picture is a self-contained equirectangular render — advisory, not for navigation.'"
    />

    <RouteStatePanel
      :state="mode === 'live' ? 'ready' : 'mock'"
      :title="mode === 'live' ? 'Live registry' : 'Fixture registry'"
      :message="loadError
        ? `Backend unavailable (${loadError}); showing the fixture twin registry over the demo GAIA risk field.`
        : `${twins.length} twins located across ${regionCount} regions; each Region is grounded in H3 cells and each exogenous shock cites a GaiaObservation.`"
    />

    <!-- ── 1 · Geospatial common operating picture ── -->
    <section class="twm-card twm-cop" aria-label="Geospatial common operating picture">
      <div class="twm-card-head">
        <h2>Common operating picture</h2>
        <div class="twm-legend" aria-label="Lifecycle legend">
          <span v-for="s in LIFECYCLE" :key="s.state" class="twm-legend-item">
            <i class="twm-swatch" :style="{ background: s.color }" aria-hidden="true" />{{ s.state }}
          </span>
          <span class="twm-legend-item"><i class="twm-swatch twm-swatch--risk" aria-hidden="true" />GAIA risk field</span>
        </div>
      </div>
      <svg :viewBox="`0 0 ${MAP_W} ${MAP_H}`" role="group" class="twm-map" aria-label="World map with located twins">
        <title>Common operating picture: {{ twins.length }} twins located on an equirectangular world map, colored by lifecycle state, over a GAIA-derived risk field.</title>
        <rect x="0" y="0" :width="MAP_W" :height="MAP_H" class="twm-ocean" />
        <!-- graticule -->
        <line v-for="lon in GRATICULE_LON" :key="`glon-${lon}`" :x1="projectX(lon)" y1="0" :x2="projectX(lon)" :y2="MAP_H" class="twm-grat" />
        <line v-for="lat in GRATICULE_LAT" :key="`glat-${lat}`" x1="0" :y1="projectY(lat)" :x2="MAP_W" :y2="projectY(lat)" class="twm-grat" />
        <!-- GAIA risk halos, drawn under the twins -->
        <circle
          v-for="g in geoTwins"
          :key="`risk-${g.twin.id}`"
          :cx="g.x"
          :cy="g.y"
          :r="12 + g.gaiaRisk * 46"
          class="twm-risk"
          :style="{ fill: riskFill(g.gaiaRisk), opacity: 0.12 + g.gaiaRisk * 0.5 }"
        />
        <!-- twins -->
        <g
          v-for="g in geoTwins"
          :key="`twin-${g.twin.id}`"
          class="twm-node"
          :class="{ 'is-selected': g.twin.id === selectedId }"
          role="button"
          tabindex="0"
          @click="selectTwin(g.twin.id)"
          @keydown.enter="selectTwin(g.twin.id)"
        >
          <circle :cx="g.x" :cy="g.y" r="7" :style="{ fill: stateColor(g.twin.state) }" class="twm-dot" />
          <circle v-if="g.twin.id === selectedId" :cx="g.x" :cy="g.y" r="11" class="twm-ring" />
          <text :x="g.x" :y="g.y - 12" text-anchor="middle" class="twm-node-label">{{ g.twin.label }}</text>
        </g>
      </svg>
      <div class="twm-cop-grid">
        <button
          v-for="g in geoTwins"
          :key="`row-${g.twin.id}`"
          type="button"
          class="twm-cop-row"
          :class="{ on: g.twin.id === selectedId }"
          @click="selectTwin(g.twin.id)"
        >
          <span class="twm-cop-dot" :style="{ background: stateColor(g.twin.state) }" aria-hidden="true" />
          <span class="twm-cop-name">{{ g.twin.label }}</span>
          <span class="twm-cop-region">{{ g.region }}</span>
          <span class="twm-cop-h3"><code>{{ g.h3 }}</code></span>
          <span class="twm-cop-risk" :style="{ color: riskFill(g.gaiaRisk) }">risk {{ (g.gaiaRisk * 100).toFixed(0) }}%</span>
        </button>
      </div>
    </section>

    <!-- ── 2 · Ontology world model graph ── -->
    <section class="twm-card" aria-label="Ontology world model graph">
      <div class="twm-card-head">
        <h2>Ontology · {{ selectedTwin?.label }}</h2>
        <span class="twm-sub">Twin → Region → Sensor → Feed → Event → Policy → Hologram</span>
      </div>
      <svg :viewBox="`0 0 ${ONTO_W} ${ONTO_H}`" role="img" class="twm-onto-svg" aria-label="Ontology node-link graph">
        <title>Ontology graph for {{ selectedTwin?.label }}: a typed node-link chain from the twin out to its projecting hologram.</title>
        <g v-for="(edge, i) in ontologyEdges" :key="`e-${i}`">
          <line :x1="edge.x1" :y1="ONTO_MID" :x2="edge.x2" :y2="ONTO_MID" class="twm-onto-edge" />
          <text :x="(edge.x1 + edge.x2) / 2" :y="ONTO_MID - 14" text-anchor="middle" class="twm-onto-rel">{{ edge.predicate }}</text>
        </g>
        <g v-for="node in ontologyNodes" :key="`n-${node.kind}`">
          <circle :cx="node.x" :cy="ONTO_MID" r="20" :class="['twm-onto-node', `twm-onto-node--${node.kind.toLowerCase()}`]" />
          <text :x="node.x" :y="ONTO_MID + 4" text-anchor="middle" class="twm-onto-kind">{{ node.kind }}</text>
          <text :x="node.x" :y="ONTO_MID + 40" text-anchor="middle" class="twm-onto-label">{{ node.label }}</text>
        </g>
      </svg>
    </section>

    <!-- ── 3 · State space & impulse gates ── -->
    <section class="twm-card twm-ss" aria-label="State space and impulse gates">
      <div class="twm-card-head">
        <h2>State space &amp; impulse gates</h2>
        <span class="twm-sub"><code>x⁺ = A·x + B·(G·u)</code> · A = {{ RELAXATION }} relaxation</span>
      </div>

      <div class="twm-ss-grid">
        <!-- State vector -->
        <div class="twm-ss-col">
          <h3>State vector <code>x</code></h3>
          <ul class="twm-state">
            <li v-for="dim in STATE_DIMS" :key="dim" class="twm-state-row">
              <span class="twm-state-name">{{ dim }}</span>
              <span class="twm-state-bar">
                <i :style="{ width: (model.state[dim] * 100) + '%', background: DIM_COLOR[dim] }" />
              </span>
              <b class="twm-state-val">{{ model.state[dim].toFixed(2) }}</b>
            </li>
          </ul>
        </div>

        <!-- Gate bank -->
        <div class="twm-ss-col">
          <h3>Impulse gates <code>G</code> <span class="twm-hint">click to cycle</span></h3>
          <ul class="twm-gates">
            <li v-for="spec in IMPULSES" :key="spec.id" class="twm-gate-row">
              <button
                type="button"
                class="twm-gate"
                :class="`twm-gate--${model.gates[spec.id]}`"
                :title="`${spec.label} — source ${spec.source}. ${spec.blurb} Gate: ${model.gates[spec.id]}.`"
                @click="toggleGate(spec.id)"
              >
                <span class="twm-gate-state">{{ GATE_GLYPH[model.gates[spec.id]] }}</span>
                <span class="twm-gate-label">{{ spec.label }}</span>
                <span class="twm-gate-src">{{ spec.source }}</span>
                <span class="twm-gate-gain">×{{ GATE_GAIN[model.gates[spec.id]] }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Inject impulse -->
      <div class="twm-inject">
        <div class="twm-inject-picks">
          <button
            v-for="spec in IMPULSES"
            :key="`pick-${spec.id}`"
            type="button"
            class="twm-pick"
            :class="{ on: selectedImpulse === spec.id }"
            @click="selectedImpulse = spec.id"
          >{{ spec.label }}<span v-if="spec.id === 'exogenous_shock'" class="twm-pick-gaia">GAIA/weather</span></button>
        </div>
        <label class="twm-mag">
          magnitude <code>u</code>
          <input v-model.number="magnitude" type="range" min="0.1" max="1" step="0.1" aria-label="Impulse magnitude" />
          <b>{{ magnitude.toFixed(1) }}</b>
        </label>
        <div class="twm-inject-actions">
          <button type="button" class="twm-primary" @click="inject">Inject impulse</button>
          <button type="button" class="twm-secondary" @click="reset">Reset</button>
        </div>
      </div>
      <p v-if="lastStep" class="twm-verdict" :class="lastStep.admitted ? 'ok' : 'blocked'">
        {{ IMPULSE_BY_ID[lastStep.impulse].label }} · {{ lastStep.admitted ? 'ADMITTED' : 'REJECTED' }} — {{ lastStep.reason }}
      </p>

      <!-- Trajectory -->
      <div class="twm-traj">
        <div class="twm-card-head">
          <h3>Trajectory <span class="twm-sub">{{ history.length }} steps</span></h3>
          <div class="twm-legend">
            <span v-for="dim in STATE_DIMS" :key="`tl-${dim}`" class="twm-legend-item">
              <i class="twm-swatch" :style="{ background: DIM_COLOR[dim] }" aria-hidden="true" />{{ dim }}
            </span>
          </div>
        </div>
        <svg :viewBox="`0 0 ${TRAJ_W} ${TRAJ_H}`" role="img" class="twm-traj-svg" aria-label="State trajectory over injected impulses">
          <title>State trajectory: each dimension of x over {{ history.length }} injected impulses.</title>
          <line x1="0" :y1="TRAJ_H / 2" :x2="TRAJ_W" :y2="TRAJ_H / 2" class="twm-grat" />
          <polyline
            v-for="dim in STATE_DIMS"
            :key="`poly-${dim}`"
            :points="trajPoints(dim)"
            fill="none"
            :stroke="DIM_COLOR[dim]"
            stroke-width="1.6"
          />
        </svg>
      </div>
    </section>

    <!-- ── 4 · Value reading · qualified attention ── -->
    <section class="twm-card twm-val" aria-label="Value reading">
      <div class="twm-card-head">
        <h2>Value reading · qualified attention</h2>
        <span class="twm-sub"><code>Kknow = coverage · (1−drift) · integrity</code> · read live off <code>x</code></span>
      </div>
      <p class="twm-val-note">
        The value axiom, made functional: value roots in <b>qualified attention</b>, measured as
        <code>Kknow</code>. Knowledge raises only the <b>controllable surplus</b> — it can never buy
        down the <b>exogenous hurdle</b> — and value banks only under human governance (close the
        <em>human action</em> gate above to hold it fail-closed). A model, not a measurement.
      </p>
      <div class="twm-val-grid">
        <div class="twm-val-metric">
          <span class="twm-val-label">Kknow · qualified attention</span>
          <span class="twm-val-bar"><i :style="{ width: (value.kknow * 100) + '%' }" /></span>
          <b>{{ value.kknow.toFixed(2) }}</b>
        </div>
        <div class="twm-val-metric">
          <span class="twm-val-label">controllable surplus</span>
          <span class="twm-val-bar"><i :style="{ width: (value.controllableSurplus * 100) + '%' }" /></span>
          <b>{{ value.controllableSurplus.toFixed(2) }}</b>
        </div>
        <div class="twm-val-metric">
          <span class="twm-val-label">− hurdle · exogenous</span>
          <span class="twm-val-bar twm-val-bar--hurdle"><i :style="{ width: (value.hurdle * 100) + '%' }" /></span>
          <b>{{ value.hurdle.toFixed(2) }}</b>
        </div>
        <div class="twm-val-signal" :class="value.valueSignal >= 0 ? 'pos' : 'neg'">
          <span class="twm-val-label">value signal · ΔEP-like</span>
          <b>{{ value.valueSignal >= 0 ? '+' : '' }}{{ value.valueSignal.toFixed(2) }}</b>
        </div>
      </div>
      <p class="twm-val-verdict" :class="value.bankable ? 'ok' : 'held'">
        {{ value.bankable ? 'BANKABLE' : 'HELD' }} — {{ value.reason }}
      </p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import BoundaryNotice from '../components/BoundaryNotice.vue';
import RouteStatePanel from '../components/RouteStatePanel.vue';
import {
  demoTwins,
  fetchTwinRegistryWithFallback,
  twinCounts,
  type Twin,
  type TwinMode,
  type TwinState,
} from '../api/cloudTwinApi';
import {
  GATE_GAIN,
  IMPULSE_BY_ID,
  IMPULSES,
  RELAXATION,
  STATE_DIMS,
  createModel,
  cycleGate,
  resetModel,
  stepModel,
  type GateMode,
  type ImpulseClass,
  type StateDim,
  type StateVector,
  type StepResult,
  type TwinStateModel,
} from '../features/twinStateSpace';
import { valueReading } from '../features/valueModel';

// ── Lifecycle colors (per the world-model spec) ──
const LIFECYCLE: Array<{ state: TwinState; color: string }> = [
  { state: 'created', color: '#7c8cff' },
  { state: 'authorized', color: '#f0b429' },
  { state: 'verified', color: '#3fb950' },
];
const STATE_COLOR: Record<TwinState, string> = {
  created: '#7c8cff',
  authorized: '#f0b429',
  verified: '#3fb950',
};
function stateColor(s: TwinState): string {
  return STATE_COLOR[s];
}

const DIM_COLOR: Record<StateDim, string> = {
  integrity: '#3fb950',
  risk: '#f0656a',
  load: '#f0b429',
  coverage: '#7c8cff',
  drift: '#a855f7',
};

const GATE_GLYPH: Record<GateMode, string> = { open: '○', attenuated: '◑', closed: '●' };

// ── Registry load (live-fallback) ──
const twins = ref<Twin[]>(demoTwins());
const mode = ref<TwinMode>('fixture');
const loadError = ref<string | undefined>(undefined);
const counts = computed(() => twinCounts(twins.value));

onMounted(async () => {
  const result = await fetchTwinRegistryWithFallback();
  twins.value = result.snapshot.twins;
  mode.value = result.mode;
  loadError.value = result.error;
  if (!twins.value.some((t) => t.id === selectedId.value) && twins.value[0]) {
    selectTwin(twins.value[0].id);
  }
});

// ── Section 1 · geospatial grounding ──
// Deterministic per-twin geo placement: named regions for the demo fleet, and a
// hash-derived fallback so a live twin always has a location. Each Region is
// grounded in an H3 cell; the GAIA risk is the advisory hazard field.
interface RegionGrounding {
  region: string;
  lat: number;
  lon: number;
  h3: string;
  gaiaRisk: number;
}
const NAMED_REGIONS: Record<string, RegionGrounding> = {
  'twn_mkt-0001': { region: 'AU · Sydney (ASX)', lat: -33.87, lon: 151.21, h3: '8abe8d12acaffff', gaiaRisk: 0.28 },
  'twn_dev-0002': { region: 'US · Lower Manhattan', lat: 40.71, lon: -74.01, h3: '8928308280fffff', gaiaRisk: 0.61 },
  'twn_prt-0003': { region: 'UK · London (City)', lat: 51.51, lon: -0.09, h3: '891fb466257ffff', gaiaRisk: 0.34 },
  'twn_cit-0004': { region: 'SG · Singapore', lat: 1.29, lon: 103.85, h3: '8865b0b5b3fffff', gaiaRisk: 0.52 },
  'twn_hlt-0005': { region: 'US · SF Bay', lat: 37.77, lon: -122.42, h3: '8928309537bffff', gaiaRisk: 0.47 },
};
function hashGrounding(id: string): RegionGrounding {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const lat = ((h % 140) - 60); // -60..79
  const lon = (((h >>> 7) % 340) - 170); // -170..169
  const gaiaRisk = ((h >>> 3) % 100) / 100;
  return { region: `derived · ${lat.toFixed(0)}, ${lon.toFixed(0)}`, lat, lon, h3: '8003fffffffffff', gaiaRisk };
}
function grounding(id: string): RegionGrounding {
  return NAMED_REGIONS[id] ?? hashGrounding(id);
}

const MAP_W = 720;
const MAP_H = 360;
const GRATICULE_LON = [-120, -60, 0, 60, 120];
const GRATICULE_LAT = [-60, -30, 0, 30, 60];
function projectX(lon: number): number {
  return ((lon + 180) / 360) * MAP_W;
}
function projectY(lat: number): number {
  return ((90 - lat) / 180) * MAP_H;
}
function riskFill(risk: number): string {
  return risk >= 0.55 ? '#f0656a' : risk >= 0.35 ? '#f0b429' : '#3fb950';
}

interface GeoTwin extends RegionGrounding {
  twin: Twin;
  x: number;
  y: number;
}
const geoTwins = computed<GeoTwin[]>(() =>
  twins.value.map((twin) => {
    const g = grounding(twin.id);
    return { ...g, twin, x: projectX(g.lon), y: projectY(g.lat) };
  }),
);
const regionCount = computed(() => new Set(geoTwins.value.map((g) => g.region)).size);

// ── Selection ──
const selectedId = ref<string>(demoTwins()[0]!.id);
const selectedTwin = computed<Twin | undefined>(() => twins.value.find((t) => t.id === selectedId.value));

// ── Section 3 · state-space model for the selected twin ──
const model = reactive<TwinStateModel>(createModel(selectedId.value, selectedTwin.value?.label ?? selectedId.value));
const history = ref<StateVector[]>([{ ...model.state }]);
const magnitude = ref(0.6);
const selectedImpulse = ref<ImpulseClass>('device_reading');
const lastStep = ref<StepResult | null>(null);

function rebuildModel(): void {
  const fresh = createModel(selectedId.value, selectedTwin.value?.label ?? selectedId.value);
  model.twinId = fresh.twinId;
  model.label = fresh.label;
  model.state = fresh.state;
  model.gates = fresh.gates;
  history.value = [{ ...model.state }];
  lastStep.value = null;
}

function selectTwin(id: string): void {
  selectedId.value = id;
}
watch(selectedId, rebuildModel);

function toggleGate(cls: ImpulseClass): void {
  model.gates[cls] = cycleGate(model.gates[cls]);
}

// ── Value reading: the value axiom (Kknow + EP-like signal) read live off x.
// Banking is gated on human governance (the human_action gate): with no operator
// governance in the loop the value is held fail-closed. See features/valueModel.ts
// and docs/value-axiom-human-attention.md.
const value = computed(() => valueReading(model.state, { governanceGate: model.gates.human_action }));

function inject(): void {
  lastStep.value = stepModel(model, selectedImpulse.value, magnitude.value);
  if (lastStep.value.admitted) history.value = [...history.value, { ...model.state }].slice(-40);
}

function reset(): void {
  resetModel(model);
  history.value = [{ ...model.state }];
  lastStep.value = null;
}

// ── Section 2 · ontology graph derived from the selected twin ──
const ONTO_W = 980;
const ONTO_H = 200;
const ONTO_MID = 96;
interface OntoNode {
  kind: string;
  label: string;
  x: number;
}
const ontologyNodes = computed<OntoNode[]>(() => {
  const t = selectedTwin.value;
  const g = t ? grounding(t.id) : undefined;
  const chain = [
    { kind: 'Twin', label: t?.label ?? '—' },
    { kind: 'Region', label: g?.region ?? '—' },
    { kind: 'Sensor', label: `sensor:${t?.kind ?? 'twin'}` },
    { kind: 'Feed', label: t?.hologram ?? '—' },
    { kind: 'Event', label: `event:twin.${t?.state ?? 'created'}` },
    { kind: 'Policy', label: t?.principal ?? '—' },
    { kind: 'Hologram', label: t?.hologram ?? '—' },
  ];
  const pad = 70;
  const step = (ONTO_W - pad * 2) / (chain.length - 1);
  return chain.map((n, i) => ({ ...n, x: pad + i * step }));
});
const ONTO_PREDICATES = ['located_in', 'observes', 'emits', 'raised', 'governed_by', 'projects'];
interface OntoEdge {
  predicate: string;
  x1: number;
  x2: number;
}
const ontologyEdges = computed<OntoEdge[]>(() => {
  const nodes = ontologyNodes.value;
  const edges: OntoEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({ predicate: ONTO_PREDICATES[i]!, x1: nodes[i]!.x, x2: nodes[i + 1]!.x });
  }
  return edges;
});

// ── Trajectory rendering ──
const TRAJ_W = 640;
const TRAJ_H = 140;
function trajPoints(dim: StateDim): string {
  const h = history.value;
  if (h.length <= 1) {
    const y = (1 - h[0]![dim]) * TRAJ_H;
    return `0,${y} ${TRAJ_W},${y}`;
  }
  return h
    .map((v, i) => {
      const x = (i / (h.length - 1)) * TRAJ_W;
      const y = (1 - v[dim]) * TRAJ_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
</script>

<style scoped>
.twm-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; max-width: 1180px; margin: 0 auto; }
.twm-hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; }
.twm-kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; opacity: 0.7; margin: 0; }
.twm-hero h1 { margin: 0.25rem 0; font-size: 1.6rem; }
.twm-lede { margin: 0; max-width: 68ch; opacity: 0.85; line-height: 1.5; }
.twm-lede code { font-family: ui-monospace, monospace; font-size: 0.9em; }
.twm-scorecard { text-align: right; }
.twm-score { display: block; font-size: 2rem; font-weight: 700; }
.twm-score-label { font-size: 0.75rem; opacity: 0.7; }

.twm-card { border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 1rem; }
.twm-card-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.twm-card-head h2, .twm-card-head h3 { margin: 0; font-size: 1rem; }
.twm-sub { font-size: 0.75rem; opacity: 0.65; }
.twm-sub code, .twm-card-head code { font-family: ui-monospace, monospace; }
.twm-hint { font-size: 0.7rem; opacity: 0.55; }

.twm-legend { display: flex; gap: 0.85rem; flex-wrap: wrap; font-size: 0.72rem; opacity: 0.85; }
.twm-legend-item { display: inline-flex; align-items: center; gap: 0.3rem; }
.twm-swatch { width: 0.7rem; height: 0.7rem; border-radius: 3px; display: inline-block; }
.twm-swatch--risk { background: radial-gradient(circle, #f0656a, transparent); }

/* Section 1 · COP */
.twm-map { width: 100%; height: auto; border-radius: 10px; display: block; }
.twm-ocean { fill: rgba(20, 30, 48, 0.55); }
.twm-grat { stroke: rgba(148, 163, 184, 0.18); stroke-width: 1; }
.twm-risk { pointer-events: none; }
.twm-node { cursor: pointer; }
.twm-dot { stroke: rgba(15, 20, 28, 0.9); stroke-width: 1.4; }
.twm-ring { fill: none; stroke: #fff; stroke-width: 1.6; }
.twm-node-label { fill: currentColor; font-size: 10px; font-weight: 600; opacity: 0.9; }
.twm-node.is-selected .twm-node-label { opacity: 1; }

.twm-cop-grid { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.75rem; }
.twm-cop-row { display: grid; grid-template-columns: 1rem 1.4fr 1.2fr 1.3fr auto; gap: 0.6rem; align-items: center;
  background: none; border: 1px solid transparent; border-radius: 8px; padding: 0.35rem 0.5rem; text-align: left;
  color: inherit; cursor: pointer; font-size: 0.78rem; }
.twm-cop-row:hover { border-color: rgba(148, 163, 184, 0.3); }
.twm-cop-row.on { border-color: rgba(255, 255, 255, 0.35); background: rgba(148, 163, 184, 0.12); }
.twm-cop-dot { width: 0.7rem; height: 0.7rem; border-radius: 999px; }
.twm-cop-name { font-weight: 600; }
.twm-cop-region { opacity: 0.8; }
.twm-cop-h3 code { font-size: 0.68rem; opacity: 0.7; }
.twm-cop-risk { font-weight: 600; }

/* Section 2 · ontology */
.twm-onto-svg { width: 100%; height: auto; }
.twm-onto-edge { stroke: rgba(148, 163, 184, 0.5); stroke-width: 1.4; }
.twm-onto-rel { fill: currentColor; font-size: 10px; opacity: 0.7; font-style: italic; }
.twm-onto-node { fill: #475569; }
.twm-onto-node--twin { fill: #2563eb; }
.twm-onto-node--region { fill: #0d9488; }
.twm-onto-node--sensor { fill: #b45309; }
.twm-onto-node--feed { fill: #0369a1; }
.twm-onto-node--event { fill: #7c3aed; }
.twm-onto-node--policy { fill: #be123c; }
.twm-onto-node--hologram { fill: #7c8cff; }
.twm-onto-kind { fill: #fff; font-size: 9px; font-weight: 700; }
.twm-onto-label { fill: currentColor; font-size: 9px; opacity: 0.75; }

/* Section 3 · state space */
.twm-ss-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
@media (max-width: 720px) { .twm-ss-grid { grid-template-columns: 1fr; } }
.twm-ss-col h3 { margin: 0 0 0.6rem; font-size: 0.85rem; }
.twm-ss-col h3 code { font-family: ui-monospace, monospace; }
.twm-state { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.twm-state-row { display: grid; grid-template-columns: 5.5rem 1fr 2.6rem; align-items: center; gap: 0.6rem; font-size: 0.78rem; }
.twm-state-name { opacity: 0.85; }
.twm-state-bar { height: 0.5rem; border-radius: 999px; background: rgba(148, 163, 184, 0.18); overflow: hidden; }
.twm-state-bar i { display: block; height: 100%; }
.twm-state-val { text-align: right; font-variant-numeric: tabular-nums; }

.twm-gates { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.twm-gate { width: 100%; display: grid; grid-template-columns: 1.4rem 1fr auto auto; gap: 0.5rem; align-items: center;
  padding: 0.4rem 0.55rem; border-radius: 8px; cursor: pointer; text-align: left; font-size: 0.76rem;
  border: 1px solid rgba(148, 163, 184, 0.28); background: rgba(148, 163, 184, 0.06); color: inherit; }
.twm-gate-state { font-size: 1rem; }
.twm-gate-label { font-weight: 600; }
.twm-gate-src { font-size: 0.66rem; opacity: 0.6; font-family: ui-monospace, monospace; }
.twm-gate-gain { font-variant-numeric: tabular-nums; opacity: 0.8; }
.twm-gate--open { border-color: rgba(63, 185, 80, 0.5); }
.twm-gate--attenuated { border-color: rgba(240, 180, 41, 0.5); background: rgba(240, 180, 41, 0.08); }
.twm-gate--closed { border-color: rgba(240, 101, 106, 0.55); background: rgba(240, 101, 106, 0.1); }

.twm-inject { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 1rem;
  padding-top: 1rem; border-top: 1px solid rgba(148, 163, 184, 0.2); }
.twm-inject-picks { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.twm-pick { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 0.1rem;
  padding: 0.35rem 0.6rem; border-radius: 8px; cursor: pointer; font-size: 0.74rem;
  border: 1px solid rgba(148, 163, 184, 0.28); background: rgba(148, 163, 184, 0.06); color: inherit; }
.twm-pick.on { border-color: rgba(255, 255, 255, 0.4); background: rgba(148, 163, 184, 0.16); }
.twm-pick-gaia { font-size: 0.6rem; opacity: 0.7; color: #7c8cff; }
.twm-mag { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.74rem; opacity: 0.9; }
.twm-mag code { font-family: ui-monospace, monospace; }
.twm-inject-actions { display: flex; gap: 0.5rem; margin-left: auto; }
.twm-primary, .twm-secondary { padding: 0.4rem 0.85rem; border-radius: 8px; cursor: pointer; font-size: 0.78rem; border: 1px solid transparent; }
.twm-primary { background: #2563eb; color: #fff; }
.twm-secondary { background: rgba(148, 163, 184, 0.14); color: inherit; border-color: rgba(148, 163, 184, 0.3); }

.twm-verdict { margin: 0.75rem 0 0; font-size: 0.78rem; padding: 0.4rem 0.6rem; border-radius: 8px; }
.twm-verdict.ok { background: rgba(63, 185, 80, 0.12); border: 1px solid rgba(63, 185, 80, 0.4); }
.twm-verdict.blocked { background: rgba(240, 101, 106, 0.12); border: 1px solid rgba(240, 101, 106, 0.45); }

.twm-traj { margin-top: 1rem; }
.twm-traj-svg { width: 100%; height: auto; background: rgba(20, 30, 48, 0.35); border-radius: 10px; }

/* Section 4 · value reading */
.twm-val-note { margin: 0 0 0.9rem; font-size: 0.76rem; opacity: 0.82; line-height: 1.5; max-width: 76ch; }
.twm-val-note code { font-family: ui-monospace, monospace; font-size: 0.9em; }
.twm-val-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; }
.twm-val-metric { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 0.35rem 0.6rem;
  padding: 0.6rem 0.7rem; border-radius: 10px; border: 1px solid rgba(148, 163, 184, 0.22); }
.twm-val-label { grid-column: 1 / -1; font-size: 0.72rem; opacity: 0.75; }
.twm-val-bar { height: 0.5rem; border-radius: 999px; background: rgba(148, 163, 184, 0.18); overflow: hidden; }
.twm-val-bar i { display: block; height: 100%; background: #7c8cff; }
.twm-val-bar--hurdle i { background: #f0656a; }
.twm-val-metric b { font-variant-numeric: tabular-nums; font-size: 0.9rem; }
.twm-val-signal { display: grid; align-content: center; gap: 0.25rem; padding: 0.6rem 0.7rem; border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.28); }
.twm-val-signal b { font-size: 1.4rem; font-variant-numeric: tabular-nums; }
.twm-val-signal.pos { border-color: rgba(63, 185, 80, 0.5); background: rgba(63, 185, 80, 0.08); }
.twm-val-signal.neg { border-color: rgba(240, 101, 106, 0.5); background: rgba(240, 101, 106, 0.08); }
.twm-val-verdict { margin: 0.9rem 0 0; font-size: 0.78rem; padding: 0.45rem 0.65rem; border-radius: 8px; font-weight: 600; }
.twm-val-verdict.ok { background: rgba(63, 185, 80, 0.12); border: 1px solid rgba(63, 185, 80, 0.4); }
.twm-val-verdict.held { background: rgba(240, 180, 41, 0.12); border: 1px solid rgba(240, 180, 41, 0.45); }
</style>

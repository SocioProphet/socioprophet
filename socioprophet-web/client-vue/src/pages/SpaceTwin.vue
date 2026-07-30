<template>
  <section class="st" aria-label="Space digital twin">
    <SurfaceHeader title="Space Twin" eyebrow="Digital twinning · solar system &amp; galaxy">
      <template #badge>
        <ProvenanceBadge :p="mode === 'solar' ? solarProv : galaxyProv" compact />
      </template>
      <template #actions>
        <div class="st-modes" role="tablist" aria-label="Twin scale">
          <button role="tab" :aria-selected="mode === 'solar'" :class="{ on: mode === 'solar' }" @click="setMode('solar')">☉ Solar System</button>
          <button role="tab" :aria-selected="mode === 'galaxy'" :class="{ on: mode === 'galaxy' }" @click="setMode('galaxy')">✦ Galaxy</button>
        </div>
      </template>
    </SurfaceHeader>

    <div class="st-stage">
      <canvas ref="canvasEl" class="st-canvas" aria-label="3D space view — drag to orbit, scroll to zoom" />

      <!-- readout overlay -->
      <div class="st-readout" v-if="mode === 'solar'">
        <div class="st-date">{{ dateLabel }}</div>
        <ul class="st-planets">
          <li v-for="p in planetReadout" :key="p.id">
            <span class="st-dot" :style="{ background: p.css }" />{{ p.name }}
            <span class="st-au">{{ p.au }} AU</span>
          </li>
        </ul>
      </div>
      <div class="st-readout" v-else>
        <div class="st-date">Procedural galaxy</div>
        <p class="st-note">{{ galaxyStars.length.toLocaleString() }} generated stars · {{ arms }} spiral arms</p>
      </div>
    </div>

    <!-- the 4th dimension: time -->
    <div class="st-time" v-if="mode === 'solar'">
      <button class="st-play" :aria-label="playing ? 'Pause' : 'Play'" @click="playing = !playing">{{ playing ? '❚❚' : '▶' }}</button>
      <input class="st-scrub" type="range" min="0" :max="SPAN_DAYS" step="1" v-model.number="dayOffset"
             aria-label="Time" @input="playing = false" />
      <button class="st-now" @click="goNow">Now</button>
      <label class="st-speed">
        speed
        <select v-model.number="speed">
          <option :value="1">1×</option>
          <option :value="7">1 wk/s</option>
          <option :value="30">1 mo/s</option>
          <option :value="365">1 yr/s</option>
          <option :value="3652">10 yr/s</option>
        </select>
      </label>
    </div>
    <div class="st-time st-time--galaxy" v-else>
      <button class="st-play" :aria-label="playing ? 'Pause' : 'Play'" @click="playing = !playing">{{ playing ? '❚❚' : '▶' }}</button>
      <span class="st-galaxy-hint">rotation is illustrative, not an angular-velocity model</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue';
import { Deck, OrbitView, COORDINATE_SYSTEM, type OrbitViewState } from '@deck.gl/core';
import { PathLayer, PointCloudLayer, ScatterplotLayer } from '@deck.gl/layers';
import SurfaceHeader from '../components/SurfaceHeader.vue';
import ProvenanceBadge from '../components/ProvenanceBadge.vue';
import { prov } from '../features/provenance/types';
import { PLANETS, heliocentric, orbitPath } from '../space/ephemeris';
import { generateGalaxy } from '../space/galaxy';

// Honest provenance — the whole point of an epistemic surface is that it declares HOW it
// was produced. The solar system is computed & replayable (Kepler); the galaxy is admitted
// to be a generated stand-in, never observed stellar data.
const solarProv = prov('computed', {
  verifier: 'Kepler propagation (src/space/ephemeris.ts, unit-tested)',
  sources: ['JPL J2000 Keplerian elements (Standish, SSD)'],
  formula: 'M = E − e·sinE → heliocentric ecliptic X,Y,Z',
  note: 'Analytic Kepler, ~arc-minute fidelity 1800–2050. Not a live Horizons VECTORS ephemeris.',
});
const galaxyProv = prov('generated', {
  note: 'Procedural logarithmic-spiral disk (seeded, reproducible). A structural stand-in — NOT a star catalogue.',
});

const mode = ref<'solar' | 'galaxy'>('solar');
const canvasEl = ref<HTMLCanvasElement | null>(null);
const deck = shallowRef<Deck<OrbitView[]> | null>(null);

// ── time (the 4th dimension) ──────────────────────────────────────────────
const SPAN_DAYS = 55152;                 // ~1950 → 2100
const EPOCH = Date.UTC(1950, 0, 1);
const dayOffset = ref(daysBetween(EPOCH, Date.now()));
const playing = ref(false);
const speed = ref(30);
const simDate = computed(() => new Date(EPOCH + dayOffset.value * 86_400_000));
const dateLabel = computed(() => simDate.value.toISOString().slice(0, 10));

function daysBetween(a: number, b: number): number { return Math.round((b - a) / 86_400_000); }
function goNow() { playing.value = false; dayOffset.value = daysBetween(EPOCH, Date.now()); }

// ── galaxy field (generated once; deterministic) ──────────────────────────
const arms = 4;
const galaxyStars = Object.freeze(generateGalaxy({ seed: 42, arms, count: 6000, radius: 90 }));

// ── readout ───────────────────────────────────────────────────────────────
const planetReadout = computed(() =>
  PLANETS.map((p) => {
    const pos = heliocentric(p, simDate.value);
    return {
      id: p.id, name: p.name,
      css: `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`,
      au: Math.hypot(pos[0], pos[1], pos[2]).toFixed(p.elements.a < 2 ? 3 : 2),
    };
  }),
);

// ── layer construction ──────────────────────────────────────────────────
const AU = 20;            // scene units per AU (keeps numbers comfortable for the GPU)
const cart = COORDINATE_SYSTEM.CARTESIAN;

function solarLayers() {
  const date = simDate.value;
  const orbits = PLANETS.map((p) => ({
    path: orbitPath(p, date, 160).map(([x, y, z]) => [x * AU, y * AU, z * AU]),
    color: [...p.color, 90] as [number, number, number, number],
  }));
  const bodies = [
    { position: [0, 0, 0], color: [255, 214, 92], radius: 9, name: 'Sun' },
    ...PLANETS.map((p) => {
      const [x, y, z] = heliocentric(p, date);
      return {
        position: [x * AU, y * AU, z * AU] as [number, number, number],
        color: p.color, name: p.name,
        radius: 2.5 + Math.log10(p.radiusKm) - 3, // log-scaled marker, never physical scale
      };
    }),
  ];
  return [
    new PathLayer({
      id: 'orbits', data: orbits, coordinateSystem: cart,
      getPath: (d: any) => d.path, getColor: (d: any) => d.color,
      getWidth: 1, widthUnits: 'pixels', widthMinPixels: 1, jointRounded: true,
    }),
    new ScatterplotLayer({
      id: 'bodies', data: bodies, coordinateSystem: cart,
      getPosition: (d: any) => d.position, getFillColor: (d: any) => d.color,
      getRadius: (d: any) => d.radius, radiusUnits: 'pixels',
      radiusMinPixels: 2, radiusMaxPixels: 40, stroked: false, pickable: true,
      updateTriggers: { getPosition: dayOffset.value },
    }),
  ];
}

function galaxyLayers() {
  return [
    new PointCloudLayer({
      id: 'galaxy', data: galaxyStars, coordinateSystem: cart,
      getPosition: (d: any) => d.position, getColor: (d: any) => d.color,
      getNormal: [0, 0, 1], pointSize: 1.6, sizeUnits: 'pixels', opacity: 0.9,
    }),
  ];
}

function initialViewState(): OrbitViewState {
  return mode.value === 'solar'
    ? { target: [0, 0, 0], rotationX: 42, rotationOrbit: 30, zoom: -3.2, minZoom: -6, maxZoom: 4 }
    : { target: [0, 0, 0], rotationX: 62, rotationOrbit: 0, zoom: -3.4, minZoom: -6, maxZoom: 4 };
}

// deck's setProps takes view state keyed by view id, so the single OrbitView is named.
function viewStates(extra: Partial<OrbitViewState> = {}) {
  return { orbit: { ...initialViewState(), ...extra } };
}

function render() {
  if (!deck.value) return;
  deck.value.setProps({ layers: mode.value === 'solar' ? solarLayers() : galaxyLayers() });
}

function setMode(m: 'solar' | 'galaxy') {
  if (m === mode.value) return;
  mode.value = m;
  playing.value = false;
  deck.value?.setProps({ initialViewState: viewStates(), layers: m === 'solar' ? solarLayers() : galaxyLayers() });
}

// ── animation loop (time or galaxy spin) ─────────────────────────────────
let raf = 0; let last = 0; let galaxyAngle = 0;
function tick(ts: number) {
  const dt = last ? (ts - last) / 1000 : 0; last = ts;
  if (playing.value) {
    if (mode.value === 'solar') {
      dayOffset.value = Math.min(SPAN_DAYS, dayOffset.value + speed.value * Math.max(dt, 0));
      if (dayOffset.value >= SPAN_DAYS) playing.value = false;
    } else {
      galaxyAngle += dt * 4;
      deck.value?.setProps({ initialViewState: viewStates({ rotationOrbit: galaxyAngle }) });
    }
  }
  raf = requestAnimationFrame(tick);
}

watch([dayOffset, mode], render);

onMounted(() => {
  if (!canvasEl.value) return;
  deck.value = new Deck<OrbitView[]>({
    canvas: canvasEl.value,
    views: [new OrbitView({ id: 'orbit', orbitAxis: 'Z', fovy: 50 })],
    initialViewState: viewStates(),
    controller: true,
    // v9 clears to transparent by default, so the .st-stage gradient is the backdrop.
    layers: solarLayers(),
  });
  raf = requestAnimationFrame(tick);
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
  deck.value?.finalize();
  deck.value = null;
});
</script>

<style scoped>
.st { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.st-modes { display: inline-flex; gap: 2px; background: var(--surface-2, #11151c); border-radius: 8px; padding: 3px; }
.st-modes button { border: 0; background: transparent; color: var(--text-2, #9aa4b2); font: inherit; font-size: 0.82rem;
  padding: 5px 12px; border-radius: 6px; cursor: pointer; }
.st-modes button.on { background: var(--accent, #3a6df0); color: #fff; }
.st-stage { position: relative; flex: 1; min-height: 0; border-radius: 12px; overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #0a0f18 0%, #05070c 70%); }
.st-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.st-readout { position: absolute; top: 14px; left: 14px; background: rgba(6, 9, 15, 0.62);
  backdrop-filter: blur(6px); border: 1px solid rgba(120, 140, 180, 0.18); border-radius: 10px;
  padding: 10px 12px; color: #cfd8e6; font-size: 0.78rem; pointer-events: none; max-width: 210px; }
.st-date { font-variant-numeric: tabular-nums; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 6px; color: #eef3fa; }
.st-planets { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.st-planets li { display: flex; align-items: center; gap: 6px; }
.st-au { margin-left: auto; color: #8b97a8; font-variant-numeric: tabular-nums; }
.st-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.st-note { margin: 4px 0 0; color: #8b97a8; }
.st-time { display: flex; align-items: center; gap: 12px; padding: 12px 4px 2px; }
.st-time--galaxy { color: #8b97a8; font-size: 0.8rem; }
.st-play, .st-now { border: 1px solid rgba(120, 140, 180, 0.3); background: var(--surface-2, #11151c);
  color: #cfd8e6; border-radius: 8px; padding: 6px 12px; cursor: pointer; font: inherit; }
.st-scrub { flex: 1; accent-color: var(--accent, #3a6df0); }
.st-speed { display: flex; align-items: center; gap: 6px; color: #8b97a8; font-size: 0.8rem; }
.st-speed select { background: var(--surface-2, #11151c); color: #cfd8e6; border: 1px solid rgba(120, 140, 180, 0.3);
  border-radius: 6px; padding: 4px 6px; }
.st-galaxy-hint { margin-left: 4px; }
</style>

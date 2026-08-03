<template>
  <section class="st" aria-label="Space digital twin">
    <SurfaceHeader title="Space Twin" eyebrow="Digital twinning · solar system &amp; galaxy">
      <template #badge>
        <ProvenanceBadge :p="mode === 'solar' ? solarProv : mode === 'galaxy' ? galaxyProv : quadrantProv" compact />
      </template>
      <template #actions>
        <div class="st-modes" role="tablist" aria-label="Twin scale">
          <button role="tab" :aria-selected="mode === 'solar'" :class="{ on: mode === 'solar' }" @click="setMode('solar')">☉ Solar System</button>
          <button role="tab" :aria-selected="mode === 'galaxy'" :class="{ on: mode === 'galaxy' }" @click="setMode('galaxy')">✦ Galaxy</button>
          <button role="tab" :aria-selected="mode === 'quadrant'" :class="{ on: mode === 'quadrant' }" @click="setMode('quadrant')">⬢ Quadrant</button>
        </div>
        <label v-if="mode === 'solar'" class="st-lens" title="Interpretive overlay — annotates, never alters the ephemeris">
          <input type="checkbox" v-model="lensOn" /> ✴ Ecliptic lens
        </label>
        <button v-if="mode === 'solar' && centerId !== 'sun'" class="st-reset" @click="recenterSun"
                title="Recenter the universe on the Sun">⌖ Sun</button>
      </template>
    </SurfaceHeader>

    <div class="st-stage">
      <canvas ref="canvasEl" class="st-canvas" aria-label="3D space view — drag to orbit, scroll to zoom" />

      <!-- readout overlay -->
      <div class="st-readout" v-if="mode === 'solar'">
        <div class="st-date">{{ dateLabel }}</div>
        <div class="st-epi">epistemic <b>{{ epistemic }}</b><span v-if="lensOn" class="st-lens-tag"> · lens speculative</span></div>
        <div class="st-center">⌖ center <b>{{ centerName }}</b> <span class="st-hint">— click a body to recenter</span></div>
        <ul class="st-planets">
          <li v-for="p in planetReadout" :key="p.id">
            <span class="st-dot" :style="{ background: p.css }" />{{ p.name }}
            <span class="st-au">{{ p.au }} AU</span>
          </li>
        </ul>
      </div>
      <div class="st-readout" v-else-if="mode === 'galaxy'">
        <div class="st-date">Procedural galaxy</div>
        <div class="st-epi">epistemic <b>{{ epistemic }}</b></div>
        <p class="st-note">{{ galaxyStars.length.toLocaleString() }} generated stars · {{ arms }} spiral arms</p>
      </div>
      <div class="st-readout st-readout--quad" v-else>
        <div class="st-date">Cube of space · Sol sector</div>
        <div class="st-epi">epistemic <b>{{ epistemic }}</b> · <span class="st-src">{{ quadrantSourceLabel }}</span></div>
        <div class="st-center">⌖ center <b>{{ centerName }}</b> <span class="st-hint">— click a system to recenter</span></div>
        <p class="st-note">{{ quadrant.length }} systems · {{ mappedRegions }} / {{ REGIONS }} regions mapped · ±{{ CUBE_LY }} ly</p>
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
import { loadQuadrant, cubeEdges, sectorGrid, mappedSectors, CUBE_LY, QUAD_SCALE, SECTORS, type StarSystem } from '../space/quadrant';

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

const mode = ref<'solar' | 'galaxy' | 'quadrant'>('solar');
const canvasEl = ref<HTMLCanvasElement | null>(null);
const deck = shallowRef<Deck<OrbitView[]> | null>(null);

// ── quadrant "cube of space" — fed by live USOL plus an initial data load ──
const quadrant = ref<StarSystem[]>([]);
const quadrantSource = ref<'loading' | 'usol-live' | 'initial-load' | 'seed'>('loading');
const REGIONS = SECTORS ** 3;
const mappedRegions = computed(() => mappedSectors(quadrant.value));
const quadrantSourceLabel = computed(() =>
  quadrantSource.value === 'usol-live' ? 'live USOL'
  : quadrantSource.value === 'initial-load' ? 'initial data load'
  : quadrantSource.value === 'seed' ? 'seed (offline)'
  : 'loading…');
const quadrantProv = computed(() =>
  quadrantSource.value === 'usol-live'
    ? prov('computed', { verifier: 'live USOL service (/api/space/quadrant)', sources: ['USOL nearby-star astrometry'], note: 'Hydrated from the live USOL data plane.' })
    : prov('fixture', { sources: ['nearby-star astrometry, public catalogs (factual)'], note: 'Initial data load (shipped bundle). Live USOL hydration via /api/space/quadrant when the service is up.' }));
let quadrantLoaded = false;
async function ensureQuadrant() {
  if (quadrantLoaded) return;
  quadrantLoaded = true;
  const d = await loadQuadrant();
  quadrant.value = d.systems;
  quadrantSource.value = d.source;
}

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

// ── typed interpretive lens (governed, capped speculative — annotates, never alters the ephemeris) ──
// Binds this surface's honesty to the estate epistemic lattice: computed solar data is `empirical`,
// the generated galaxy is `speculative`, and a lens overlay is capped at `speculative` — never read as
// ground truth. This is the usolspace projection discipline (typed, capped, graduatable) in the UI.
const lensOn = ref(false);
const epistemic = computed<'empirical' | 'speculative' | 'synthetic'>(() =>
  mode.value === 'solar' ? 'empirical'
  : mode.value === 'quadrant' ? (quadrantSource.value === 'usol-live' ? 'empirical' : 'synthetic')
  : 'speculative');
// "Center the universe on any point" — the observer origin. Default is heliocentric (the Sun).
const centerId = ref<string>('sun');
const centerName = ref<string>('Sun');

const ECLIPTIC_AU = 34; // a reference ring just beyond the outer planets
function eclipticLensLayers() {
  // The zodiac IS the ecliptic divided into twelve — an interpretive division of the plane, not a
  // physical feature. Drawn in the z=0 ecliptic plane as a ring plus 12 sector spokes.
  const R = ECLIPTIC_AU * AU;
  const ring: [number, number, number][] = [];
  for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; ring.push([Math.cos(a) * R, Math.sin(a) * R, 0]); }
  const data: { path: [number, number, number][] }[] = [{ path: ring }];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    data.push({ path: [[Math.cos(a) * R * 0.94, Math.sin(a) * R * 0.94, 0], [Math.cos(a) * R, Math.sin(a) * R, 0]] });
  }
  return [
    new PathLayer({
      id: 'ecliptic-lens', data, coordinateSystem: cart,
      getPath: (d: any) => d.path, getColor: [154, 127, 208, 120],
      getWidth: 1, widthUnits: 'pixels', widthMinPixels: 1,
    }),
  ];
}

function solarLayers() {
  const date = simDate.value;
  const orbits = PLANETS.map((p) => ({
    path: orbitPath(p, date, 160).map(([x, y, z]) => [x * AU, y * AU, z * AU]),
    color: [...p.color, 90] as [number, number, number, number],
  }));
  const bodies = [
    { position: [0, 0, 0] as [number, number, number], color: [255, 214, 92], radius: 9, name: 'Sun', id: 'sun' },
    ...PLANETS.map((p) => {
      const [x, y, z] = heliocentric(p, date);
      return {
        position: [x * AU, y * AU, z * AU] as [number, number, number],
        color: p.color, name: p.name, id: p.id,
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
      onClick: (info: any) => recenterOn(info.object),   // center the universe on any body
      updateTriggers: { getPosition: dayOffset.value },
    }),
    ...(lensOn.value ? eclipticLensLayers() : []),
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

function quadrantLayers() {
  const nodes = quadrant.value.map((s) => ({
    id: s.id, name: s.name,
    position: [s.position[0] * QUAD_SCALE, s.position[1] * QUAD_SCALE, s.position[2] * QUAD_SCALE] as [number, number, number],
    color: s.color,
  }));
  return [
    new PathLayer({
      id: 'quad-grid', data: sectorGrid(), coordinateSystem: cart,
      getPath: (d: any) => d.path, getColor: [0, 180, 220, 40],
      getWidth: 1, widthUnits: 'pixels', widthMinPixels: 1,
    }),
    new PathLayer({
      id: 'quad-cube', data: cubeEdges(), coordinateSystem: cart,
      getPath: (d: any) => d.path, getColor: [0, 224, 255, 170],
      getWidth: 1.5, widthUnits: 'pixels', widthMinPixels: 1,
    }),
    new ScatterplotLayer({ // holographic glow halo
      id: 'quad-halo', data: nodes, coordinateSystem: cart,
      getPosition: (d: any) => d.position,
      getFillColor: (d: any): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 38],
      getRadius: 7, radiusUnits: 'pixels', radiusMinPixels: 6, radiusMaxPixels: 26, stroked: false,
    }),
    new ScatterplotLayer({ // bright core — pickable → recenter the cube on any system
      id: 'quad-stars', data: nodes, coordinateSystem: cart,
      getPosition: (d: any) => d.position, getFillColor: (d: any) => d.color,
      getRadius: 2.5, radiusUnits: 'pixels', radiusMinPixels: 2, radiusMaxPixels: 6, stroked: false,
      pickable: true, onClick: (info: any) => recenterOn(info.object),
    }),
  ];
}

function layersForMode(m: 'solar' | 'galaxy' | 'quadrant') {
  return m === 'solar' ? solarLayers() : m === 'galaxy' ? galaxyLayers() : quadrantLayers();
}

function initialViewState(): OrbitViewState {
  if (mode.value === 'solar') return { target: [0, 0, 0], rotationX: 42, rotationOrbit: 30, zoom: -3.2, minZoom: -6, maxZoom: 4 };
  if (mode.value === 'quadrant') return { target: [0, 0, 0], rotationX: 38, rotationOrbit: 24, zoom: -5.2, minZoom: -8, maxZoom: 4 };
  return { target: [0, 0, 0], rotationX: 62, rotationOrbit: 0, zoom: -3.4, minZoom: -6, maxZoom: 4 };
}

// The camera is CONTROLLED — we own the view state. `initialViewState()` is only the per-mode DEFAULT;
// after mount `viewState` tracks the user's zoom/drag (via onViewStateChange), and the galaxy spin
// advances ONLY rotationOrbit. The bug this replaces reapplied `initialViewState()` every frame, which
// threw away the user's zoom/drag/target the instant the spin ran. deck's setProps takes view state
// keyed by view id, so the single OrbitView is named.
let viewState: OrbitViewState = initialViewState();
function pushView() {
  deck.value?.setProps({ viewState: { orbit: viewState } });
}

// ── recenter: center the universe on any point (a clicked body, or the Sun) ──
// A snapshot at click time — the origin does NOT chase the body as time plays (re-click to recenter),
// which keeps the controlled view honest and never fights the user's own pan/zoom.
function recenterOn(body: { id?: string; name?: string; position?: [number, number, number] } | null | undefined) {
  if (!body || !body.position) return;
  centerId.value = body.id ?? 'sun';
  centerName.value = body.name ?? 'Sun';
  viewState = { ...viewState, target: body.position };
  pushView();
}
function recenterSun() {
  centerId.value = 'sun';
  centerName.value = 'Sun';
  viewState = { ...viewState, target: [0, 0, 0] };
  pushView();
}

function render() {
  if (!deck.value) return;
  deck.value.setProps({ layers: layersForMode(mode.value) });
}

function setMode(m: 'solar' | 'galaxy' | 'quadrant') {
  if (m === mode.value) return;
  mode.value = m;
  playing.value = false;
  galaxyAngle = 0;                    // so re-entering a spinning mode does not resume mid-spin
  recenterSun();                      // a mode switch resets the observer origin to heliocentric
  if (m === 'quadrant') void ensureQuadrant();   // live USOL + initial data load, on first entry
  viewState = initialViewState();     // a mode switch DELIBERATELY reframes to the new mode's default
  deck.value?.setProps({ viewState: { orbit: viewState }, layers: layersForMode(m) });
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
      viewState = { ...viewState, rotationOrbit: galaxyAngle };   // preserve the user's zoom/drag/target
      pushView();
    }
  }
  raf = requestAnimationFrame(tick);
}

watch([dayOffset, mode, lensOn, quadrant], render);

onMounted(() => {
  if (!canvasEl.value) return;
  viewState = initialViewState();
  deck.value = new Deck<OrbitView[]>({
    canvas: canvasEl.value,
    views: [new OrbitView({ id: 'orbit', orbitAxis: 'Z', fovy: 50 })],
    viewState: { orbit: viewState },
    controller: true,
    // Controlled view: fold the user's own zoom/drag back into `viewState` so the spin (which only
    // touches rotationOrbit) never clobbers it, and a re-render never snaps the camera home.
    onViewStateChange: ({ viewState: vs }) => { viewState = vs as OrbitViewState; pushView(); },
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
.st-lens { display: inline-flex; align-items: center; gap: 5px; margin-left: 8px; color: var(--text-2, #9aa4b2);
  font-size: 0.8rem; cursor: pointer; }
.st-epi { margin-bottom: 6px; font-size: 0.7rem; letter-spacing: 0.05em; text-transform: uppercase; color: #8b97a8; }
.st-epi b { color: #e8b84b; font-weight: 600; text-transform: none; }
.st-lens-tag { color: #9a7fd0; }
.st-center { font-size: 0.72rem; color: #cfd8e6; margin-bottom: 6px; }
.st-center b { color: #eef3fa; }
.st-hint { color: #6b788c; }
.st-reset { border: 1px solid rgba(120, 140, 180, 0.3); background: var(--surface-2, #11151c); color: var(--text-2, #9aa4b2);
  font: inherit; font-size: 0.8rem; padding: 5px 10px; border-radius: 6px; cursor: pointer; margin-left: 6px; }
.st-reset:hover { color: #fff; border-color: var(--accent, #3a6df0); }
/* quadrant hologram: cyan holo-cube styling */
.st-readout--quad { border-color: rgba(0, 210, 255, 0.35); box-shadow: 0 0 24px rgba(0, 200, 255, 0.08) inset; }
.st-readout--quad .st-date { color: #aef2ff; }
.st-src { color: #4fd0e6; }
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

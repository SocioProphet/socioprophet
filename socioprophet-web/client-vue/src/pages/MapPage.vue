<template>
  <section class="map-page">
    <header class="map-page-header">
      <div>
        <p class="eyebrow">Maps &amp; Analytics · {{ dataModeLabel }}</p>
        <h1>OpenStreetMap × GAIA world model</h1>
        <p class="map-subtitle">
          Read-only map workbench for OSM identity, GAIA bindings, H3 lookup, advisory routing,
          Sherlock evidence, provenance, and governance state.
        </p>
      </div>
      <div class="status-stack">
        <span :class="['tag', dataMode === 'live' ? 'tag-green' : 'tag-blue']">{{ dataModeLabel }}</span>
        <span class="tag tag-blue">advisory routing</span>
        <span class="tag">last loaded · {{ lastLoadedAtLabel }}</span>
        <span class="tag">/map</span>
      </div>
    </header>

    <div v-if="loading" class="state-card">Loading GAIA map state…</div>
    <div v-if="warning" class="state-card warning">
      {{ warning }} This mode is for product demonstration only and is not a production data plane.
    </div>
    <div v-if="error && !snapshot" class="state-card error">{{ error }}</div>

    <div v-if="snapshot" class="map-grid">
      <aside class="panel left-panel">
        <section class="panel-section">
          <div class="section-title">Workbench controls</div>
          <button class="primary" type="button" :disabled="refreshing" @click="refreshSnapshot">
            {{ refreshing ? 'Refreshing…' : 'Refresh snapshot' }}
          </button>
          <div class="control-actions">
            <button class="secondary" type="button" @click="jumpToPanel('feature-panel')">Feature</button>
            <button class="secondary" type="button" @click="jumpToPanel('evidence-panel')">Evidence</button>
            <button class="secondary" type="button" @click="jumpToPanel('governance-panel')">Governance</button>
          </div>
          <p class="lookup-status">{{ refreshStatus || `Current data mode: ${dataModeLabel}` }}</p>
        </section>

        <section class="panel-section">
          <div class="section-title">Layers</div>
          <button
            v-for="layer in layers"
            :key="layer.layer_id"
            :class="['layer-card', { selected: selectedLayerId === layer.layer_id }]"
            type="button"
            @click="selectedLayerId = layer.layer_id"
          >
            <div class="layer-title">{{ layer.title }}</div>
            <div class="layer-meta">{{ layer.layer_type }} · {{ layer.tiles?.format || 'metadata' }}</div>
            <div class="layer-attribution">{{ layer.attribution?.attribution_text }}</div>
          </button>
        </section>

        <section class="panel-section">
          <div class="section-title">Spatial lookup</div>
          <label class="input-label">H3 cell</label>
          <input v-model="h3Cell" class="field" type="text" />
          <button class="primary" type="button" :disabled="h3Loading" @click="refreshH3">
            {{ h3Loading ? 'Inspecting…' : 'Inspect H3' }}
          </button>
          <p v-if="lookupStatus" class="lookup-status">{{ lookupStatus }}</p>
        </section>

        <section class="panel-section">
          <div class="section-title">Runtime posture</div>
          <div class="runtime-row" v-for="runtime in runtimes" :key="runtime.name">
            <span>{{ runtime.name }}</span>
            <strong>{{ runtime.lattice_admission || runtime.status }}</strong>
          </div>
        </section>
      </aside>

      <main class="map-stage">
        <div ref="mapContainer" class="map-canvas" aria-label="GAIA map canvas"></div>
        <div class="map-overlay top-left">
          <strong>{{ selectedLayer?.title || 'GAIA OSM Demo Road Layer' }}</strong>
          <span>{{ selectedFeature?.gaia_ref?.entity_type || 'GAIA feature' }}</span>
        </div>
        <div class="map-overlay bottom-left">
          <span>OSM {{ selectedFeature?.osm_ref?.osm_type }}/{{ selectedFeature?.osm_ref?.osm_id }}</span>
          <span>{{ selectedFeature?.routing?.safety_status || routeSafetyStatus }}</span>
        </div>
      </main>

      <aside class="panel right-panel">
        <section id="feature-panel" class="panel-section">
          <div class="section-title">Feature inspector</div>
          <h2>{{ selectedFeature?.gaia_ref?.entity_id || 'No feature selected' }}</h2>
          <div class="detail-grid">
            <span>Source</span><strong>{{ selectedFeature?.source || '—' }}</strong>
            <span>OSM ref</span><strong>{{ selectedFeature?.osm_ref?.osm_type }}/{{ selectedFeature?.osm_ref?.osm_id }}</strong>
            <span>GAIA type</span><strong>{{ selectedFeature?.gaia_ref?.entity_type || '—' }}</strong>
            <span>Safety</span><strong>{{ selectedFeature?.routing?.safety_status || routeSafetyStatus }}</strong>
            <span>Data mode</span><strong>{{ dataModeLabel }}</strong>
            <span>Last loaded</span><strong>{{ lastLoadedAtLabel }}</strong>
          </div>
          <div class="tag-row">
            <span v-for="cell in featureH3Cells" :key="cell" class="tag">{{ cell }}</span>
          </div>
        </section>

        <section id="evidence-panel" class="panel-section">
          <div class="section-title">Evidence</div>
          <h2>{{ sherlockResult?.title || 'Sherlock evidence' }}</h2>
          <p>{{ sherlockResult?.snippet || 'No evidence loaded.' }}</p>
          <ul class="evidence-list">
            <li v-for="ref in evidenceRefs" :key="ref">{{ ref }}</li>
          </ul>
        </section>

        <section id="governance-panel" class="panel-section">
          <div class="section-title">Governance</div>
          <div class="detail-grid">
            <span>Attribution</span><strong>{{ governance?.attribution_required ? 'required' : 'not required' }}</strong>
            <span>Lanes</span><strong>{{ governance?.validation_lanes?.length || 0 }}</strong>
            <span>Receipt</span><strong>{{ selectedReceipt?.integrity?.digest ? 'digest' : 'unsigned' }}</strong>
            <span>Mode</span><strong>{{ dataModeLabel }}</strong>
          </div>
          <ul class="evidence-list">
            <li v-for="lane in governance?.validation_lanes || []" :key="lane.id">{{ lane.id }} · {{ lane.state || 'unknown' }}</li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import {
  fetchFeaturesByH3WithFallback,
  fetchGaiaMapSnapshotWithFallback,
  type GaiaMapDataMode,
} from '../api/gaiaMap';
import type { GaiaMapSnapshot, H3FeatureLayerSearch, MapLayer, ResponseReceipt } from '../types/gaiaMap';

const loading = ref(true);
const refreshing = ref(false);
const h3Loading = ref(false);
const error = ref<string | null>(null);
const warning = ref<string | null>(null);
const refreshStatus = ref<string | null>(null);
const lookupStatus = ref<string | null>(null);
const lastLoadedAt = ref<Date | null>(null);
const dataMode = ref<GaiaMapDataMode>('live');
const snapshot = ref<GaiaMapSnapshot | null>(null);
const h3Result = ref<H3FeatureLayerSearch | null>(null);
const selectedLayerId = ref<string | null>(null);
const h3Cell = ref('8928308280fffff');
const mapContainer = ref<HTMLElement | null>(null);
let map: maplibregl.Map | null = null;
let marker: maplibregl.Marker | null = null;

const dataModeLabel = computed(() => (dataMode.value === 'live' ? 'live API' : 'demo fallback'));
const lastLoadedAtLabel = computed(() => lastLoadedAt.value?.toLocaleString() || 'not loaded');
const layers = computed(() => snapshot.value?.layers.layers || []);
const selectedLayer = computed<MapLayer | undefined>(() => layers.value.find((layer) => layer.layer_id === selectedLayerId.value) || layers.value[0]);
const selectedFeature = computed(() => h3Result.value?.features?.[0] || snapshot.value?.feature || null);
const governance = computed(() => snapshot.value?.governance || null);
const sherlockResult = computed(() => snapshot.value?.search || null);
const runtimes = computed(() => snapshot.value?.runtimeBoundaries.runtimes || []);
const routeSafetyStatus = computed(() => snapshot.value?.routes.default_safety_status || 'advisory');
const selectedReceipt = computed<ResponseReceipt | undefined>(() => selectedFeature.value?.response_receipt || selectedLayer.value?.response_receipt);
const featureH3Cells = computed(() => selectedFeature.value?.spatial?.h3_cells || []);
const evidenceRefs = computed(() => sherlockResult.value?.evidence_refs || selectedFeature.value?.provenance?.source_refs || []);

function featureCenter(): [number, number] {
  const bbox = selectedFeature.value?.spatial?.bbox;
  if (Array.isArray(bbox) && bbox.length >= 4) {
    return [(Number(bbox[0]) + Number(bbox[2])) / 2, (Number(bbox[1]) + Number(bbox[3])) / 2];
  }
  return [-74.006, 40.7128];
}

function initializeMap() {
  if (!mapContainer.value || map) return;
  const center = featureCenter();
  map = new maplibregl.Map({
    container: mapContainer.value,
    center,
    zoom: 13,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm-base', type: 'raster', source: 'osm' }],
    },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  marker = new maplibregl.Marker({ color: '#0f62fe' })
    .setLngLat(center)
    .setPopup(new maplibregl.Popup({ offset: 16 }).setText(`OSM ${selectedFeature.value?.osm_ref?.osm_type || 'way'} ${selectedFeature.value?.osm_ref?.osm_id || '424242'}`))
    .addTo(map);
}

function updateMapMarker() {
  if (!map || !marker) return;
  const center = featureCenter();
  marker.setLngLat(center);
  map.easeTo({ center, zoom: 13, duration: 600 });
}

function jumpToPanel(panelId: string) {
  document.getElementById(panelId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadSnapshot(reason: 'initial' | 'manual' = 'initial') {
  const initialLoad = snapshot.value === null;
  loading.value = initialLoad;
  refreshing.value = !initialLoad;
  error.value = null;
  if (reason === 'manual') {
    refreshStatus.value = 'Refreshing GAIA map snapshot…';
  }

  try {
    const result = await fetchGaiaMapSnapshotWithFallback();
    snapshot.value = result.snapshot;
    h3Result.value = result.snapshot.h3;
    dataMode.value = result.mode;
    warning.value = result.warning || null;
    selectedLayerId.value = result.snapshot.layers.layers[0]?.layer_id || null;
    lastLoadedAt.value = new Date();
    refreshStatus.value = result.mode === 'live'
      ? 'Snapshot loaded from live GAIA OSM API.'
      : 'Snapshot loaded from deterministic demo fallback.';
    await nextTick();
    initializeMap();
    updateMapMarker();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!snapshot.value) {
      error.value = message;
    }
    refreshStatus.value = snapshot.value
      ? `Refresh failed; keeping last loaded snapshot: ${message}`
      : null;
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function refreshSnapshot() {
  await loadSnapshot('manual');
}

async function refreshH3() {
  h3Loading.value = true;
  lookupStatus.value = 'Inspecting H3 cell…';
  try {
    const result = await fetchFeaturesByH3WithFallback(h3Cell.value);
    h3Result.value = result.result;
    dataMode.value = result.mode === 'demo' ? 'demo' : dataMode.value;
    warning.value = result.warning || warning.value;
    lookupStatus.value = result.mode === 'live' ? 'H3 lookup returned from live API.' : 'H3 lookup returned from demo fallback.';
    updateMapMarker();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    lookupStatus.value = `H3 lookup failed; keeping previous result: ${message}`;
    if (!snapshot.value) {
      error.value = message;
    }
  } finally {
    h3Loading.value = false;
  }
}

onMounted(async () => {
  await loadSnapshot('initial');
});

onUnmounted(() => {
  marker?.remove();
  map?.remove();
  marker = null;
  map = null;
});
</script>

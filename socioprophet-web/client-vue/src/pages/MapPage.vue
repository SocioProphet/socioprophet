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
            <button class="secondary" type="button" @click="jumpToPanel('catalog-panel')">Catalog</button>
          </div>
          <p class="lookup-status">{{ refreshStatus || `Current data mode: ${dataModeLabel}` }}</p>
        </section>

        <section class="panel-section" id="layers-panel">
          <div class="section-title">
            Layers
            <span :class="['tag', catalogMode === 'live' ? 'tag-green' : 'tag-blue']" style="margin-left:0.5rem;font-size:0.7rem;">{{ catalogMode === 'live' ? 'catalog live' : 'catalog fallback' }}</span>
          </div>
          <div v-if="catalogWarning" class="state-card warning" style="font-size:0.75rem;padding:0.4rem;">{{ catalogWarning }}</div>
          <button
            v-for="layer in catalogLayers"
            :key="layer.layer_id"
            :class="['layer-card', { selected: selectedLayerId === layer.layer_id }]"
            type="button"
            @click="selectLayer(layer.layer_id)"
          >
            <div class="layer-title">{{ layer.title }}</div>
            <div class="layer-meta">{{ layer.layer_type || 'vector' }} · {{ layer.sources?.[0]?.source_type || 'osm' }}</div>
            <div class="layer-attribution">{{ layer.attribution?.attribution_text }}</div>
          <div v-if="layer.classification?.fixture_backed" class="tag tag-blue" style="font-size:0.65rem;margin-top:0.25rem;">fixture-backed · non-production</div>
          </button>
        </section>

        <section class="panel-section">
          <div class="section-title">Spatial lookup</div>
          <label class="input-label">H3 cell</label>
          <input v-model="h3Cell" class="field" type="text" />
          <button class="primary" type="button" :disabled="h3Loading" data-testid="h3-inspect-button" @click="refreshH3">
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
          <strong>{{ selectedCatalogLayer?.title || selectedLayer?.title || 'GAIA OSM Demo Road Layer' }}</strong>
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

        <section id="catalog-panel" class="panel-section">
          <div class="section-title">
            Layer catalog
            <span class="tag tag-blue" style="font-size:0.7rem;margin-left:0.5rem;">{{ catalogMode === 'live' ? 'live API' : 'fixture fallback' }}</span>
          </div>
          <div v-if="selectedCatalogLayer" class="detail-grid" data-testid="catalog-layer-detail">
            <span>Layer ID</span><strong>{{ selectedCatalogLayer.layer_id }}</strong>
            <span>Title</span><strong>{{ selectedCatalogLayer.title }}</strong>
            <span>Type</span><strong>{{ selectedCatalogLayer.layer_type || '—' }}</strong>
            <span>Source</span><strong>{{ selectedCatalogLayer.sources?.[0]?.source_type || '—' }}</strong>
            <span>Attribution</span><strong>{{ selectedCatalogLayer.attribution?.attribution_text || '—' }}</strong>
            <span>License</span><strong>{{ selectedCatalogLayer.attribution?.license_refs?.join(', ') || '—' }}</strong>
            <span>BBox</span><strong>{{ selectedCatalogLayer.spatial?.bbox ? selectedCatalogLayer.spatial.bbox.map(v => v.toFixed(3)).join(', ') : '—' }}</strong>
            <span>H3 cells</span><strong>{{ selectedCatalogLayer.spatial?.h3_cells?.join(', ') || '—' }}</strong>
            <span>Fixture digest</span><strong>{{ selectedCatalogLayer.provenance?.fixture_digest || '—' }}</strong>
            <span>Source receipt</span><strong>{{ selectedCatalogLayer.provenance?.source_receipt_ref || '—' }}</strong>
            <span>Safety status</span><strong>{{ selectedCatalogLayer.classification?.safety_status || '—' }}</strong>
            <span>Production ready</span><strong>{{ selectedCatalogLayer.classification?.production_ready ? 'yes' : 'no' }}</strong>
            <span>Generated</span><strong>{{ selectedCatalogLayer.generated_at || '—' }}</strong>
          </div>
          <div v-else class="lookup-status">No catalog layer selected.</div>
          <div v-if="selectedCatalogLayer?.classification?.fixture_backed" class="panel-advisory" data-testid="catalog-fixture-advisory">
            ⚠ This layer is fixture-backed and not production tile serving. Data is advisory only.
          </div>
        </section>

        <section id="tile-manifest-panel" class="panel-section">
          <div class="section-title">Tile manifest</div>
          <div v-if="tileManifestLoading" class="lookup-status">Loading tile manifest…</div>
          <div v-else-if="tileManifest" class="detail-grid" data-testid="tile-manifest-detail">
            <span>Layer ID</span><strong>{{ tileManifest.layer_id }}</strong>
            <span>URL template</span><strong>{{ tileManifest.url_template }}</strong>
            <span>Format</span><strong>{{ tileManifest.format || '—' }}</strong>
            <span>Attribution</span><strong>{{ tileManifest.attribution || '—' }}</strong>
            <span>Source receipt</span><strong>{{ tileManifest.source_receipt_ref || '—' }}</strong>
            <span>Generated</span><strong>{{ tileManifest.generated_at || '—' }}</strong>
          </div>
          <div v-if="tileManifest?.is_placeholder" class="panel-advisory" data-testid="tile-manifest-placeholder-notice">
            ⚠ Tile URL is a placeholder. Manifest displayed as metadata only — tiles are not loaded as production tiles.
          </div>
          <div v-if="tileManifestWarning" class="lookup-status" style="font-size:0.75rem;">{{ tileManifestWarning }}</div>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  fetchFeaturesByH3WithFallback,
  fetchGaiaLayerCatalogWithFallback,
  fetchGaiaTileManifestWithFallback,
  fetchGaiaMapSnapshotWithFallback,
  isPlaceholderTileUrl,
  type GaiaMapDataMode,
} from '../api/gaiaMap';
import type {
  GaiaLayerCatalog,
  GaiaLayerEntry,
  GaiaTileManifest,
  GaiaMapSnapshot,
  H3FeatureLayerSearch,
  MapLayer,
  ResponseReceipt,
} from '../types/gaiaMap';

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

// GAIA Layer Catalog state
const catalog = ref<GaiaLayerCatalog | null>(null);
const catalogMode = ref<GaiaMapDataMode>('demo');
const catalogWarning = ref<string | null>(null);
const tileManifest = ref<GaiaTileManifest | null>(null);
const tileManifestLoading = ref(false);
const tileManifestWarning = ref<string | null>(null);

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

// Catalog computed
const catalogLayers = computed(() => catalog.value?.layers || layers.value.map<GaiaLayerEntry>((l) => ({
  layer_id: l.layer_id,
  title: l.title,
  layer_type: l.layer_type,
  sources: l.sources as GaiaLayerEntry['sources'],
  attribution: l.attribution,
  spatial: l.spatial,
  provenance: l.provenance,
  classification: l.classification as GaiaLayerEntry['classification'],
})));
const selectedCatalogLayer = computed<GaiaLayerEntry | undefined>(
  () => catalogLayers.value.find((l) => l.layer_id === selectedLayerId.value) || catalogLayers.value[0],
);

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
          // Always use the real OSM tile URL — never load placeholder:// or demo:// tile URLs.
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

async function loadLayerCatalog() {
  const result = await fetchGaiaLayerCatalogWithFallback();
  catalog.value = result.catalog;
  catalogMode.value = result.mode;
  catalogWarning.value = result.warning || null;
}

async function loadTileManifest(layerId: string) {
  tileManifestLoading.value = true;
  tileManifestWarning.value = null;
  try {
    const result = await fetchGaiaTileManifestWithFallback(layerId);
    tileManifest.value = result.manifest;
    tileManifestWarning.value = result.warning || null;
    // Safety guard: never add a placeholder tile URL as a MapLibre tile source.
    if (isPlaceholderTileUrl(result.manifest.url_template)) {
      // Manifest is displayed as metadata only; no tile network request is made.
    }
  } finally {
    tileManifestLoading.value = false;
  }
}

function selectLayer(layerId: string) {
  selectedLayerId.value = layerId;
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

// Fetch tile manifest whenever the selected layer changes
watch(selectedLayerId, (newId) => {
  if (newId) loadTileManifest(newId);
});

onMounted(async () => {
  await Promise.all([loadSnapshot('initial'), loadLayerCatalog()]);
  if (selectedLayerId.value) await loadTileManifest(selectedLayerId.value);
});

onUnmounted(() => {
  marker?.remove();
  map?.remove();
  marker = null;
  map = null;
});
</script>

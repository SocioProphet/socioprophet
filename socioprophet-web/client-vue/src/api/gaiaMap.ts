import type {
  GaiaMapSnapshot,
  GovernanceState,
  H3FeatureLayerSearch,
  MapLayer,
  MapLayerList,
  OsmFeatureBinding,
  ResponseReceipt,
  RouteGraphList,
  RuntimeBoundaryList,
  SherlockResult,
} from '../types/gaiaMap';

const API_BASE = (import.meta as any).env?.VITE_GAIA_MAP_API_BASE || '/api';
const DEFAULT_OSM_TYPE = 'way';
const DEFAULT_OSM_ID = '424242';
const DEFAULT_H3_CELL = '8928308280fffff';

export type GaiaMapDataMode = 'live' | 'demo';

export type GaiaMapLoadResult = {
  snapshot: GaiaMapSnapshot;
  mode: GaiaMapDataMode;
  warning?: string;
};

export type GaiaH3LoadResult = {
  result: H3FeatureLayerSearch;
  mode: GaiaMapDataMode;
  warning?: string;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function demoReceipt(responseKind: string, routeSafetyStatus: ResponseReceipt['route_safety_status'] = null): ResponseReceipt {
  return {
    receipt_version: 'v1',
    service: 'socioprophet-web-demo-fallback',
    response_kind: responseKind,
    source_refs: ['demo://gaia-osm-map-workbench'],
    provenance_refs_present: true,
    attribution: {
      required: true,
      present: true,
      texts: ['© OpenStreetMap contributors'],
      license_refs: ['ODbL-1.0'],
    },
    route_safety_status: routeSafetyStatus,
    safety_boundary: 'Demo fallback is advisory and not for navigation, routing, dispatch, or safety-critical use.',
    integrity: {
      signed: false,
      note: 'Deterministic in-browser demo fallback; not a signed backend receipt.',
      digest: 'demo-fallback-gaia-osm-v1',
      canonicalization: 'static-json',
    },
  };
}

const DEMO_LAYER: MapLayer = {
  manifest_version: 'v1',
  layer_id: 'gaia-osm-demo-road-layer-v1',
  layer_type: 'vector',
  title: 'GAIA OSM Demo Road Layer',
  sources: [
    {
      source_type: 'openstreetmap',
      source_ref: 'demo://osm/way/424242',
      fixture_backed: true,
    },
  ],
  tiles: {
    url_template: 'demo://tiles/gaia-osm-demo-road-layer/{z}/{x}/{y}.mvt',
    format: 'mvt-metadata',
  },
  spatial: {
    h3_cells: [DEFAULT_H3_CELL],
  },
  attribution: {
    attribution_text: '© OpenStreetMap contributors',
    license_refs: ['ODbL-1.0'],
    source_urls: ['https://www.openstreetmap.org/copyright'],
  },
  provenance: {
    source_refs: ['demo://gaia/osm-road-feature-binding.sample.v1.json'],
  },
  classification: {
    safety_status: 'advisory',
    fixture_backed: true,
  },
  response_receipt: demoReceipt('map-layer-list', 'advisory'),
};

const DEMO_FEATURE: OsmFeatureBinding = {
  binding_version: 'v1',
  binding_id: 'gaia-osm-way-424242-demo',
  source: 'openstreetmap',
  osm_ref: {
    osm_type: DEFAULT_OSM_TYPE,
    osm_id: DEFAULT_OSM_ID,
    tags: {
      highway: 'residential',
      name: 'Demo Corridor',
    },
  },
  gaia_ref: {
    entity_id: 'gaia:transport:demo-corridor-424242',
    entity_type: 'transportation_corridor',
  },
  spatial: {
    geometry_ref: 'demo://geometry/osm-way-424242',
    h3_cells: [DEFAULT_H3_CELL],
    bbox: [-74.012, 40.706, -73.998, 40.716],
    crs: 'EPSG:4326',
  },
  routing: {
    routable: true,
    modes: ['walk', 'bike', 'vehicle-advisory'],
    safety_status: 'advisory',
  },
  attribution: {
    attribution_text: '© OpenStreetMap contributors',
    license_ref: 'ODbL-1.0',
    license_refs: ['ODbL-1.0'],
    source_url: 'https://www.openstreetmap.org/copyright',
  },
  provenance: {
    source_refs: ['demo://gaia/osm-road-feature-binding.sample.v1.json'],
  },
  response_receipt: demoReceipt('osm-feature-binding', 'advisory'),
};

const DEMO_LAYERS: MapLayerList = {
  layers: [DEMO_LAYER],
  response_receipt: demoReceipt('map-layer-list', 'advisory'),
};

const DEMO_H3: H3FeatureLayerSearch = {
  h3_cell: DEFAULT_H3_CELL,
  features: [DEMO_FEATURE],
  layers: [DEMO_LAYER],
  response_receipt: demoReceipt('h3-feature-layer-search', 'advisory'),
};

const DEMO_ROUTES: RouteGraphList = {
  default_safety_status: 'advisory',
  route_graphs: [
    {
      graph_id: 'gaia-osm-demo-route-graph-v1',
      source: 'demo://gaia/osm-route-graph.sample.v1.json',
      safety_status: 'advisory',
      nodes: [
        { node_id: 'demo-start', h3_cell: DEFAULT_H3_CELL },
        { node_id: 'demo-end', h3_cell: DEFAULT_H3_CELL },
      ],
      edges: [
        { source: 'demo-start', target: 'demo-end', safety_status: 'advisory' },
      ],
      attribution: { attribution_text: '© OpenStreetMap contributors' },
      provenance: { source_refs: ['demo://gaia/osm-route-graph.sample.v1.json'] },
      response_receipt: demoReceipt('route-graph', 'advisory'),
    },
  ],
  response_receipt: demoReceipt('route-graph-list', 'advisory'),
};

const DEMO_RUNTIME_BOUNDARIES: RuntimeBoundaryList = {
  runtimes: [
    {
      name: 'gaia-osm-ingestion-runtime',
      status: 'executable-proof',
      validation_command: 'python3 geospatial/osm_ingest.py fixtures/geospatial/osm-way-input.sample.v1.json /tmp/osm-feature-bindings.json',
      lattice_admission: 'not-admitted',
    },
    {
      name: 'gaia-osm-route-graph-runtime',
      status: 'executable-proof',
      validation_command: 'python3 geospatial/osm_route_graph.py fixtures/geospatial/osm-road-feature-binding.sample.v1.json /tmp/osm-route-graph.json',
      lattice_admission: 'not-admitted',
    },
    {
      name: 'gaia-osm-tile-export-runtime',
      status: 'executable-proof',
      validation_command: 'python3 geospatial/osm_tile_export.py fixtures/geospatial/osm-road-feature-binding.sample.v1.json /tmp/osm-derived-map-tile-layer.json',
      lattice_admission: 'not-admitted',
    },
  ],
  admission_rule: 'No Lattice RuntimeAsset before reviewed boundary, executable entrypoint, validation command, passing fixture, policy constraints, rollback semantics, and named evidence outputs.',
  response_receipt: demoReceipt('runtime-boundaries', 'advisory'),
};

const DEMO_GOVERNANCE: GovernanceState = {
  validation_lanes: [
    {
      id: 'gaia-openstreetmap-bindings',
      repo: 'SocioProphet/gaia-world-model',
      required: true,
      state: 'fixture-proof',
    },
    {
      id: 'sherlock-geospatial-evidence',
      repo: 'SocioProphet/sherlock-search',
      required: true,
      state: 'fixture-proof',
    },
  ],
  source: 'demo://sociosphere/gaia-ofif-meshlab-capability-map.v1.json',
  attribution_required: true,
  unresolved_blockers: ['production tile backend', 'live OSM ingestion', 'Lattice RuntimeAsset admission'],
  response_receipt: demoReceipt('governance', 'advisory'),
};

const DEMO_SEARCH: SherlockResult = {
  record_version: 'v1',
  result_id: 'search-gaia-osm-demo-road-layer',
  source: 'Sherlock',
  entity_type: 'MAP_LAYER',
  title: 'GAIA OSM Demo Road Layer',
  snippet: 'Demo fallback record for an OSM-derived GAIA road-layer binding with advisory route semantics, attribution, provenance, and runtime-boundary state.',
  spatial_refs: [{ scheme: 'h3', value: DEFAULT_H3_CELL, role: 'demo' }],
  evidence_refs: ['demo://gaia/osm-road-feature-binding.sample.v1.json', 'demo://gaia/osm-route-graph.sample.v1.json'],
  provenance_refs: ['demo://sherlock/gaia-osm-derived-road-layer.sherlock-result.v1.json'],
  actions: {
    open_map: true,
    show_evidence: true,
    summarize: true,
    open_runtime: false,
  },
  response_receipt: demoReceipt('sherlock-result', 'advisory'),
};

const DEMO_SNAPSHOT: GaiaMapSnapshot = {
  layers: DEMO_LAYERS,
  feature: DEMO_FEATURE,
  h3: DEMO_H3,
  routes: DEMO_ROUTES,
  runtimeBoundaries: DEMO_RUNTIME_BOUNDARIES,
  governance: DEMO_GOVERNANCE,
  search: DEMO_SEARCH,
};

function cloneDemo<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

export function demoGaiaMapSnapshot(): GaiaMapSnapshot {
  return cloneDemo(DEMO_SNAPSHOT);
}

export async function fetchMapLayers(): Promise<MapLayerList> {
  return getJson<MapLayerList>('/map-layers');
}

export async function fetchFeatureByOsm(
  osmType = DEFAULT_OSM_TYPE,
  osmId = DEFAULT_OSM_ID,
): Promise<OsmFeatureBinding> {
  return getJson<OsmFeatureBinding>(`/features/by-osm/${encodeURIComponent(osmType)}/${encodeURIComponent(osmId)}`);
}

export async function fetchFeaturesByH3(h3Cell = DEFAULT_H3_CELL): Promise<H3FeatureLayerSearch> {
  return getJson<H3FeatureLayerSearch>(`/features/by-h3/${encodeURIComponent(h3Cell)}`);
}

export async function fetchFeaturesByH3WithFallback(h3Cell = DEFAULT_H3_CELL): Promise<GaiaH3LoadResult> {
  try {
    return { result: await fetchFeaturesByH3(h3Cell), mode: 'live' };
  } catch (err) {
    const result = cloneDemo(DEMO_H3);
    result.h3_cell = h3Cell;
    return {
      result,
      mode: 'demo',
      warning: `Using demo H3 fallback because the GAIA OSM API did not return H3 data: ${errorMessage(err)}`,
    };
  }
}

export async function fetchRouteGraphs(): Promise<RouteGraphList> {
  return getJson<RouteGraphList>('/route-graphs/osm');
}

export async function fetchRuntimeBoundaries(): Promise<RuntimeBoundaryList> {
  return getJson<RuntimeBoundaryList>('/runtime-boundaries/osm');
}

export async function fetchGovernance(): Promise<GovernanceState> {
  return getJson<GovernanceState>('/governance/osm');
}

export async function fetchSherlockOsmDemo(): Promise<SherlockResult> {
  return getJson<SherlockResult>('/search/osm-demo');
}

export async function fetchGaiaMapSnapshot(): Promise<GaiaMapSnapshot> {
  const [layers, feature, h3, routes, runtimeBoundaries, governance, search] = await Promise.all([
    fetchMapLayers(),
    fetchFeatureByOsm(),
    fetchFeaturesByH3(),
    fetchRouteGraphs(),
    fetchRuntimeBoundaries(),
    fetchGovernance(),
    fetchSherlockOsmDemo(),
  ]);
  return { layers, feature, h3, routes, runtimeBoundaries, governance, search };
}

export async function fetchGaiaMapSnapshotWithFallback(): Promise<GaiaMapLoadResult> {
  try {
    return { snapshot: await fetchGaiaMapSnapshot(), mode: 'live' };
  } catch (err) {
    return {
      snapshot: demoGaiaMapSnapshot(),
      mode: 'demo',
      warning: `Using deterministic demo fallback because the GAIA OSM API is unavailable: ${errorMessage(err)}`,
    };
  }
}

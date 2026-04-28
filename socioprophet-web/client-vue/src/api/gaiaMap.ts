import type {
  GaiaMapSnapshot,
  GovernanceState,
  H3FeatureLayerSearch,
  MapLayerList,
  OsmFeatureBinding,
  RouteGraphList,
  RuntimeBoundaryList,
  SherlockResult,
} from '../types/gaiaMap';

const API_BASE = (import.meta as any).env?.VITE_GAIA_MAP_API_BASE || '/api';
const DEFAULT_OSM_TYPE = 'way';
const DEFAULT_OSM_ID = '424242';
const DEFAULT_H3_CELL = '8928308280fffff';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
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

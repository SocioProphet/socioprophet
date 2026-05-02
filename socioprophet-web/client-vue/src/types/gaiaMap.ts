export type ResponseReceipt = {
  receipt_version: string;
  service: string;
  response_kind: string;
  source_refs: string[];
  provenance_refs_present: boolean;
  attribution: {
    required: boolean;
    present: boolean;
    texts: string[];
    license_refs: string[];
  };
  route_safety_status?: 'advisory' | 'validated' | 'restricted' | 'not-for-navigation' | 'unknown' | null;
  safety_boundary: string;
  integrity: {
    signed: boolean;
    note: string;
    digest?: string;
    canonicalization?: string;
  };
};

export type MapLayer = {
  manifest_version: string;
  layer_id: string;
  layer_type: string;
  title: string;
  sources: Array<Record<string, unknown>>;
  tiles: {
    url_template: string;
    format: string;
  };
  spatial?: {
    h3_cells?: string[];
  };
  attribution: {
    attribution_text: string;
    license_refs?: string[];
    source_urls?: string[];
  };
  provenance: {
    source_refs: string[];
  };
  classification?: Record<string, unknown>;
  response_receipt?: ResponseReceipt;
};

export type MapLayerList = {
  layers: MapLayer[];
  response_receipt: ResponseReceipt;
};

export type OsmFeatureBinding = {
  binding_version: string;
  binding_id: string;
  source: string;
  osm_ref: {
    osm_type: string;
    osm_id: string;
    tags?: Record<string, string>;
  };
  gaia_ref: {
    entity_id: string;
    entity_type: string;
  };
  spatial: {
    geometry_ref?: string;
    h3_cells?: string[];
    bbox?: number[];
    crs?: string;
  };
  routing?: {
    routable?: boolean;
    modes?: string[];
    safety_status?: string;
  };
  attribution: {
    attribution_text: string;
    license_ref?: string;
    license_refs?: string[];
    source_url?: string;
  };
  provenance: {
    source_refs: string[];
  };
  response_receipt?: ResponseReceipt;
};

export type H3FeatureLayerSearch = {
  h3_cell: string;
  features: OsmFeatureBinding[];
  layers: MapLayer[];
  response_receipt: ResponseReceipt;
};

export type RouteGraphList = {
  default_safety_status: string;
  route_graphs: Array<{
    graph_id: string;
    source: string;
    safety_status: string;
    nodes: unknown[];
    edges: unknown[];
    attribution?: Record<string, unknown>;
    provenance?: Record<string, unknown>;
    response_receipt?: ResponseReceipt;
  }>;
  response_receipt: ResponseReceipt;
};

export type RuntimeBoundaryList = {
  runtimes: Array<{
    name: string;
    status: string;
    validation_command: string;
    lattice_admission: string;
  }>;
  admission_rule: string;
  response_receipt?: ResponseReceipt;
};

export type GovernanceState = {
  validation_lanes: Array<{
    id: string;
    repo?: string;
    required?: boolean;
    state?: string;
  }>;
  source: string;
  attribution_required: boolean;
  unresolved_blockers: string[];
  response_receipt?: ResponseReceipt;
};

export type SherlockResult = {
  record_version: string;
  result_id: string;
  source: string;
  entity_type: string;
  title: string;
  snippet?: string;
  spatial_refs?: Array<Record<string, unknown>>;
  evidence_refs?: string[];
  provenance_refs: string[];
  actions?: Record<string, boolean>;
  response_receipt?: ResponseReceipt;
};

export type GaiaMapSnapshot = {
  layers: MapLayerList;
  feature: OsmFeatureBinding;
  h3: H3FeatureLayerSearch;
  routes: RouteGraphList;
  runtimeBoundaries: RuntimeBoundaryList;
  governance: GovernanceState;
  search: SherlockResult;
};

// ── GAIA Layer Catalog API types ────────────────────────────────────────────
// These correspond to the Prophet Platform endpoints:
//   GET /gaia/layers
//   GET /gaia/layers/{layer_id}
//   GET /gaia/tile-manifests/{layer_id}

export type GaiaLayerSource = {
  source_type: string;
  source_ref?: string;
  fixture_backed?: boolean;
};

export type GaiaLayerEntry = {
  layer_id: string;
  title: string;
  layer_type?: string;
  sources?: GaiaLayerSource[];
  attribution?: {
    attribution_text?: string;
    license_refs?: string[];
    source_urls?: string[];
  };
  spatial?: {
    h3_cells?: string[];
    bbox?: number[];
  };
  provenance?: {
    source_refs?: string[];
    fixture_digest?: string;
    source_receipt_ref?: string;
  };
  classification?: {
    safety_status?: string;
    fixture_backed?: boolean;
    production_ready?: boolean;
  };
  generated_at?: string;
  response_receipt?: ResponseReceipt;
};

export type GaiaLayerCatalog = {
  layers: GaiaLayerEntry[];
  generated_at?: string;
  response_receipt?: ResponseReceipt;
};

export type GaiaTileManifest = {
  layer_id: string;
  url_template: string;
  format?: string;
  is_placeholder: boolean;
  is_production?: boolean;
  generated_at?: string;
  attribution?: string;
  source_receipt_ref?: string;
  response_receipt?: ResponseReceipt;
};

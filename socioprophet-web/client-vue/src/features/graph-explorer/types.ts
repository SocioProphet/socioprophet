/**
 * Types for the Studio Graph Explorer panel.
 *
 * Two data planes converge here:
 *  1. The *ontology / topology* plane — the Prophet Platform surface graph, generated from
 *     structured surface data (the same shape the marketing Platform Explorer consumes,
 *     ultimately served by HellGraph). Nodes are `surface`s and their `topic` constituents.
 *  2. The *runtime* plane — a Kiali-style live topology: per-node health and traffic, sourced
 *     from the estate's telemetry / catalog-gateway. It is overlaid onto the ontology nodes.
 */

export type GraphMode = 'topology' | 'vector' | 'hybrid';
export type ExploreMode = 'global' | 'local' | 'drift';
export type SurfaceNodeType = 'surface' | 'topic';

/** Runtime health of the service(s) backing a surface node — Kiali vocabulary. */
export type RuntimeHealth = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface InvestorOverlay {
  lens?: string;
  value_drivers?: string[];
  economic_profit_proxy?: string[];
}

export interface SurfaceNode {
  id: string;
  type: SurfaceNodeType;
  label: string;
  category?: string;
  status?: string;
  graph_group?: string;
  description?: string;
  landing_page?: string | null;
  survey_page?: string | null;
  docs_path?: string | null;
  audiences?: string[];
  topic_constituents?: string[];
  normalized_topics?: string[];
  related_surfaces?: string[];
  related_sites?: string[];
  investor_overlay?: InvestorOverlay;
}

export interface GraphLink {
  source: string;
  target: string;
  type?: string;
  /** Present on vector links: the jaccard similarity that produced the edge. */
  score?: number;
}

export interface SurfaceGraph {
  version?: number;
  generated_at?: string;
  nodes: SurfaceNode[];
  /** Canonical shape. Older payloads may use `edges` for curated links. */
  links?: {
    curated?: GraphLink[];
    constituent?: GraphLink[];
    vector?: GraphLink[];
  };
  edges?: GraphLink[];
  source?: 'live' | 'bundled' | 'fixture';
}

/** The state driving {@link computeActiveGraph} — mirrors the marketing Platform Explorer controls. */
export interface ExplorerState {
  viewMode: GraphMode;
  searchMode: ExploreMode;
  threshold: number;
  showTopics: boolean;
  showExternal: boolean;
  query: string;
  selectedId: string | null;
  expandedSurfaceId: string | null;
}

/** Kiali-style per-node runtime stat, keyed by surface id. */
export interface RuntimeNodeStat {
  id: string;
  health: RuntimeHealth;
  /** Backing service name (e.g. `hellgraph-service`) for the details pane. */
  service?: string;
  /** Requests per second. */
  rps?: number;
  /** Error rate in [0, 1]. */
  errorRate?: number;
  /** p95 latency in milliseconds. */
  p95Ms?: number;
}

export interface RuntimeEdgeStat {
  source: string;
  target: string;
  rps?: number;
  errorRate?: number;
}

export interface RuntimeTopology {
  generated_at?: string;
  nodes: RuntimeNodeStat[];
  edges?: RuntimeEdgeStat[];
  source?: 'live' | 'fixture';
}

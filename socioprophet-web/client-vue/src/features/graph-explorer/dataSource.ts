/**
 * Data source for the Graph Explorer — data-driven, never hand-maintained prose.
 *
 * Ontology / topology plane, in preference order:
 *   1. HellGraph surface-graph endpoint  (`/svc/hellgraph/api/surface-graph`) — the live graph.
 *   2. Bundled generated payload         (`/assets/surface-graph.json`)       — same generator
 *      as the marketing Platform Explorer, shipped with the app.
 *   3. Compact TS fixture                                                     — offline / tests.
 *
 * Runtime plane, in preference order:
 *   1. Catalog-gateway / telemetry topology (`/svc/catalog/api/runtime-topology`) — Kiali-style.
 *   2. Runtime fixture                                                            — offline / tests.
 *
 * The live endpoints (1) are the follow-up @mdheller — until they exist, unreachable fetches fall
 * through cleanly to the bundled / fixture data, so the panel is always populated.
 */
import { RUNTIME_TOPOLOGY_FIXTURE, SURFACE_GRAPH_FIXTURE } from './fixture';
import type { RuntimeTopology, SurfaceGraph } from './types';

const HELLGRAPH_SURFACE_GRAPH = '/svc/hellgraph/api/surface-graph';
const BUNDLED_SURFACE_GRAPH = '/assets/surface-graph.json';
const CATALOG_RUNTIME_TOPOLOGY = '/svc/catalog/api/runtime-topology';

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

function isSurfaceGraph(v: unknown): v is SurfaceGraph {
  return !!v && typeof v === 'object' && Array.isArray((v as SurfaceGraph).nodes);
}

function isRuntimeTopology(v: unknown): v is RuntimeTopology {
  return !!v && typeof v === 'object' && Array.isArray((v as RuntimeTopology).nodes);
}

export interface SurfaceGraphResult {
  graph: SurfaceGraph;
  source: 'live' | 'bundled' | 'fixture';
}

/** Load the surface ontology graph, degrading gracefully to bundled data then the fixture. */
export async function loadSurfaceGraph(signal?: AbortSignal): Promise<SurfaceGraphResult> {
  for (const [url, source] of [
    [HELLGRAPH_SURFACE_GRAPH, 'live'],
    [BUNDLED_SURFACE_GRAPH, 'bundled'],
  ] as const) {
    try {
      const data = await fetchJson<unknown>(url, signal);
      if (isSurfaceGraph(data)) return { graph: { ...data, source }, source };
    } catch {
      /* try the next source */
    }
  }
  return { graph: { ...SURFACE_GRAPH_FIXTURE, source: 'fixture' }, source: 'fixture' };
}

export interface RuntimeTopologyResult {
  runtime: RuntimeTopology;
  source: 'live' | 'fixture';
}

/** Load the Kiali-style runtime topology, degrading gracefully to the fixture. */
export async function loadRuntimeTopology(signal?: AbortSignal): Promise<RuntimeTopologyResult> {
  try {
    const data = await fetchJson<unknown>(CATALOG_RUNTIME_TOPOLOGY, signal);
    if (isRuntimeTopology(data)) return { runtime: { ...data, source: 'live' }, source: 'live' };
  } catch {
    /* fall through to fixture */
  }
  return { runtime: { ...RUNTIME_TOPOLOGY_FIXTURE, source: 'fixture' }, source: 'fixture' };
}

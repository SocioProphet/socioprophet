// Canonical knowledge-graph client — hellgraph-service, the shared HTTP HellGraph engine
// (prophet-platform/apps/hellgraph-service). This is the ONE backend the cockpit's Knowledge
// Graph and the Prophet Studio Graph Explorer both read, so the graph is unified across surfaces.
//
// Base is the same-origin `/svc/hellgraph` proxy (see vite.config.ts) → :8090 in dev.
// Endpoints mirror the agent-machine surface contract, so SurfaceResult/GraphHealth are reused.
import type { SurfaceResult, GraphHealth } from './agentMachineApi';

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_HELLGRAPH_BASE ?? '/svc/hellgraph';

export const graphSurface = async (view = 'all', limit = 34, root = ''): Promise<SurfaceResult> => {
  const q = new URLSearchParams({ view, limit: String(limit) });
  if (root) q.set('root', root);
  const res = await fetch(`${BASE}/api/graph/surface?${q.toString()}`);
  if (!res.ok) throw new Error(`graph surface ${res.status}`);
  return res.json();
};

export async function graphHealth(): Promise<GraphHealth> {
  const res = await fetch(`${BASE}/api/graph/stats`);
  if (!res.ok) throw new Error(`graph stats ${res.status}`);
  const d = (await res.json()) as { nodes: number; edges: number };
  return { ok: true, nodes: d.nodes, edges: d.edges };
}

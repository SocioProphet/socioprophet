// Canonical knowledge-graph client — hellgraph-service, the shared HTTP HellGraph engine
// (prophet-platform/apps/hellgraph-service). This is the ONE backend the cockpit's Knowledge
// Graph and the Prophet Studio Graph Explorer both read, so the graph is unified across surfaces.
//
// Base is the same-origin `/svc/hellgraph` proxy (see vite.config.ts) → :8090 in dev.
// Endpoints mirror the agent-machine surface contract, so SurfaceResult/GraphHealth are reused.
import type { SurfaceResult, GraphHealth } from './agentMachineApi';
import { resolveBase } from '../config/cockpitRuntime';

const BASE = resolveBase('hellgraph', 'VITE_HELLGRAPH_BASE', '/svc/hellgraph');

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

// ── Org federation (the super-peer hosted by hellgraph-service; opt-in) ──────────────────
// status is open; ADMIT is operator-side (HMAC-minted token with the 'admit' scope). The
// cockpit's job is visibility: is federation on, what's the base key users join by, and
// how much of the org graph the federation index carries.
export interface FederationState {
  enabled: boolean;
  authEnforced?: boolean;
  baseKey?: string;
  writerKey?: string;
  health?: { nodes: number; edges: number; writers: number; cut: Record<string, number> };
  degraded?: string;
}

export async function federationState(): Promise<FederationState> {
  const res = await fetch(`${BASE}/api/federation/status`);
  if (!res.ok) throw new Error(`federation status ${res.status}`);
  return (await res.json()) as FederationState;
}

// ── GraphRAG ask (provenance-cited NLQA over the live graph) ─────────────────────────────
// Fronts hellgraph-service POST /api/graph/ask: retrieves grounding (hybrid HNSW+BM25, or
// lexical fallback) over whatever is actually in the graph, then synthesizes a cited answer
// ONLY when a sovereign LLM is configured server-side (GRAPHRAG_LLM_URL) — fail-open to the
// extractive citations otherwise. `grounded: false` means the graph held nothing relevant;
// the client must show that honestly, never invent an answer.
export interface GraphAskCitation {
  n: number;
  fact: string;
  subject: string;
  predicate: string;
  object: string;
  isIri: boolean;
  assertedAt: string;
}

export interface GraphAskResult {
  question: string;
  answer: string;
  citations: GraphAskCitation[];
  synthesized: boolean;
  grounded: boolean;
  synthesisEnabled?: boolean;
}

export async function askGraph(question: string): Promise<GraphAskResult> {
  const res = await fetch(`${BASE}/api/graph/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`graph ask ${res.status}`);
  return (await res.json()) as GraphAskResult;
}

export type GraphAskMode = 'live' | 'unreachable';

export interface GraphAskLoadResult {
  result: GraphAskResult | null;
  mode: GraphAskMode;
  error?: string;
}

/**
 * Live-first, fail-closed-to-error-state (never fail-open-to-a-fabricated-answer): a
 * network/proxy failure yields mode 'unreachable' with no result — the caller shows a
 * clear "live graph unreachable" state rather than pretending to have answered. A
 * successful call with `grounded: false` is NOT an error — it means the live graph
 * answered honestly that it has nothing relevant yet.
 */
export async function askGraphWithFallback(question: string): Promise<GraphAskLoadResult> {
  try {
    const result = await askGraph(question);
    return { result, mode: 'live' };
  } catch (error) {
    return { result: null, mode: 'unreachable', error: error instanceof Error ? error.message : String(error) };
  }
}

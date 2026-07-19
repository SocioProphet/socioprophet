/**
 * api.ts — the Prophet Studio client for the platform's real services.
 *
 * Every call goes to a same-origin `/svc/<service>/…` path that nginx (prod) or the Vite dev server proxies
 * to the in-cluster service — so no CORS, no hard-coded hosts. Each service base is overridable at runtime
 * via window.__PROPHET_API__ for bespoke ingress topologies. Errors are surfaced, never swallowed.
 */
type ApiMap = { hellgraph: string; reason: string; er: string; studio: string }
const DEFAULTS: ApiMap = { hellgraph: '/svc/hellgraph', reason: '/svc/reason', er: '/svc/er', studio: '/svc/studio' }
const CFG: ApiMap = { ...DEFAULTS, ...((globalThis as any).__PROPHET_API__ ?? {}) }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function call<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + path, {
    ...init,
    headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...(init?.headers ?? {}) },
  })
  const text = await res.text()
  let body: any = text
  try { body = text ? JSON.parse(text) : null } catch { /* keep raw text (e.g. turtle/html) */ }
  if (!res.ok) throw new ApiError(res.status, (body && body.error) || text || `HTTP ${res.status}`)
  return body as T
}

// ── hellgraph-service ────────────────────────────────────────────────────────────
export const graph = {
  stats: () => call<{ nodes: number; edges: number }>(CFG.hellgraph, '/api/graph/stats'),
  subgraph: (label = '', limit = 400) =>
    call<{ count: number; edges: number; nodes: any[]; edgeList: any[] }>(CFG.hellgraph, `/api/graph/subgraph?label=${encodeURIComponent(label)}&limit=${limit}`),
  addNode: (id: string, labels: string[], properties: Record<string, unknown> = {}) =>
    call(CFG.hellgraph, '/api/graph/node', { method: 'POST', body: JSON.stringify({ id, labels, properties }) }),
  addEdge: (label: string, from: string, to: string, properties: Record<string, unknown> = {}) =>
    call(CFG.hellgraph, '/api/graph/edge', { method: 'POST', body: JSON.stringify({ label, from, to, properties }) }),
  sparql: (query: string) => call<any>(CFG.hellgraph, '/api/graph/sparql', { method: 'POST', body: JSON.stringify({ query }) }),
  cypher: (query: string) => call<any>(CFG.hellgraph, '/api/graph/cypher', { method: 'POST', body: JSON.stringify({ query }) }),
  gremlin: (query: string) => call<any>(CFG.hellgraph, '/api/graph/gremlin', { method: 'POST', body: JSON.stringify({ query }) }),
  analytics: (metric: 'pagerank' | 'components', limit = 25) =>
    call<any>(CFG.hellgraph, `/api/graph/analytics?metric=${metric}&limit=${limit}`),
  resource: (uri: string) => call<any>(CFG.hellgraph, `/api/graph/resource?uri=${encodeURIComponent(uri)}`),
  ground: (q: string, hops = 1) => call<any>(CFG.hellgraph, `/api/graph/ground?q=${encodeURIComponent(q)}&hops=${hops}`),
  ask: (question: string) => call<any>(CFG.hellgraph, '/api/graph/ask', { method: 'POST', body: JSON.stringify({ question }) }),
}

// ── owl-reasoner ─────────────────────────────────────────────────────────────────
export const reasoner = {
  reason: (turtle: string, inference = 'rdfs', explain = true, shapes?: string) =>
    call<any>(CFG.reason, '/reason', { method: 'POST', body: JSON.stringify({ turtle, inference, explain, shapes }) }),
  ontologyDoc: (turtle: string) => call<any>(CFG.reason, '/ontology/doc', { method: 'POST', body: JSON.stringify({ turtle, format: 'json' }) }),
  ontologyGraph: (turtle: string) => call<any>(CFG.reason, '/ontology/graph', { method: 'POST', body: JSON.stringify({ turtle }) }),
  virtualize: (rows: any[], mapping: any) => call<any>(CFG.reason, '/virtualize', { method: 'POST', body: JSON.stringify({ rows, mapping }) }),
}

// ── entity-resolution ────────────────────────────────────────────────────────────
export const er = {
  resolve: (records: any[]) => call<any>(CFG.er, '/resolve', { method: 'POST', body: JSON.stringify({ records }) }),
}

export interface Health { name: string; ok: boolean; detail?: string }
export async function health(): Promise<Health[]> {
  const probes: [string, string, string][] = [
    ['hellgraph', CFG.hellgraph, '/healthz'],
    ['owl-reasoner', CFG.reason, '/healthz'],
    ['entity-resolution', CFG.er, '/healthz'],
    ['lattice-studio', CFG.studio, '/healthz'],
  ]
  return Promise.all(probes.map(async ([name, base, p]) => {
    try { await call(base, p); return { name, ok: true } } catch (e: any) { return { name, ok: false, detail: e?.message } }
  }))
}

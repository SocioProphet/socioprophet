// searchApi — the socioprophet.ai agentic-search client. Calls the public search-gateway (prophet-platform
// apps/search-gateway), which fans one query out to SearXNG (web) + commons-search (the sovereign commons) and
// returns a blended, cited result set. VITE_SEARCH_API unset → STUB mode (no network) so the surface renders
// standalone/local-first until the gateway host is wired. Read-only: this client never writes.

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_SEARCH_API;

export type Source = "web" | "commons";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: Source;
  engine: string;
  publishedDate?: string;
}

export interface BlendedResults {
  query: string;
  results: SearchResult[];
  counts: { web: number; commons: number };
  degraded?: { web?: string; commons?: string };
  stub?: boolean;
}

const STUB: SearchResult[] = [
  { title: "How our sovereign commons works", url: "noetica://open-chat/demo/1", snippet: "An opt-in, redacted community chat — searchable by any agent. This is a stub result; wire VITE_SEARCH_API to go live.", source: "commons", engine: "noetica-commons" },
  { title: "Fibered Retrieval (GraphRAG) — overview", url: "https://socioprophet.ai/docs/fibered-retrieval", snippet: "Hybrid dense+sparse retrieval blended with graph traversal over HellGraph. The v1 engine slots in here.", source: "web", engine: "stub" },
];

export async function search(query: string): Promise<BlendedResults> {
  const q = query.trim();
  if (!q) return { query: "", results: [], counts: { web: 0, commons: 0 } };
  if (!BASE) {
    // stub: local-first render until the gateway host is set
    const results = STUB.filter((r) => `${r.title} ${r.snippet}`.toLowerCase().includes(q.toLowerCase())).length
      ? STUB.filter((r) => `${r.title} ${r.snippet}`.toLowerCase().includes(q.toLowerCase()))
      : STUB;
    return { query: q, results, counts: { web: 1, commons: 1 }, stub: true };
  }
  const res = await fetch(`${BASE.replace(/\/$/, "")}/search?q=${encodeURIComponent(q)}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return (await res.json()) as BlendedResults;
}

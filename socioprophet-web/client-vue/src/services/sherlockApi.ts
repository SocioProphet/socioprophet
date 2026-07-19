// Sherlock — sovereign Discovery search (sherlock-engine, Tantivy/Rust, no JVM). Same-origin
// `/svc/sherlock` proxy → :8093 in dev. Ontology-driven full-text with BM25 + highlighted snippets;
// results can be verified against HellGraph evidence via Holmes (see ieApi.verifyClaims).
const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_SHERLOCK_BASE ?? '/svc/sherlock';

export interface Hit { id: string; title: string; doctype: string; category: string; region: string; score: number; bm25: number; snippet: string }
export interface SearchResult { query: string; engine: string; total: number; hits: Hit[]; error?: string }
export interface Facets { doctype: Record<string, number>; category: Record<string, number>; region: Record<string, number> }

export async function search(q: string, limit = 10): Promise<SearchResult> {
  const r = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!r.ok) throw new Error(`search ${r.status}`);
  return r.json();
}
export async function facets(): Promise<Facets> {
  const r = await fetch(`${BASE}/facets`);
  if (!r.ok) throw new Error(`facets ${r.status}`);
  return r.json();
}

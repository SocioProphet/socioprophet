// knowledgeApi — persists the knowledge projection to HellGraph. The server seals block content under the user's
// root (sovereign-vault) and stores structure for GDS (knowledge-persist.ts). VITE_KNOWLEDGE_API unset → STUB mode
// (no network) so the editor runs standalone/local-first until the backend route is wired.
import type { KGraph } from "./knowledgeGraph";

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_KNOWLEDGE_API;

export interface PersistResult { nodes: number; edges: number; sealed: boolean }

export async function persist(graph: KGraph): Promise<PersistResult> {
  if (!BASE) return { nodes: graph.nodes.length, edges: graph.edges.length, sealed: false }; // stub: local-first
  const res = await fetch(`${BASE}/persist`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(graph),
  });
  if (!res.ok) throw new Error(`persist failed: ${res.status}`);
  return (await res.json()) as PersistResult;
}

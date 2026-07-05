// agentMachineApi — thin client to the local Noetica Agent Machine (sovereign, on-device).
// Reuses the agent-machine /api/* endpoints unchanged; base is VITE_AGENT_MACHINE (default :8080 in dev).
// These are local sovereign endpoints (no auth) — distinct from the authed /api/builds platform backend.
const AM = (import.meta as { env?: Record<string, string> }).env?.VITE_AGENT_MACHINE ?? 'http://127.0.0.1:8080';

export const AM_BASE = AM; // exported for SSE streaming endpoints (terminal/run, forge/import-local)

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${AM}${path}`);
  if (!res.ok) throw new Error(`agent-machine ${res.status}`);
  return (await res.json()) as T;
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AM}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`agent-machine ${res.status}`);
  return (await res.json()) as T;
}

// ---- Workstation → Pipelines (local GitOps) ----
export interface ArgoApp { name: string; namespace: string; sync: string; health: string }
export interface PipelineStatus {
  gitops: { kubectl: boolean; argocd: boolean };
  ci: { gh: boolean };
  apps: ArgoApp[];
  note?: string;
}
export const pipelineStatus = () => get<PipelineStatus>('/api/pipelines/status');

// ---- Workstation → Deploy (control plane) ----
export interface DeployStatus {
  continuumPath: string; hasRepo: boolean;
  runtime: { kind: boolean; podman: boolean; docker: boolean; go: boolean; kubectl: boolean; make: boolean };
  clusterUp: boolean; clusters: string[]; ready: boolean; notes: string[];
}
export const deployStatus = () => get<DeployStatus>('/api/deploy/status');

// ---- Workstation → Services (DevSpaces, Nocalhost model) ----
export interface DevSpace { name: string; trustNamespace: string; kubeNamespace: string; spaceType: 'base' | 'mesh'; status: string; devMode: string[] }
export const devSpaces = () => get<{ hasCluster: boolean; nhctl: boolean; spaces: DevSpace[]; note?: string }>('/api/devspace/list');

// ---- Workstation → Terminal (operator CLIs) ----
export interface TerminalStatus { tools: Record<'prophet' | 'sourceosctl', { bin: string; installed: boolean; subcommands: string[] }> }
export const terminalStatus = () => get<TerminalStatus>('/api/terminal/status');

// ---- Data → Search (local lampstand vs platform sherlock) ----
export interface SearchHit { source: 'local' | 'platform'; title: string; ref: string; snippet: string; score: number }
export interface SourceResult { ok: boolean; configured: boolean; hits: SearchHit[]; error?: string }
export interface SearchResult { query: string; local: SourceResult; platform: SourceResult }
export const search = (query: string, scope: 'all' | 'local' | 'platform') => post<SearchResult>('/api/search', { query, scope });

// ---- AI·Models → Labs (Apple-aligned catalog) ----
export interface ModelEntry { id: string; kind: 'base' | 'adapter'; modality?: string; lab?: string; tier: 'on-device' | 'edge' | 'server'; paramsB: number; quantization?: string; residencyState: string; cacheTier: string; carryPolicy: string; provider: string }
export const labsCatalog = () => get<{ models: ModelEntry[]; note: string }>('/api/labs/catalog');

// ---- Knowledge → Graph (HellGraph force-surface) ----
export interface SurfaceNode { id: string; label: string; category: string; kind: string; kvClass: string; featured: boolean; degree: number }
export interface SurfaceLink { source: string; target: string; primary: boolean; epistemic: string; dimension: string }
export interface SurfaceResult { nodes: SurfaceNode[]; links: SurfaceLink[]; total: { nodes: number; edges: number }; error?: string }
export const graphSurface = (view = 'all', limit = 34, root = '') =>
  get<SurfaceResult>(`/api/graph/surface?view=${encodeURIComponent(view)}&limit=${limit}${root ? `&root=${encodeURIComponent(root)}` : ''}`);
export interface GraphHealth { ok: boolean; nodes?: number; edges?: number; walPath?: string; vectorIndex?: string; error?: string }
// The endpoint returns { graph: { status, nodeCount, edgeCount, walPath, vectorIndexStatus }, time: {...} };
// normalize it to the flat shape the UI reads.
export async function graphHealth(): Promise<GraphHealth> {
  const raw = await get<{ graph?: { status?: string; nodeCount?: number; edgeCount?: number; walPath?: string; vectorIndexStatus?: string }; error?: string }>('/api/graph/health');
  const g = raw.graph;
  return { ok: g?.status === 'ok', nodes: g?.nodeCount, edges: g?.edgeCount, walPath: g?.walPath, vectorIndex: g?.vectorIndexStatus, error: raw.error };
}

// ---- Forge → Local git import (folder picker + SSE push into sovereign Gitea) ----
export interface BrowseEntry { name: string; path: string; isGitRepo: boolean }
export interface BrowseResult { path: string; parent: string | null; entries: BrowseEntry[] }
export const forgeBrowse = (dir?: string) => post<BrowseResult>('/api/forge/browse', { dir });

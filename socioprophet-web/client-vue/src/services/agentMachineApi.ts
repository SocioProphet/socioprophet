// agentMachineApi — thin client to the local Noetica Agent Machine (sovereign, on-device).
// Reuses the agent-machine /api/* endpoints unchanged; base is VITE_AGENT_MACHINE (default :8080 in dev).
// These are local sovereign endpoints (no auth) — distinct from the authed /api/builds platform backend.
import { resolveBase } from '../config/cockpitRuntime';
const AM = resolveBase('agentMachine', 'VITE_AGENT_MACHINE', 'http://127.0.0.1:8080');

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

// ---- Governance → the sovereign agent-machine control plane (real, on-device) ----
// These back the Organization Control Plane's "Connect to Agent Machine" mode: the
// enforced autonomy ladder, the capability membrane (containment purpose), governance
// posture (kill-switch + authority hierarchy), and the real reasoning-run audit trail.
export interface GovPosture {
  killSwitchArmed: boolean; killSwitchReason: string | null; scopedConfigured: boolean;
  policyId: string | null; policyName: string | null;
  authorityHierarchy: Array<{ level: string; label: string; description: string; active: boolean }>;
  escalationActionClasses: string[]; escalationNote?: string;
}
export interface AutonomyRung { level: string; rank: number; label: string; roles: string[]; gate: string; evidenceRequired: string; enforcedAt: string }
export interface AutonomyState { session: { role: string; authorizedLevel: string; evidence: string[] }; enforced: boolean; ladder: AutonomyRung[] }
export interface Containment { killed: boolean; reason: string | null; since: string | null; purpose: string; purpose_allows: string[]; purposes: Array<{ name: string; allow: string[]; note: string }> }
export interface GovRun {
  run_id: string; model_routed: string; provider: string; policy_admitted: boolean; memory_written: boolean;
  timestamp: string; latency_ms: number; input_tokens: number; output_tokens: number; cost_usd: number; tokens_egressed: number; task: string; session_id: string; error?: string;
}
export const govPosture = () => get<GovPosture>('/api/governance/posture');
export const autonomyState = () => get<AutonomyState>('/api/autonomy');
export const containment = () => get<Containment>('/api/containment');
export const govRecent = () => get<{ runs: GovRun[] }>('/api/governance/recent');

// Real governance WRITE: POST /api/containment {action:'kill'|'disarm'|'bind', reason?, purpose?}.
// Arms/disarms the kill-switch or binds the capability purpose (read-only|research|build|full)
// on the live agent-machine — the console actually halts / narrows the sovereign agent.
export type ContainmentAction = { action: 'kill'; reason?: string } | { action: 'disarm' } | { action: 'bind'; purpose: string };
export const postContainment = (body: ContainmentAction) => post<Containment>('/api/containment', body);

// Real autonomy WRITE: POST /api/autonomy {action:'bind', role, level, evidence[]} | {action:'clear'}.
// Binds this session's authorized autonomy level on the live agent-machine (enforced).
export const bindAutonomy = (role: string, level: string, evidence: string[]) => post<AutonomyState>('/api/autonomy', { action: 'bind', role, level, evidence });
export const clearAutonomy = () => post<AutonomyState>('/api/autonomy', { action: 'clear' });

// Human decision writeback: POST /api/governance/decision {run_id, decision, reason?, actor?}.
// Records an operator Admit/Reject/Hold on a machine run into the persisted governance log.
// (Endpoint added to the agent-machine on the feat/governance-decision-endpoint branch; the
// call fails closed if the running machine predates it, so the console degrades gracefully.)
export type GovDecision = 'admitted' | 'rejected' | 'held-for-review';
export interface GovDecisionRecord { decision_id: string; run_id: string; decision: GovDecision; reason?: string; actor: string; timestamp: string; receipt: string }
export const postGovernanceDecision = (run_id: string, decision: GovDecision, reason?: string, actor = 'operator') =>
  post<GovDecisionRecord>('/api/governance/decision', { run_id, decision, reason, actor });
export const govDecisions = () => get<{ decisions: GovDecisionRecord[] }>('/api/governance/decisions');

// Real scoped-egress WRITE: POST /api/governance/policy writes the SCOPE-D EngagementPolicy
// that governs which cloud targets the agent may egress to (shape mirrors lib/scope-d.ts).
// The machine 400s unless SCOPED_ENGAGEMENT_POLICY points to a writable path.
export interface EngagementPolicy {
  policyId: string; name: string;
  targetBoundary?: { authorizedTargets?: string[]; outOfScopeTargets?: string[] };
  authorizedTargets?: string[]; authorizedModes?: string[];
  approvalRules?: Array<{ actionClass: string; requiredGate: string }>;
  blockedActions?: string[]; expiresAt?: string;
}
export const postGovernancePolicy = (policy: EngagementPolicy) => post<{ saved: boolean; policyId: string }>('/api/governance/policy', policy);

// ---- Forge → Local git import (folder picker + SSE push into sovereign Gitea) ----
export interface BrowseEntry { name: string; path: string; isGitRepo: boolean }
export interface BrowseResult { path: string; parent: string | null; entries: BrowseEntry[] }
export const forgeBrowse = (dir?: string) => post<BrowseResult>('/api/forge/browse', { dir });

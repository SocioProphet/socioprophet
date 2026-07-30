// Governance test / provenance API (ST012 → ST013c).
// Fronts dashboard-bff GET /v1/governance/test — the reusable, deterministic trust-kernel gate
// that returns a hash-sealed AutonomyAdmissionReceipt + a step-by-step gate trace. Same env base
// as the other clients; falls back gracefully.

const API_BASE = (import.meta as any).env?.VITE_DASHBOARD_BFF_BASE || (import.meta as any).env?.VITE_MESH_BASE || '/api';

export interface GateStep { gate: string; pass: boolean; detail?: string }
export interface AdmissionReceipt {
  version: string; receipt_id: string; created_at: string; service_ref: string;
  role: string; requested_level: string; granted_level: string; role_ceiling: string;
  decision: 'admit' | 'demote' | 'deny'; gate: string; evidence_required: string;
  evidence_refs: string[]; reason: string; trust_kernel_gate_order: string[];
  subject_ref: string; policy_refs: string[]; hash: string; hash_algo: string;
}
export interface GovernanceTest {
  receipt: AdmissionReceipt; gate_trace: GateStep[]; dataset: string; reusable: string;
}
export interface GovParams {
  dataset?: string; action_class?: string; role?: string; requested_level?: string; evidence?: string;
}

export async function runGovernanceTest(p: GovParams): Promise<{ data: GovernanceTest | null; error?: string }> {
  const q = new URLSearchParams();
  // Only skip when a field is genuinely absent (undefined / null). Clearing "Evidence"
  // to '' is a MEANINGFUL operator action — re-running the governance test with NO
  // evidence — and if we drop the empty string here, `dashboard-bff` falls back to its
  // default and the UI displays a receipt that does not match what the operator actually
  // asked. Empty string is presence, not absence.
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.set(k, String(v));
  });
  try {
    const res = await fetch(`${API_BASE}/v1/governance/test?${q.toString()}`, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return { data: await res.json() };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

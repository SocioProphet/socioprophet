// Causal valuation + location-twin API client (GYG use case).
//
// Fronts the prophet-platform dashboard-bff routes:
//   GET  /v1/valuation/causal            — hellgraph supply-chain causal graph joined with the
//                                           economic-prophet value-driver-tree valuation.
//   POST /v1/valuation/causal/recompute  — what-if: re-runs the CANONICAL economic-prophet engine
//                                           on assumption / horizon / discount overrides.
//   GET  /v1/locations                   — restaurant sample with MODELED per-site foot-traffic/sales.
//
// The value math lives in economic-prophet; this client only fetches and normalises. Mirrors
// vdtApi.ts: an env-configured base + a getJson wrapper + graceful fallback so the surface labels
// live vs unavailable rather than blanking.

// Dashboard-bff (data). Dev uses the Vite proxy ('/api'); set VITE_DASHBOARD_BFF_BASE
// to a hosted bff. (The Prophet Mesh is the model gateway, a separate endpoint — see config/mesh.ts.)
const API_BASE = (import.meta as any).env?.VITE_DASHBOARD_BFF_BASE || '/api';

export type LoadMode = 'live' | 'unavailable';

export interface GraphNode { id: string; labels: string[]; properties: Record<string, any> }
export interface GraphEdge { label: string; from: string; to: string; properties: Record<string, any> }

export interface CausalValuation {
  company: string;
  subject: string;
  recomputed: boolean;
  valuation: { currency: string; ev_baseline: number; projected_ev: number; value_uplift: number; uplift_fraction: number };
  timeseries: {
    horizon_years: number;
    discount_rate: number;
    periods: Array<{ year: number; projected_enterprise_value: number; total_value_uplift: number; value_uplift_fraction: number; incremental_value_uplift: number }>;
    terminal_projected_enterprise_value: number;
    terminal_total_value_uplift: number;
    present_value_of_uplift: number;
  };
  assumptions_editable: Array<{ kpi: string; driver: string; domain: string; delta_pct: number; polarity: string }>;
  causal_graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  vdt: {
    scenario: string; industry: string;
    per_driver_uplift: Record<string, number>;
    per_kpi_contribution: Array<{ kpi: string; driver: string; domain: string; delta_pct: number; polarity: string; value_contribution: number }>;
    epistemic_status: Record<string, any>;
    assumptions: string[]; limitations: string[]; evidence_refs: string[];
  };
  provenance: Record<string, any>;
  headline: string;
}

export interface GygLocation {
  id: string; suburb: string; state: string; lat: number; lng: number;
  format: string; ownership: string; metro_tier: number; catchment_profile: string;
  est_annual_sales_aud: number; modeled_weekly_footfall: number; basis: string;
}

export interface LocationsPayload {
  subject: string;
  locations: GygLocation[];
  sample_size: number;
  network_totals: { total_au_restaurants: number; drive_thru: number; strip: number; other: number; as_of: string };
  org_twin: {
    sample_modeled_annual_sales_aud: number;
    sample_modeled_weekly_footfall: number;
    by_state: Record<string, number>;
    by_format: Record<string, number>;
    network_extrapolation_note: string;
  };
}

export interface CausalOverrides {
  ev_baseline?: number;
  horizon_years?: number;
  discount_rate?: number;
  kpi_overrides?: Record<string, number>;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchCausalValuation(company = 'gyg'): Promise<{ data: CausalValuation | null; mode: LoadMode; error?: string }> {
  try {
    return { data: await getJson<CausalValuation>(`/v1/valuation/causal?company=${encodeURIComponent(company)}`), mode: 'live' };
  } catch (err) {
    return { data: null, mode: 'unavailable', error: err instanceof Error ? err.message : String(err) };
  }
}

export async function recomputeCausalValuation(overrides: CausalOverrides, company = 'gyg'): Promise<CausalValuation> {
  return postJson<CausalValuation>(`/v1/valuation/causal/recompute?company=${encodeURIComponent(company)}`, overrides);
}

// ── Value Driver Studio — causal valuation for ANY company (listed via ticker, or private) ──
export interface StudioParams {
  ticker?: string; template?: string; ev_baseline?: number; name?: string;
  horizon_years?: number; discount_rate?: number;
}

export async function fetchStudioTemplates(): Promise<Array<{ id: string; industry: string }>> {
  try { return (await getJson<{ templates: Array<{ id: string; industry: string }> }>('/v1/valuation/studio/templates')).templates; }
  catch { return []; }
}

export async function fetchStudioValuation(p: StudioParams): Promise<CausalValuation> {
  const q = new URLSearchParams();
  if (p.ticker) q.set('ticker', p.ticker);
  if (p.template) q.set('template', p.template);
  if (p.ev_baseline) q.set('ev_baseline', String(p.ev_baseline));
  if (p.name) q.set('name', p.name);
  if (p.horizon_years) q.set('horizon_years', String(p.horizon_years));
  if (p.discount_rate != null) q.set('discount_rate', String(p.discount_rate));
  return getJson<CausalValuation>(`/v1/valuation/studio?${q.toString()}`);
}

export async function recomputeStudioValuation(overrides: StudioParams & { kpi_overrides?: Record<string, number> }): Promise<CausalValuation> {
  return postJson<CausalValuation>('/v1/valuation/studio/recompute', overrides);
}

export async function fetchLocations(company = 'gyg', q = '', state = ''): Promise<{ data: LocationsPayload | null; mode: LoadMode; error?: string }> {
  const params = new URLSearchParams({ company, q, state });
  try {
    return { data: await getJson<LocationsPayload>(`/v1/locations?${params.toString()}`), mode: 'live' };
  } catch (err) {
    return { data: null, mode: 'unavailable', error: err instanceof Error ? err.message : String(err) };
  }
}

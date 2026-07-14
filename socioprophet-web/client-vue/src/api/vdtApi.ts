// Value Driver Tree API client.
//
// Fronts the prophet-platform dashboard-bff route GET /v1/vdt (apps/dashboard-bff/main.py),
// which serves the canonical economic-prophet engine's OUTPUT — the driver×domain attribution
// tensor plus the engine-computed per-KPI / per-driver uplifts, provenance + input_hash intact.
// The value math (EP/UVMC/VDT identities) is NOT in the frontend; it lives in economic-prophet.
//
// Mirrors intelligenceSuperiorityApi.ts / personGraphApi.ts: an env-configured base, a getJson
// wrapper, and a *WithFallback variant that returns the local fixture (data/vdtFixture.ts — the
// SAME engine math, computed client-side) when the backend is absent, so the surface still renders
// in fixture mode rather than blanking.

import {
  industry as fxIndustry,
  enterpriseValueBaseline,
  drivers as fxDrivers,
  domains as fxDomains,
  weights as fxWeights,
  computeVdt,
  type Polarity,
} from '../data/vdtFixture';

// Dashboard-bff (data). Dev uses the Vite proxy ('/api'); set VITE_DASHBOARD_BFF_BASE
// to a hosted bff. (The Prophet Mesh is the model gateway, a separate endpoint — see config/mesh.ts.)
const API_BASE = (import.meta as any).env?.VITE_DASHBOARD_BFF_BASE || '/api';

export interface VdtWeightCell {
  driver: string;
  domain: string;
  weight: number;
}

export interface VdtKpiView {
  kpi: string;
  driver: string;
  domain: string;
  deltaPct: number;
  polarity: Polarity;
  contribution: number;
}

/** Normalized (camelCase) view the surface renders — from live BFF or the fixture. */
export interface VdtView {
  industry: string;
  evBaseline: number;
  drivers: string[];
  domains: string[];
  weights: VdtWeightCell[];
  perKpi: VdtKpiView[];
  perDriver: Record<string, number>;
  perDomain: Record<string, number>;
  totalUplift: number;
  upliftFraction: number;
  projectedEnterpriseValue: number;
  provenance: Record<string, unknown>;
  epistemicStatus: Record<string, unknown>;
}

// Server response (snake_case) — matches dashboard-bff contracts.VdtResponse.
interface VdtResponse {
  service: string;
  industry: string;
  scenario: string;
  enterprise_value_baseline: number;
  drivers: string[];
  domains: string[];
  weights: { driver: string; domain: string; weight: number }[];
  per_kpi_contribution: {
    kpi: string; driver: string; domain: string;
    delta_pct: number; polarity: Polarity; value_contribution: number;
  }[];
  per_driver_uplift: Record<string, number>;
  per_domain_uplift: Record<string, number>;
  computed_total_value_uplift: number;
  computed_value_uplift_fraction: number;
  projected_enterprise_value: number;
  epistemic_status: Record<string, unknown>;
  provenance: Record<string, unknown>;
  headline: string;
}

export type VdtMode = 'live' | 'fixture';

export interface VdtLoadResult {
  view: VdtView;
  mode: VdtMode;
  error?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

function fromResponse(d: VdtResponse): VdtView {
  return {
    industry: d.industry,
    evBaseline: d.enterprise_value_baseline,
    drivers: d.drivers,
    domains: d.domains,
    weights: d.weights,
    perKpi: d.per_kpi_contribution.map((k) => ({
      kpi: k.kpi,
      driver: k.driver,
      domain: k.domain,
      deltaPct: k.delta_pct,
      polarity: k.polarity,
      contribution: k.value_contribution,
    })),
    perDriver: d.per_driver_uplift,
    perDomain: d.per_domain_uplift,
    totalUplift: d.computed_total_value_uplift,
    upliftFraction: d.computed_value_uplift_fraction,
    projectedEnterpriseValue: d.projected_enterprise_value,
    provenance: d.provenance ?? {},
    epistemicStatus: d.epistemic_status ?? {},
  };
}

/** Deterministic fixture view — the SAME canonical engine math computed locally, so the surface
 *  renders identically to the live path when dashboard-bff is not running. */
export function fixtureView(): VdtView {
  const c = computeVdt();
  return {
    industry: fxIndustry,
    evBaseline: enterpriseValueBaseline,
    drivers: [...fxDrivers],
    domains: [...fxDomains],
    weights: fxWeights,
    perKpi: c.perKpi.map((k) => ({
      kpi: k.kpi, driver: k.driver, domain: k.domain,
      deltaPct: k.deltaPct, polarity: k.polarity, contribution: k.contribution,
    })),
    perDriver: c.perDriver,
    perDomain: c.perDomain,
    totalUplift: c.totalUplift,
    upliftFraction: c.upliftFraction,
    projectedEnterpriseValue: c.projectedEnterpriseValue,
    provenance: {
      source: 'client fixture (data/vdtFixture.ts)',
      note: 'canonical economic-prophet VDT math, computed locally',
    },
    epistemicStatus: { level: 'synthetic', review_status: 'machine_checked' },
  };
}

export async function fetchVdtWithFallback(industry = 'software'): Promise<VdtLoadResult> {
  try {
    const d = await getJson<VdtResponse>(`/v1/vdt?industry=${encodeURIComponent(industry)}`);
    return { view: fromResponse(d), mode: 'live' };
  } catch (err) {
    // Fixture only carries the Software tensor; a live backend is needed for other industries.
    return { view: fixtureView(), mode: 'fixture', error: err instanceof Error ? err.message : String(err) };
  }
}

export interface VdtIndustry {
  id: string;
  label: string;
  industry: string;
}

interface VdtCatalogResponse {
  service: string;
  industries: VdtIndustry[];
}

// The industry selector's options. Live from /v1/vdt/catalog; offline it degrades to the one
// industry the client fixture can actually compute (Software).
const FIXTURE_CATALOG: VdtIndustry[] = [
  { id: 'software', label: 'Software & Platforms', industry: fxIndustry },
];

export async function fetchVdtCatalogWithFallback(): Promise<{ industries: VdtIndustry[]; mode: VdtMode }> {
  try {
    const d = await getJson<VdtCatalogResponse>('/v1/vdt/catalog');
    return { industries: d.industries, mode: 'live' };
  } catch {
    return { industries: FIXTURE_CATALOG, mode: 'fixture' };
  }
}

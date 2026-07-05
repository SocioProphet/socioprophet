import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchVdtWithFallback, fetchVdtCatalogWithFallback, fixtureView } from '../api/vdtApi';
import { computeVdt } from '../data/vdtFixture';

const LIVE_RESPONSE = {
  service: 'dashboard-bff',
  industry: 'GICS45_SoftwarePlatforms',
  scenario: 'baseline',
  enterprise_value_baseline: 1_000_000_000,
  drivers: ['RevenueGrowth', 'CostEfficiency', 'Experience', 'KnowledgeProductivity', 'TrustComplianceResilience', 'Innovation'],
  domains: ['CustomerInterface', 'ProductServiceDev', 'SupplyDelivery', 'OperationsSupport', 'RiskSecurity', 'GovernanceKnowledge'],
  weights: [{ driver: 'RevenueGrowth', domain: 'CustomerInterface', weight: 0.096774 }],
  per_kpi_contribution: [
    { kpi: 'arr_growth_pct', driver: 'RevenueGrowth', domain: 'CustomerInterface', delta_pct: 10.0, polarity: 'higher_better', value_contribution: 9677419.35 },
  ],
  per_driver_uplift: { RevenueGrowth: 9677419.35 },
  per_domain_uplift: { CustomerInterface: 9677419.35 },
  computed_total_value_uplift: 10201612.9,
  computed_value_uplift_fraction: 0.0102,
  projected_enterprise_value: 1010201612.9,
  epistemic_status: { level: 'synthetic', review_status: 'machine_checked' },
  provenance: { source_repo: 'SocioProphet/economic-prophet', input_hash: 'hash://synthetic/input-vdt-software-001' },
  headline: 'GICS45_SoftwarePlatforms: ... machine-checked measurement ...',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('vdtApi', () => {
  it('fixtureView reproduces the canonical engine math (computeVdt)', () => {
    const c = computeVdt();
    const v = fixtureView();
    expect(v.totalUplift).toBe(c.totalUplift);
    expect(v.projectedEnterpriseValue).toBe(c.projectedEnterpriseValue);
    expect(v.perKpi.length).toBe(c.perKpi.length);
    expect(v.weights.length).toBe(36);
  });

  it('maps a live /v1/vdt response (snake_case → camelCase) and reports live mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => LIVE_RESPONSE,
    } as Response));

    const res = await fetchVdtWithFallback();
    expect(res.mode).toBe('live');
    expect(res.view.industry).toBe('GICS45_SoftwarePlatforms');
    expect(res.view.perKpi[0]).toMatchObject({ kpi: 'arr_growth_pct', deltaPct: 10.0, contribution: 9677419.35 });
    expect(res.view.totalUplift).toBe(10201612.9);
  });

  it('falls back to the fixture (and reports the error) when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));

    const res = await fetchVdtWithFallback();
    expect(res.mode).toBe('fixture');
    expect(res.error).toContain('connection refused');
    expect(res.view.weights.length).toBe(36);
  });

  it('requests the selected industry via the query param', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => LIVE_RESPONSE } as Response);
    vi.stubGlobal('fetch', fetchMock);
    await fetchVdtWithFallback('banks');
    expect(fetchMock.mock.calls[0]![0]).toContain('/v1/vdt?industry=banks');
  });

  it('loads the industry catalog live, and degrades to Software-only offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ service: 'dashboard-bff', industries: [
        { id: 'software', label: 'Software & Platforms', industry: 'GICS45_SoftwarePlatforms' },
        { id: 'banks', label: 'Banks & Financials', industry: 'GICS40_BanksDiversifiedFinancials' },
        { id: 'energy', label: 'Energy', industry: 'GICS10_Energy' },
      ] }),
    } as Response));
    const live = await fetchVdtCatalogWithFallback();
    expect(live.mode).toBe('live');
    expect(live.industries.map((i) => i.id)).toEqual(['software', 'banks', 'energy']);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const off = await fetchVdtCatalogWithFallback();
    expect(off.mode).toBe('fixture');
    expect(off.industries).toHaveLength(1);
    expect(off.industries[0]!.id).toBe('software');
  });
});

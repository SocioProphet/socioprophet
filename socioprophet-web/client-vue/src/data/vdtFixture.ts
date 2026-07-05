// Value Driver Tree fixture — mirrors economic-prophet `--mode vdt` (canonical
// value engine). The tensor + KPI levers + math here are the SAME model the
// engine runs (GICS45 Software & Platforms; $1B synthetic baseline). UI-only,
// no live adapter — a live run can replace this without touching the page.

export type Polarity = 'higher_better' | 'lower_better';

export interface WeightCell {
  driver: string;
  domain: string;
  weight: number;
}

export interface Kpi {
  driver: string;
  domain: string;
  kpi: string;
  deltaPct: number;
  polarity: Polarity;
}

export const industry = 'GICS45 Software & Platforms';
export const enterpriseValueBaseline = 1_000_000_000;

export const drivers = [
  'RevenueGrowth', 'CostEfficiency', 'Experience',
  'KnowledgeProductivity', 'TrustComplianceResilience', 'Innovation',
] as const;

export const domains = [
  'CustomerInterface', 'ProductServiceDev', 'SupplyDelivery',
  'OperationsSupport', 'RiskSecurity', 'GovernanceKnowledge',
] as const;

// Driver × capability-domain value-attribution tensor (fractions of EV; sums to 1.0).
export const weights: WeightCell[] = [
  { driver: 'RevenueGrowth', domain: 'CustomerInterface', weight: 0.096774 },
  { driver: 'RevenueGrowth', domain: 'ProductServiceDev', weight: 0.048387 },
  { driver: 'RevenueGrowth', domain: 'SupplyDelivery', weight: 0.016129 },
  { driver: 'RevenueGrowth', domain: 'OperationsSupport', weight: 0.032258 },
  { driver: 'RevenueGrowth', domain: 'RiskSecurity', weight: 0.016129 },
  { driver: 'RevenueGrowth', domain: 'GovernanceKnowledge', weight: 0.032258 },
  { driver: 'CostEfficiency', domain: 'CustomerInterface', weight: 0.032258 },
  { driver: 'CostEfficiency', domain: 'ProductServiceDev', weight: 0.032258 },
  { driver: 'CostEfficiency', domain: 'SupplyDelivery', weight: 0.016129 },
  { driver: 'CostEfficiency', domain: 'OperationsSupport', weight: 0.040323 },
  { driver: 'CostEfficiency', domain: 'RiskSecurity', weight: 0.016129 },
  { driver: 'CostEfficiency', domain: 'GovernanceKnowledge', weight: 0.024194 },
  { driver: 'Experience', domain: 'CustomerInterface', weight: 0.048387 },
  { driver: 'Experience', domain: 'ProductServiceDev', weight: 0.024194 },
  { driver: 'Experience', domain: 'SupplyDelivery', weight: 0.008065 },
  { driver: 'Experience', domain: 'OperationsSupport', weight: 0.016129 },
  { driver: 'Experience', domain: 'RiskSecurity', weight: 0.008065 },
  { driver: 'Experience', domain: 'GovernanceKnowledge', weight: 0.016129 },
  { driver: 'KnowledgeProductivity', domain: 'CustomerInterface', weight: 0.032258 },
  { driver: 'KnowledgeProductivity', domain: 'ProductServiceDev', weight: 0.040323 },
  { driver: 'KnowledgeProductivity', domain: 'SupplyDelivery', weight: 0.016129 },
  { driver: 'KnowledgeProductivity', domain: 'OperationsSupport', weight: 0.024194 },
  { driver: 'KnowledgeProductivity', domain: 'RiskSecurity', weight: 0.016129 },
  { driver: 'KnowledgeProductivity', domain: 'GovernanceKnowledge', weight: 0.024194 },
  { driver: 'TrustComplianceResilience', domain: 'CustomerInterface', weight: 0.024194 },
  { driver: 'TrustComplianceResilience', domain: 'ProductServiceDev', weight: 0.024194 },
  { driver: 'TrustComplianceResilience', domain: 'SupplyDelivery', weight: 0.008065 },
  { driver: 'TrustComplianceResilience', domain: 'OperationsSupport', weight: 0.016129 },
  { driver: 'TrustComplianceResilience', domain: 'RiskSecurity', weight: 0.040323 },
  { driver: 'TrustComplianceResilience', domain: 'GovernanceKnowledge', weight: 0.040323 },
  { driver: 'Innovation', domain: 'CustomerInterface', weight: 0.040323 },
  { driver: 'Innovation', domain: 'ProductServiceDev', weight: 0.048387 },
  { driver: 'Innovation', domain: 'SupplyDelivery', weight: 0.016129 },
  { driver: 'Innovation', domain: 'OperationsSupport', weight: 0.024194 },
  { driver: 'Innovation', domain: 'RiskSecurity', weight: 0.016129 },
  { driver: 'Innovation', domain: 'GovernanceKnowledge', weight: 0.024194 },
];

export const kpis: Kpi[] = [
  { driver: 'RevenueGrowth', domain: 'CustomerInterface', kpi: 'arr_growth_pct', deltaPct: 10.0, polarity: 'higher_better' },
  { driver: 'CostEfficiency', domain: 'SupplyDelivery', kpi: 'gross_margin_pct', deltaPct: 2.0, polarity: 'higher_better' },
  { driver: 'TrustComplianceResilience', domain: 'RiskSecurity', kpi: 'security_incident_rate', deltaPct: -0.5, polarity: 'lower_better' },
];

const weightIndex = new Map(weights.map((w) => [`${w.driver}|${w.domain}`, w.weight] as const));
export const weightOf = (driver: string, domain: string): number => weightIndex.get(`${driver}|${domain}`) ?? 0;

/** Value-positive improvement fraction (lower_better metrics improve as they fall). */
export function improvementFraction(deltaPct: number, polarity: Polarity): number {
  const f = deltaPct / 100;
  return polarity === 'higher_better' ? f : -f;
}

/** EV contribution of one KPI lever = improvement × cell weight × EV baseline. */
export function kpiContribution(k: Kpi): number {
  return improvementFraction(k.deltaPct, k.polarity) * weightOf(k.driver, k.domain) * enterpriseValueBaseline;
}

export interface VdtComputed {
  perKpi: Array<Kpi & { contribution: number }>;
  perDriver: Record<string, number>;
  perDomain: Record<string, number>;
  totalUplift: number;
  upliftFraction: number;
  projectedEnterpriseValue: number;
}

export function computeVdt(): VdtComputed {
  const perKpi = kpis.map((k) => ({ ...k, contribution: kpiContribution(k) }));
  const perDriver: Record<string, number> = {};
  const perDomain: Record<string, number> = {};
  let total = 0;
  for (const k of perKpi) {
    perDriver[k.driver] = (perDriver[k.driver] ?? 0) + k.contribution;
    perDomain[k.domain] = (perDomain[k.domain] ?? 0) + k.contribution;
    total += k.contribution;
  }
  return {
    perKpi,
    perDriver,
    perDomain,
    totalUplift: total,
    upliftFraction: total / enterpriseValueBaseline,
    projectedEnterpriseValue: enterpriseValueBaseline + total,
  };
}

// Three horizons over one evidence base, plus the loop that scores itself.
//
//   BACKWARD  what actually happened      — measured from merge/issue evidence
//   CURRENT   what is true right now      — WIP, aging, MoSCoW, Little's Law
//   FORWARD   what is likely              — Monte Carlo percentile bands
//   LOOP      was the last forecast right — calibration, and the correction
//
// The declared inputs (cost, price) live here rather than in the generator, so
// the generator can only ever emit measured evidence. That separation is what
// stops a declared number acquiring a measured basis by proximity.

import type { DeliverySnapshot } from './contract';
import {
  forecastPeriods, checkLittlesLaw, assessMoscow, unitEconomics, forecastMargin,
  breakEvenAccounts, calibrate, wsjf,
  type CostModel, type PricingTier, type ForecastRecord, type Forecast,
  type LittlesLawCheck, type MoscowVerdict, type Calibration,
} from './economics';

// ---------------------------------------------------------------------------
// DECLARED inputs. Not measured, and labelled so everywhere they surface.
// ---------------------------------------------------------------------------

/**
 * Pricing posture carried directly from the market-2 finding: the incumbents
 * leave a canyon between ~$1K and ~$20K/yr, and per-seat metering taxes the
 * distribution an intelligence product needs. So we price into the canyon and
 * meter governed artifacts, not seats.
 */
export const pricingTiers: PricingTier[] = [
  {
    id: 'sovereign-team',
    name: 'Sovereign Team',
    annual: 4800,
    meter: 'governed artifacts + attested agent actions',
    basis: 'declared',
    note: 'Whole-team access. Sits in the $1K–$20K canyon the incumbents leave empty.',
  },
  {
    id: 'sovereign-org',
    name: 'Sovereign Org',
    annual: 18000,
    meter: 'governed artifacts + attested agent actions',
    basis: 'declared',
    note: 'Still under the AlphaSense/PitchBook seat floor, with sovereignty and receipts they do not offer.',
  },
  {
    id: 'governed-estate',
    name: 'Governed Estate',
    annual: 96000,
    meter: 'estate-wide, air-gapped deployment',
    basis: 'declared',
    note: 'Far under a £3M Palantir org licence on the same governed/sovereign axis.',
  },
];

export const costModel: CostModel = {
  costPerPeriod: 9500,
  basis: 'declared',
  note: 'Fully-loaded engineering + infrastructure cost per weekly period. DECLARED — the estate has no wired financials, so this is a planning input, not an observation.',
};

export const PERIODS_PER_YEAR = 52;

/**
 * Forecast history for the learning loop. Recorded when a forecast is made and
 * resolved when the work lands. Seeded empty rather than fabricated: an
 * unearned calibration score would be worse than none.
 */
export const forecastLog: ForecastRecord[] = [];

// ---------------------------------------------------------------------------
// Derived horizons
// ---------------------------------------------------------------------------

export type Backward = {
  weeks: number;
  totalMerged: number;
  medianWeekly: number;
  bestWeek: number;
  worstWeek: number;
  /** max/min — the reason an average would mislead. */
  variabilityRatio: number | null;
  costPerItem: number | null;
  costBasis: string;
  detail: string;
};

export function backward(snap: DeliverySnapshot): Backward {
  const s = snap.history.map((h) => h.merged);
  const sorted = [...s].sort((a, b) => a - b);
  const med = sorted.length
    ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
    : 0;
  const best = s.length ? Math.max(...s) : 0;
  const worst = s.length ? Math.min(...s) : 0;
  const ue = unitEconomics(costModel, med, 'measured');
  return {
    weeks: s.length,
    totalMerged: s.reduce((a, b) => a + b, 0),
    medianWeekly: med,
    bestWeek: best,
    worstWeek: worst,
    variabilityRatio: worst > 0 ? Math.round((best / worst) * 10) / 10 : null,
    costPerItem: ue.costPerDeliveredItem,
    costBasis: ue.basis,
    detail:
      worst > 0 && best / worst > 3
        ? `Weekly throughput ranges ${worst}–${best}, a ${Math.round((best / worst) * 10) / 10}× spread. A velocity average over this would be a confident fiction, which is why the forecast resamples instead.`
        : 'Weekly throughput is relatively stable across the window.',
  };
}

export type Current = {
  wip: number;
  aging: number;
  littlesLaw: LittlesLawCheck;
  moscow: MoscowVerdict | null;
  moscowUnprioritized: boolean;
  detail: string;
};

export function current(snap: DeliverySnapshot): Current {
  const s = snap.history.map((h) => h.merged);
  const perWeek = s.length ? s[s.length - 1] : 0;
  const aging = snap.metrics.find((m) => m.id === 'aging')?.value ?? 0;

  // Arrivals is a MEASURED FLOW (PRs opened in the window), normalised to the
  // same weekly period as throughput. Using the open-issue stock here would be a
  // units error and would silently validate the law when it does not hold.
  const arrivalsPerWeek = snap.windowDays > 0
    ? Math.round((snap.arrivals / snap.windowDays) * 7)
    : 0;

  const ll = checkLittlesLaw({
    throughput: perWeek,
    arrivals: arrivalsPerWeek,
    wip: snap.sprint.carriedOver,
    wipAtStart: snap.sprint.carriedOver,
    cycleTimeDays: 0,
    windowDays: 7,
  });

  const hasLabels = snap.moscow.labelsSeen > 0;
  return {
    wip: snap.sprint.carriedOver,
    aging,
    littlesLaw: ll,
    moscow: hasLabels ? assessMoscow(snap.moscow) : null,
    moscowUnprioritized: !hasLabels,
    detail: hasLabels
      ? 'MoSCoW mix read from issue labels.'
      : 'No MoSCoW labels found across the estate backlog. The backlog is unprioritized — Must-share discipline cannot be assessed, and that is a finding, not a gap in the dashboard.',
  };
}

export type Forward = {
  backlog: number;
  forecast: Forecast;
  /** Weeks at the commitment line. */
  commitWeeks: number | null;
  breakEven: Record<string, number | null>;
  margins: ReturnType<typeof forecastMargin>[];
  detail: string;
};

export const COMMIT_PERCENTILE = 85;

export function forward(snap: DeliverySnapshot): Forward {
  const backlog = snap.metrics.find((m) => m.id === 'issues-open')?.value ?? 0;
  const f = forecastPeriods(snap.history.map((h) => h.merged), backlog, { seed: 1337 });
  const commit = f.sufficient ? (f.percentiles.find((p) => p.p === COMMIT_PERCENTILE)?.periods ?? null) : null;

  return {
    backlog,
    forecast: f,
    commitWeeks: commit,
    breakEven: Object.fromEntries(pricingTiers.map((t) => [t.id, breakEvenAccounts(t, costModel, PERIODS_PER_YEAR)])),
    margins: pricingTiers.map((t) => forecastMargin(t, 25, costModel, PERIODS_PER_YEAR)),
    detail: f.sufficient
      ? `Commit at the ${COMMIT_PERCENTILE}th percentile, not the 50th. The 50th is a coin flip by construction.`
      : f.detail,
  };
}

export type Loop = {
  calibration: Calibration;
  detail: string;
};

export function loop(): Loop {
  const c = calibrate(forecastLog);
  return {
    calibration: c,
    detail:
      forecastLog.length === 0
        ? 'No forecasts have been recorded and resolved yet. The loop is wired but unscored — deliberately empty rather than seeded with invented outcomes.'
        : c.detail,
  };
}

/**
 * WSJF over the estate's own lanes — the bridge from board to P&L. Cost-of-delay
 * components are DECLARED strategic weights taken from the market studies, not
 * measured; the ranking is only as good as those inputs and says so.
 */
export type LanePriority = {
  lane: string;
  wsjf: number | null;
  size: number;
  rationale: string;
};

export const lanePriorities: LanePriority[] = [
  {
    lane: 'Signed receipts on agent actions',
    size: 3,
    wsjf: wsjf({ businessValue: 9, timeCriticality: 9, riskReductionOpportunity: 8 }, 3),
    rationale: 'Market 2 found provenance is presented but never proven, and EU AI Act Art.12 obligations land Dec 2026. Small job, closing window, and it is the one gap no incumbent fills.',
  },
  {
    lane: 'Agent permission + consent contract',
    size: 5,
    wsjf: wsjf({ businessValue: 8, timeCriticality: 8, riskReductionOpportunity: 9 }, 5),
    rationale: 'Every agentic browser fails open; AP2 solved signed mandates for payments only. Purpose-bound revocable delegation is unclaimed.',
  },
  {
    lane: 'Sovereign / air-gapped deployment',
    size: 8,
    wsjf: wsjf({ businessValue: 9, timeCriticality: 5, riskReductionOpportunity: 7 }, 8),
    rationale: 'Only Palantir and Primer serve it, at seven figures. Large job, no closing window, but a durable moat archetype we already hold.',
  },
  {
    lane: 'Horizontal SaaS retrieval (ACL graph)',
    size: 13,
    wsjf: wsjf({ businessValue: 4, timeCriticality: 2, riskReductionOpportunity: 2 }, 13),
    rationale: "Glean's multi-year ACL mirroring against Copilot bundling. Biggest job, weakest position — WSJF ranks it last, which is the point of ranking economically rather than by enthusiasm.",
  },
];

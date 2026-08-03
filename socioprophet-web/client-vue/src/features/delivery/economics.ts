// Delivery economics — the non-naive layer.
//
// Three deliberate choices, each rejecting a common dashboard mistake:
//
//  1. FORECASTING IS PROBABILISTIC, NOT VELOCITY ARITHMETIC.
//     "velocity x sprints" is an average masquerading as a plan. We resample
//     historical throughput (Monte Carlo, Vacanti/Actionable-Agile style) and
//     publish percentile bands. A forecast without a confidence level is an
//     opinion, so we never emit a bare date.
//
//  2. LITTLE'S LAW IS VALIDATED BEFORE IT IS USED.
//     WIP = Throughput x CycleTime only holds for a roughly stable system
//     (arrivals ~ departures, WIP not trending, items actually finishing). Most
//     dashboards quote it unconditionally. We check the preconditions and refuse
//     to derive from it when they fail.
//
//  3. PRIORITY IS ECONOMIC, NOT A LABEL.
//     MoSCoW alone ranks nothing inside a band. WSJF = Cost of Delay / Job Size
//     (CD3) orders the work by value-per-unit-time, which is the actual bridge
//     between an agile board and a P&L.
//
// Cost and price inputs are DECLARED, not measured — the estate has no wired
// financials. They are labelled so, and every derived money figure inherits the
// weakest basis of its inputs. A forecast never launders a declared input into
// a measured-looking number.

import type { MetricBasis } from './contract';

// ---------------------------------------------------------------------------
// MoSCoW
// ---------------------------------------------------------------------------

export type Moscow = 'must' | 'should' | 'could' | 'wont';

export const moscowLabel: Record<Moscow, string> = {
  must: 'Must',
  should: 'Should',
  could: 'Could',
  wont: "Won't (this cycle)",
};

/**
 * Standard MoSCoW discipline: Must should be at most ~60% of capacity, so the
 * cycle can absorb variance without the plan breaking. A Must-heavy backlog is
 * not a prioritized backlog — it is an unprioritized one wearing labels.
 */
export const MUST_CAPACITY_CEILING = 0.6;

export type MoscowMix = {
  must: number; should: number; could: number; wont: number;
};

export function moscowTotal(m: MoscowMix): number {
  return m.must + m.should + m.could + m.wont;
}

/** Committed = everything except an explicit Won't. */
export function committedTotal(m: MoscowMix): number {
  return m.must + m.should + m.could;
}

export function mustShare(m: MoscowMix): number {
  const c = committedTotal(m);
  return c === 0 ? 0 : m.must / c;
}

export type MoscowVerdict = {
  ok: boolean;
  mustShare: number;
  ceiling: number;
  detail: string;
};

export function assessMoscow(m: MoscowMix): MoscowVerdict {
  const share = mustShare(m);
  const ok = share <= MUST_CAPACITY_CEILING;
  return {
    ok,
    mustShare: share,
    ceiling: MUST_CAPACITY_CEILING,
    detail: ok
      ? `Must is ${Math.round(share * 100)}% of committed work, within the ${Math.round(MUST_CAPACITY_CEILING * 100)}% ceiling — the cycle has slack to absorb variance.`
      : `Must is ${Math.round(share * 100)}% of committed work, over the ${Math.round(MUST_CAPACITY_CEILING * 100)}% ceiling. A Must-heavy backlog has no contingency: any variance breaks the commitment rather than a Could.`,
  };
}

// ---------------------------------------------------------------------------
// WSJF / CD3 — the bridge from board to P&L
// ---------------------------------------------------------------------------

export type CostOfDelay = {
  /** Direct revenue or margin exposed per period of delay. */
  businessValue: number;
  /** Value that decays if late (a window closing). */
  timeCriticality: number;
  /** Value from removing future cost or unlocking other work. */
  riskReductionOpportunity: number;
};

export function costOfDelay(c: CostOfDelay): number {
  return c.businessValue + c.timeCriticality + c.riskReductionOpportunity;
}

/**
 * WSJF (a.k.a. CD3) = Cost of Delay / Job Size. Higher is more urgent per unit
 * of effort. Guards against a zero size, which would otherwise rank an
 * unestimated item infinitely high — the classic way this metric gets gamed.
 */
export function wsjf(c: CostOfDelay, jobSize: number): number | null {
  if (!Number.isFinite(jobSize) || jobSize <= 0) return null;
  return Math.round((costOfDelay(c) / jobSize) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Little's Law — validated before use
// ---------------------------------------------------------------------------

export type FlowSystem = {
  /** Items finished per period. */
  throughput: number;
  /** Items started per period. */
  arrivals: number;
  /** Current work in progress. */
  wip: number;
  /** WIP at the start of the window. */
  wipAtStart: number;
  /** Measured median cycle time, days. */
  cycleTimeDays: number;
  /** Length of the observation window, days. */
  windowDays: number;
};

export type LittlesLawCheck = {
  valid: boolean;
  /** Cycle time implied by WIP / throughput, when the law may be applied. */
  impliedCycleTimeDays: number | null;
  reasons: string[];
  detail: string;
};

/**
 * Little's Law is an identity for a STABLE system. Applying it to an unstable
 * one produces a confident wrong number, which is worse than no number.
 */
export function checkLittlesLaw(s: FlowSystem): LittlesLawCheck {
  const reasons: string[] = [];

  if (s.throughput <= 0) reasons.push('nothing finished in the window — no departure rate to divide by');
  if (s.wip <= 0) reasons.push('no work in progress — the law has nothing to describe');

  // Arrivals and departures must roughly match, or WIP is trending and the
  // average is meaningless.
  if (s.throughput > 0 && s.arrivals > 0) {
    const ratio = s.arrivals / s.throughput;
    if (ratio > 1.25 || ratio < 0.75) {
      reasons.push(`arrivals and departures diverge (${s.arrivals} in vs ${s.throughput} out) — the system is not in a steady state`);
    }
  }
  // WIP itself must not be trending hard across the window.
  if (s.wipAtStart > 0) {
    const drift = Math.abs(s.wip - s.wipAtStart) / s.wipAtStart;
    if (drift > 0.5) reasons.push('WIP moved more than 50% across the window — the average does not describe either end');
  }

  const valid = reasons.length === 0;
  return {
    valid,
    impliedCycleTimeDays: valid
      ? Math.round((s.wip / (s.throughput / s.windowDays)) * 10) / 10
      : null,
    reasons,
    detail: valid
      ? "System is stable enough for Little's Law: implied cycle time is derived from WIP and throughput."
      : `Little's Law NOT applied — ${reasons.join('; ')}. Quoting it here would produce a confident wrong number.`,
  };
}

// ---------------------------------------------------------------------------
// Monte Carlo forecast — resample history, never average it
// ---------------------------------------------------------------------------

export type Forecast = {
  /** Backlog size the forecast is for. */
  items: number;
  /** Percentile -> periods needed. */
  percentiles: { p: number; periods: number }[];
  /** Number of trials run. */
  trials: number;
  /** Sample size the forecast rests on. */
  samples: number;
  /** False when there is too little history to forecast honestly. */
  sufficient: boolean;
  detail: string;
};

/** Deterministic PRNG so a forecast is reproducible from the same evidence. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MIN_SAMPLES_FOR_FORECAST = 6;

/**
 * Resample observed per-period throughput to answer "how many periods for N
 * items?" at several confidence levels. Refuses rather than extrapolating from
 * a handful of points — a forecast off 2 samples is theatre.
 */
export function forecastPeriods(
  throughputSamples: number[],
  items: number,
  opts: { trials?: number; seed?: number; percentiles?: number[] } = {},
): Forecast {
  const trials = opts.trials ?? 10000;
  const pcts = opts.percentiles ?? [50, 70, 85, 95];
  const samples = throughputSamples.filter((n) => Number.isFinite(n) && n >= 0);

  if (samples.length < MIN_SAMPLES_FOR_FORECAST || items <= 0 || samples.every((n) => n === 0)) {
    return {
      items,
      percentiles: pcts.map((p) => ({ p, periods: 0 })),
      trials: 0,
      samples: samples.length,
      sufficient: false,
      detail:
        items <= 0
          ? 'Nothing in the backlog to forecast.'
          : `Insufficient history: ${samples.length} usable throughput sample(s) against a minimum of ${MIN_SAMPLES_FOR_FORECAST}. Refusing to forecast rather than extrapolate from noise.`,
    };
  }

  const rnd = mulberry32(opts.seed ?? 42);
  const results: number[] = [];
  const CAP = 1000; // guard against a pathological all-zero resample

  for (let t = 0; t < trials; t += 1) {
    let remaining = items;
    let periods = 0;
    while (remaining > 0 && periods < CAP) {
      remaining -= samples[Math.floor(rnd() * samples.length)];
      periods += 1;
    }
    results.push(periods);
  }
  results.sort((a, b) => a - b);

  return {
    items,
    percentiles: pcts.map((p) => ({
      p,
      periods: results[Math.min(results.length - 1, Math.floor((p / 100) * results.length))],
    })),
    trials,
    samples: samples.length,
    sufficient: true,
    detail: `${trials.toLocaleString()} trials resampling ${samples.length} observed throughput periods. Read the 85th percentile as the commitment line, not the 50th.`,
  };
}

// ---------------------------------------------------------------------------
// Money — declared inputs, honest propagation
// ---------------------------------------------------------------------------

/**
 * Pricing posture carried over from the market-2 study: our defensible axis is
 * governed/sovereign, priced INTO the $1K-$20K canyon the incumbents leave
 * empty, and metered on governed artifacts rather than seats (the Feedly
 * lesson: per-seat pricing taxes the exact distribution an intelligence product
 * needs).
 */
export type PricingTier = {
  id: string;
  name: string;
  /** Annual price per account. */
  annual: number;
  /** What the meter counts. Deliberately not seats. */
  meter: string;
  basis: MetricBasis;
  note: string;
};

export type CostModel = {
  /** Fully-loaded cost per delivery period. */
  costPerPeriod: number;
  basis: MetricBasis;
  note: string;
};

export type UnitEconomics = {
  costPerDeliveredItem: number | null;
  /** Weakest basis among the inputs — money never looks stronger than its worst input. */
  basis: MetricBasis;
  detail: string;
};

const BASIS_RANK: Record<MetricBasis, number> = { measured: 0, declared: 1, estimated: 2 };

/** Money inherits the weakest basis of its inputs. */
export function weakestBasis(...bases: MetricBasis[]): MetricBasis {
  return bases.reduce((worst, b) => (BASIS_RANK[b] > BASIS_RANK[worst] ? b : worst), 'measured');
}

export function unitEconomics(cost: CostModel, deliveredPerPeriod: number, throughputBasis: MetricBasis): UnitEconomics {
  const basis = weakestBasis(cost.basis, throughputBasis);
  if (deliveredPerPeriod <= 0) {
    return { costPerDeliveredItem: null, basis, detail: 'No delivered items in the window — cost per item is undefined, not zero.' };
  }
  return {
    costPerDeliveredItem: Math.round((cost.costPerPeriod / deliveredPerPeriod) * 100) / 100,
    basis,
    detail: `Fully-loaded cost per period divided by delivered items. Basis is '${basis}' — the weakest of the cost and throughput inputs.`,
  };
}

export type MarginForecast = {
  accounts: number;
  tier: PricingTier;
  annualRevenue: number;
  annualCost: number;
  marginPct: number | null;
  basis: MetricBasis;
  detail: string;
};

export function forecastMargin(tier: PricingTier, accounts: number, cost: CostModel, periodsPerYear: number): MarginForecast {
  const annualRevenue = tier.annual * accounts;
  const annualCost = cost.costPerPeriod * periodsPerYear;
  const basis = weakestBasis(tier.basis, cost.basis);
  return {
    accounts,
    tier,
    annualRevenue,
    annualCost,
    marginPct: annualRevenue > 0 ? Math.round(((annualRevenue - annualCost) / annualRevenue) * 100) : null,
    basis,
    detail: `Both inputs are '${basis}'. This is a scenario, not a projection — it says what would be true at ${accounts} accounts, not what will happen.`,
  };
}

/** Accounts needed to cover the run-rate at a given tier. */
export function breakEvenAccounts(tier: PricingTier, cost: CostModel, periodsPerYear: number): number | null {
  if (tier.annual <= 0) return null;
  return Math.ceil((cost.costPerPeriod * periodsPerYear) / tier.annual);
}

// ---------------------------------------------------------------------------
// The learning loop — did the forecast hold?
// ---------------------------------------------------------------------------

export type ForecastRecord = {
  madeAt: string;
  /** The percentile that was committed to. */
  committedPercentile: number;
  /** Periods the forecast said, at that percentile. */
  forecastPeriods: number;
  /** Periods it actually took. Null while still open. */
  actualPeriods: number | null;
  items: number;
};

export type Calibration = {
  resolved: number;
  /** Share of resolved forecasts where actual <= forecast. */
  hitRate: number | null;
  /** What the hit rate SHOULD be, given the committed percentile. */
  expectedRate: number | null;
  bias: 'optimistic' | 'pessimistic' | 'calibrated' | 'unknown';
  detail: string;
  /** The adjustment the loop recommends. */
  recommendation: string;
};

/**
 * The loop that makes this dynamic rather than decorative: compare what was
 * forecast against what happened, and name the systematic bias. A forecasting
 * system that is never scored is a horoscope.
 */
export function calibrate(records: ForecastRecord[]): Calibration {
  const resolved = records.filter((r) => typeof r.actualPeriods === 'number');
  if (resolved.length < 3) {
    return {
      resolved: resolved.length,
      hitRate: null,
      expectedRate: null,
      bias: 'unknown',
      detail: `Only ${resolved.length} resolved forecast(s). Calibration needs at least 3 before it means anything.`,
      recommendation: 'Keep recording forecasts and outcomes; do not tune the model on this few points.',
    };
  }
  const hits = resolved.filter((r) => (r.actualPeriods as number) <= r.forecastPeriods).length;
  const hitRate = hits / resolved.length;
  const expectedRate =
    resolved.reduce((s, r) => s + r.committedPercentile, 0) / resolved.length / 100;

  const drift = hitRate - expectedRate;
  const bias: Calibration['bias'] =
    Math.abs(drift) <= 0.1 ? 'calibrated' : drift < 0 ? 'optimistic' : 'pessimistic';

  return {
    resolved: resolved.length,
    hitRate: Math.round(hitRate * 100) / 100,
    expectedRate: Math.round(expectedRate * 100) / 100,
    bias,
    detail:
      bias === 'calibrated'
        ? `Forecasts land ${Math.round(hitRate * 100)}% of the time against an expected ${Math.round(expectedRate * 100)}% — within tolerance.`
        : bias === 'optimistic'
          ? `Forecasts land only ${Math.round(hitRate * 100)}% of the time against an expected ${Math.round(expectedRate * 100)}% — the model is systematically optimistic.`
          : `Forecasts land ${Math.round(hitRate * 100)}% of the time against an expected ${Math.round(expectedRate * 100)}% — the model is systematically pessimistic and is costing option value.`,
    recommendation:
      bias === 'calibrated'
        ? 'No adjustment. Keep committing at the same percentile.'
        : bias === 'optimistic'
          ? 'Commit at a higher percentile (85 -> 95) until the hit rate recovers, and check whether unplanned work is entering outside the board.'
          : 'Commit at a lower percentile (95 -> 85) to stop leaving capacity unused.',
  };
}

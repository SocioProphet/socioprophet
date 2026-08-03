import { describe, expect, it } from 'vitest';
import {
  assessMoscow, mustShare, committedTotal, MUST_CAPACITY_CEILING,
  wsjf, costOfDelay,
  checkLittlesLaw,
  forecastPeriods, MIN_SAMPLES_FOR_FORECAST,
  unitEconomics, forecastMargin, breakEvenAccounts, weakestBasis,
  calibrate, type ForecastRecord,
} from '../features/delivery/economics';

describe('MoSCoW discipline', () => {
  it("excludes Won't from committed capacity", () => {
    expect(committedTotal({ must: 3, should: 2, could: 1, wont: 99 })).toBe(6);
  });

  it('flags a Must-heavy backlog as unprioritized', () => {
    const v = assessMoscow({ must: 9, should: 1, could: 0, wont: 0 });
    expect(v.ok).toBe(false);
    expect(v.mustShare).toBeGreaterThan(MUST_CAPACITY_CEILING);
    expect(v.detail).toContain('no contingency');
  });

  it('passes a backlog with real slack', () => {
    expect(assessMoscow({ must: 5, should: 3, could: 2, wont: 4 }).ok).toBe(true);
  });

  it('does not divide by zero on an empty backlog', () => {
    expect(mustShare({ must: 0, should: 0, could: 0, wont: 0 })).toBe(0);
  });
});

describe('WSJF / CD3', () => {
  it('ranks value-per-unit-size, not raw value', () => {
    const big = wsjf({ businessValue: 20, timeCriticality: 0, riskReductionOpportunity: 0 }, 20); // 1.0
    const small = wsjf({ businessValue: 8, timeCriticality: 0, riskReductionOpportunity: 0 }, 2); // 4.0
    expect(small!).toBeGreaterThan(big!);
  });

  it('refuses an unestimated item rather than ranking it infinitely high', () => {
    expect(wsjf({ businessValue: 100, timeCriticality: 100, riskReductionOpportunity: 100 }, 0)).toBeNull();
    expect(wsjf({ businessValue: 1, timeCriticality: 1, riskReductionOpportunity: 1 }, -3)).toBeNull();
  });

  it('sums the three cost-of-delay components', () => {
    expect(costOfDelay({ businessValue: 1, timeCriticality: 2, riskReductionOpportunity: 3 })).toBe(6);
  });
});

describe("Little's Law is validated before use", () => {
  const stable = { throughput: 10, arrivals: 10, wip: 5, wipAtStart: 5, cycleTimeDays: 3, windowDays: 14 };

  it('applies to a stable system', () => {
    const c = checkLittlesLaw(stable);
    expect(c.valid).toBe(true);
    expect(c.impliedCycleTimeDays).toBeGreaterThan(0);
  });

  it('refuses when arrivals and departures diverge', () => {
    const c = checkLittlesLaw({ ...stable, arrivals: 40 });
    expect(c.valid).toBe(false);
    expect(c.impliedCycleTimeDays).toBeNull();
    expect(c.detail).toContain('confident wrong number');
  });

  it('refuses when WIP is trending hard', () => {
    expect(checkLittlesLaw({ ...stable, wip: 20, wipAtStart: 5 }).valid).toBe(false);
  });

  it('refuses when nothing finished', () => {
    expect(checkLittlesLaw({ ...stable, throughput: 0 }).valid).toBe(false);
  });
});

describe('Monte Carlo forecasting', () => {
  const history = [4, 6, 3, 7, 5, 4, 8, 2, 5, 6];

  it('refuses to forecast from too little history', () => {
    const f = forecastPeriods([3, 4], 20);
    expect(f.sufficient).toBe(false);
    expect(f.detail).toContain('Refusing to forecast');
    expect(f.samples).toBeLessThan(MIN_SAMPLES_FOR_FORECAST);
  });

  it('produces monotonically non-decreasing percentile bands', () => {
    const f = forecastPeriods(history, 40);
    expect(f.sufficient).toBe(true);
    const periods = f.percentiles.map((x) => x.periods);
    for (let i = 1; i < periods.length; i += 1) {
      expect(periods[i]).toBeGreaterThanOrEqual(periods[i - 1]);
    }
  });

  it('is reproducible from the same evidence and seed', () => {
    const a = forecastPeriods(history, 40, { seed: 7 });
    const b = forecastPeriods(history, 40, { seed: 7 });
    expect(a.percentiles).toEqual(b.percentiles);
  });

  it('forecasts more periods for a bigger backlog', () => {
    const small = forecastPeriods(history, 10, { seed: 1 });
    const large = forecastPeriods(history, 100, { seed: 1 });
    const p85 = (f: typeof small) => f.percentiles.find((x) => x.p === 85)!.periods;
    expect(p85(large)).toBeGreaterThan(p85(small));
  });

  it('is roughly consistent with the mean without being the mean', () => {
    // mean throughput 5/period, 50 items => ~10 periods at p50
    const f = forecastPeriods(history, 50, { seed: 3 });
    const p50 = f.percentiles.find((x) => x.p === 50)!.periods;
    expect(p50).toBeGreaterThanOrEqual(8);
    expect(p50).toBeLessThanOrEqual(13);
    // and the 95th must be strictly more conservative than the 50th
    expect(f.percentiles.find((x) => x.p === 95)!.periods).toBeGreaterThan(p50);
  });

  it('handles an all-zero history without hanging', () => {
    const f = forecastPeriods([0, 0, 0, 0, 0, 0], 10);
    expect(f.sufficient).toBe(false);
  });
});

describe('money never looks stronger than its worst input', () => {
  it('propagates the weakest basis', () => {
    expect(weakestBasis('measured', 'declared')).toBe('declared');
    expect(weakestBasis('measured', 'estimated', 'declared')).toBe('estimated');
    expect(weakestBasis('measured', 'measured')).toBe('measured');
  });

  it('inherits the weaker basis into unit economics', () => {
    const u = unitEconomics({ costPerPeriod: 1000, basis: 'declared', note: '' }, 10, 'measured');
    expect(u.costPerDeliveredItem).toBe(100);
    expect(u.basis).toBe('declared');
  });

  it('returns undefined rather than zero when nothing was delivered', () => {
    const u = unitEconomics({ costPerPeriod: 1000, basis: 'declared', note: '' }, 0, 'measured');
    expect(u.costPerDeliveredItem).toBeNull();
    expect(u.detail).toContain('undefined, not zero');
  });

  it('computes margin and break-even consistently', () => {
    const tier = { id: 't', name: 'T', annual: 12000, meter: 'governed artifacts', basis: 'declared' as const, note: '' };
    const cost = { costPerPeriod: 10000, basis: 'declared' as const, note: '' };
    const m = forecastMargin(tier, 100, cost, 26);
    expect(m.annualRevenue).toBe(1200000);
    expect(m.annualCost).toBe(260000);
    expect(m.marginPct).toBe(78);
    expect(breakEvenAccounts(tier, cost, 26)).toBe(Math.ceil(260000 / 12000));
  });
});

describe('the learning loop scores itself', () => {
  const rec = (forecast: number, actual: number | null, pct = 85): ForecastRecord => ({
    madeAt: '2026-01-01', committedPercentile: pct, forecastPeriods: forecast, actualPeriods: actual, items: 10,
  });

  it('refuses to judge on too few resolved forecasts', () => {
    const c = calibrate([rec(5, 4), rec(5, 6)]);
    expect(c.bias).toBe('unknown');
    expect(c.recommendation).toContain('do not tune');
  });

  it('detects systematic optimism and says how to correct it', () => {
    const c = calibrate([rec(5, 9), rec(5, 8), rec(5, 7), rec(5, 10)]);
    expect(c.bias).toBe('optimistic');
    expect(c.hitRate).toBe(0);
    expect(c.recommendation).toContain('higher percentile');
  });

  it('detects pessimism as a cost, not a comfort', () => {
    const c = calibrate([rec(20, 3, 50), rec(20, 4, 50), rec(20, 2, 50), rec(20, 5, 50)]);
    expect(c.bias).toBe('pessimistic');
    expect(c.detail).toContain('costing option value');
  });

  it('reports calibrated when the hit rate matches the committed percentile', () => {
    // 85th percentile commitment, ~85% hit rate
    const records = [
      ...Array.from({ length: 17 }, () => rec(5, 4)),
      ...Array.from({ length: 3 }, () => rec(5, 9)),
    ];
    expect(calibrate(records).bias).toBe('calibrated');
  });
});

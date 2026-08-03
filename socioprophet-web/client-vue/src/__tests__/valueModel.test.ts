// Teeth for the value model — the codified value axiom over the twin.
// These prove the two governance invariants actually bite: knowledge cannot buy
// down the exogenous hurdle, and value cannot be banked under a closed gate.

import { describe, expect, it } from 'vitest';
import { kknowFromState, valueReading, HURDLE_DEFAULT, DRIFT_BANKABLE_MAX } from '../features/valueModel';
import { seedState, type StateVector } from '../features/twinStateSpace';

const st = (partial: Partial<StateVector>): StateVector => ({
  integrity: 1,
  risk: 0,
  load: 0,
  coverage: 1,
  drift: 0,
  ...partial,
});

describe('kknowFromState — qualified attention = coverage · stability · provenance', () => {
  it('is 1 for a perfectly covered, stable, sound state', () => {
    expect(kknowFromState(st({}))).toBe(1);
  });

  it('rises with coverage and integrity, falls with drift', () => {
    const base = kknowFromState(st({ coverage: 0.5, integrity: 0.5, drift: 0.2 }));
    expect(kknowFromState(st({ coverage: 0.9, integrity: 0.5, drift: 0.2 }))).toBeGreaterThan(base);
    expect(kknowFromState(st({ coverage: 0.5, integrity: 0.9, drift: 0.2 }))).toBeGreaterThan(base);
    expect(kknowFromState(st({ coverage: 0.5, integrity: 0.5, drift: 0.6 }))).toBeLessThan(base);
  });

  it('collapses to 0 when nothing is covered or provenance is absent', () => {
    expect(kknowFromState(st({ coverage: 0 }))).toBe(0);
    expect(kknowFromState(st({ integrity: 0 }))).toBe(0);
  });
});

describe('valueReading — exogenous hurdle invariant (EP v37 / WEDT non-goal)', () => {
  it('INVARIANT: raising Kknow raises value ONLY via the controllable surplus, never by reducing the hurdle', () => {
    const low = valueReading(st({ coverage: 0.4 }));
    const high = valueReading(st({ coverage: 0.9 }));
    // more knowledge → more value…
    expect(high.valueSignal).toBeGreaterThan(low.valueSignal);
    // …but the hurdle subtracted is identical: knowledge cannot buy down cost of capital.
    expect(high.hurdle).toBe(HURDLE_DEFAULT);
    expect(low.hurdle).toBe(HURDLE_DEFAULT);
    expect(high.hurdle).toBe(low.hurdle);
    // the entire gain is in the controllable surplus term
    expect(high.controllableSurplus - low.controllableSurplus).toBeCloseTo(
      high.valueSignal - low.valueSignal,
      6,
    );
  });

  it('a higher hurdle strictly lowers the value signal at fixed Kknow', () => {
    const s = st({ coverage: 0.8, integrity: 0.9 });
    expect(valueReading(s, { hurdle: 0.4 }).valueSignal).toBeLessThan(
      valueReading(s, { hurdle: 0.1 }).valueSignal,
    );
  });
});

describe('valueReading — bankable only when governed AND stable (fail-closed)', () => {
  it('TEETH: a closed governance gate withholds banking even at maximal Kknow', () => {
    const r = valueReading(st({}), { governanceGate: 'closed' });
    expect(r.kknow).toBe(1); // knowledge is maximal…
    expect(r.bankable).toBe(false); // …but it cannot be banked under a closed gate
    expect(r.reason).toMatch(/fail-closed/);
  });

  it('withholds banking when drift exceeds the floor, until re-annealed', () => {
    const r = valueReading(st({ drift: DRIFT_BANKABLE_MAX + 0.1 }));
    expect(r.bankable).toBe(false);
    expect(r.reason).toMatch(/re-annealed/);
  });

  it('banks a governed, stable, well-covered state', () => {
    const r = valueReading(st({ coverage: 0.8, integrity: 0.9, drift: 0.1 }), { governanceGate: 'open' });
    expect(r.bankable).toBe(true);
    expect(r.reason).toMatch(/may be banked/);
  });

  it('reads a plausible value off the twin seed state', () => {
    const r = valueReading(seedState());
    expect(r.kknow).toBeGreaterThan(0);
    expect(r.kknow).toBeLessThan(1);
    expect(typeof r.bankable).toBe('boolean');
  });
});

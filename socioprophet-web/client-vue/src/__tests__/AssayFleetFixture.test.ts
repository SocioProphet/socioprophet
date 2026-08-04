import { describe, expect, it } from 'vitest';
import { demoAssayFleetSnapshot } from '../services/assayApi';

// The client fixture must obey the same aggregation invariants the sourceos-spec
// AssayRollup validator enforces — a broken fixture would render a lie.
describe('demoAssayFleetSnapshot', () => {
  const snap = demoAssayFleetSnapshot();

  it('distribution sums to totalAssays', () => {
    const { ok, sad, bad } = snap.rollup.distribution;
    expect(ok + sad + bad).toBe(snap.rollup.totalAssays);
  });

  it('unassayedReasons never exceed the sad band', () => {
    const reasons = snap.rollup.unassayedReasons ?? {};
    const sum = Object.values(reasons).reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(snap.rollup.distribution.sad);
  });

  it('standardAdoption node counts match scope.nodeCount', () => {
    const adoption = snap.rollup.standardAdoption ?? [];
    const sum = adoption.reduce((a, x) => a + x.nodeCount, 0);
    expect(sum).toBe(snap.rollup.scope.nodeCount);
  });

  it('driftDetected agrees with the adoption table', () => {
    const adoption = snap.rollup.standardAdoption ?? [];
    const versions = new Set(adoption.map((a) => a.calibrationRef));
    const anyUncalibrated = adoption.some((a) => !a.calibrated);
    expect(snap.rollup.driftDetected).toBe(versions.size > 1 || anyUncalibrated);
  });

  it('rollout rolloutPct matches the promoted/observing node share', () => {
    const cohorts = snap.rollout.cohorts;
    const total = cohorts.reduce((a, c) => a + c.nodeCount, 0);
    const onNew = cohorts
      .filter((c) => c.state === 'promoted' || c.state === 'observing')
      .reduce((a, c) => a + c.nodeCount, 0);
    expect(Math.abs((snap.rollout.rolloutPct ?? 0) - (100 * onNew) / total)).toBeLessThan(0.5);
  });

  it('carries the two real calibrated standards', () => {
    const real = snap.standards.filter((s) => s.real && s.calibrated).map((s) => s.verifierId);
    expect(real).toContain('narration-fidelity');
    expect(real).toContain('nl-lexical-baseline');
  });
});

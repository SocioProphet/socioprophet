import { describe, expect, it } from 'vitest';
import { deliverySnapshot as snap } from '../data/deliverySnapshot';
import {
  overallGate, isUnverified, completionRate, scopeChurn, breachesWip,
} from '../features/delivery/contract';
import { registryEntryForPath } from '../config/routeRegistry';

describe('delivery dashboard', () => {
  it('carries a commit receipt so the numbers are reproducible', () => {
    expect(snap.commit).toBeTruthy();
    expect(snap.commit).not.toBe('unknown');
  });

  it('never claims a measured basis without an evidence ref', () => {
    const fabricated = snap.metrics.filter((m) => m.basis === 'measured' && !m.evidence.trim());
    expect(fabricated).toEqual([]);
  });

  it('marks any evidence-free assertion as unverified', () => {
    for (const m of snap.metrics) {
      if (m.basis !== 'measured' && !m.evidence.trim()) {
        expect(isUnverified(m), m.id).toBe(true);
      }
    }
  });

  it('fails the overall gate closed when the snapshot is only fixture-backed', () => {
    const g = overallGate({ ...snap, sourceMode: 'fixture' });
    expect(g.status).not.toBe('pass');
  });

  it('fails the overall gate when any sub-gate fails', () => {
    const g = overallGate({
      ...snap,
      gates: [{ name: 'Evidence collected', status: 'fail', detail: 'forced' }],
    });
    expect(g.status).toBe('fail');
  });

  it('fails the overall gate when a metric asserts a value with no evidence', () => {
    const g = overallGate({
      ...snap,
      metrics: [{ ...snap.metrics[0], basis: 'declared', evidence: '' }],
    });
    expect(g.status).toBe('unverified');
  });

  it('guards sprint maths against a zero commitment', () => {
    const empty = { ...snap.sprint, committed: 0, completed: 0, addedMidSprint: 0 };
    expect(completionRate(empty)).toBe(0);
    expect(scopeChurn(empty)).toBe(0);
  });

  it('only breaches WIP when a limit is actually declared', () => {
    expect(breachesWip({ name: 'x', count: 999, aging: 0 })).toBe(false);
    expect(breachesWip({ name: 'x', count: 11, wipLimit: 10, aging: 0 })).toBe(true);
  });

  it('is registered as a governed route that declares its live-vs-fixture boundary', () => {
    const entry = registryEntryForPath('/delivery');
    expect(entry?.stateMode).toBe('live-fallback');
    expect(entry?.boundary).toContain('must not be used to report delivery status');
  });
});

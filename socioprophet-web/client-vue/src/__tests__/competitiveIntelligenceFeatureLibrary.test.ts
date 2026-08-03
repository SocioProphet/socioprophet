import { describe, expect, it } from 'vitest';
import { competitiveIntelligenceState } from '../features/competitive-intelligence/state';
import {
  featureLibrary,
  lenses,
  opportunityScore,
  unrankedSpecimens,
} from '../features/competitive-intelligence/featureLibrary';

const appNames = new Set([
  ...competitiveIntelligenceState.apps.map((a) => a.name),
  ...unrankedSpecimens,
]);

describe('competitive-intelligence feature library', () => {
  it('has unique feature ids', () => {
    const ids = featureLibrary.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only attributes features to known specimens (ranked or explicitly unranked)', () => {
    const unknown = featureLibrary.flatMap((f) => f.shippedBy.filter((n) => !appNames.has(n)));
    expect(unknown).toEqual([]);
  });

  it('keeps the unranked-specimen list genuinely disjoint from the ranked catalog', () => {
    const ranked = new Set(competitiveIntelligenceState.apps.map((a) => a.name));
    expect(unrankedSpecimens.filter((n) => ranked.has(n))).toEqual([]);
  });

  it('keeps demand in range and always declares its basis', () => {
    for (const f of featureLibrary) {
      expect(f.demand, f.id).toBeGreaterThanOrEqual(0);
      expect(f.demand, f.id).toBeLessThanOrEqual(100);
      expect(['evidence', 'hypothesis'], f.id).toContain(f.demandBasis);
      expect(f.demandNote.length, f.id).toBeGreaterThan(0);
    }
  });

  it('gives every feature at least one capability owner and a gap note', () => {
    for (const f of featureLibrary) {
      expect(f.owners.length, f.id).toBeGreaterThan(0);
      expect(f.gapNote.length, f.id).toBeGreaterThan(0);
    }
  });

  it('cites an evidence path for every non-empty owner', () => {
    for (const f of featureLibrary) {
      for (const o of f.owners) {
        if (o.kind === 'none') continue;
        expect(o.path, `${f.id} -> ${o.name}`).toBeTruthy();
      }
    }
  });

  it('marks features with no capability owner as gaps', () => {
    for (const f of featureLibrary) {
      const unowned = f.owners.every((o) => o.kind === 'none');
      if (unowned) expect(f.readiness, f.id).toBe('gap');
    }
  });

  it('scores opportunity below raw demand for anything not fully ready', () => {
    for (const f of featureLibrary) {
      if (f.readiness !== 'have') {
        expect(opportunityScore(f), f.id).toBeLessThan(f.demand);
      }
    }
  });

  it('exposes a capped, unique lens set', () => {
    expect(lenses.length).toBeLessThanOrEqual(8);
    const ids = lenses.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

import { describe, expect, it } from 'vitest';
import { competitiveIntelligenceState } from '../features/competitive-intelligence/state';
import { markets, coverageTotals } from '../features/competitive-intelligence/markets';

describe('competitive-intelligence market portfolio', () => {
  it('has unique market ids', () => {
    const ids = markets.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never claims specimens or a route for an uncovered market', () => {
    for (const m of markets) {
      if (m.coverage === 'none') {
        expect(m.specimens, m.id).toBe(0);
        expect(m.route, m.id).toBeUndefined();
      }
    }
  });

  it('requires a covered market to have specimens and a route', () => {
    for (const m of markets.filter((x) => x.coverage === 'covered')) {
      expect(m.specimens, m.id).toBeGreaterThan(0);
      expect(m.route, m.id).toBeTruthy();
    }
  });

  it('keeps the consumer market specimen count in sync with the actual catalog', () => {
    const consumer = markets.find((m) => m.id === 'consumer-one-trick');
    expect(consumer?.specimens).toBe(competitiveIntelligenceState.apps.length);
  });

  it('totals reconcile with the register', () => {
    const t = coverageTotals();
    expect(t.covered + t.inProgress + t.none).toBe(t.total);
    expect(t.total).toBe(markets.length);
  });

  it('gives every market rivals, surfaces and a note so no row is empty theatre', () => {
    for (const m of markets) {
      expect(m.rivals.length, m.id).toBeGreaterThan(0);
      expect(m.ourSurfaces.length, m.id).toBeGreaterThan(0);
      expect(m.note.length, m.id).toBeGreaterThan(0);
    }
  });
});

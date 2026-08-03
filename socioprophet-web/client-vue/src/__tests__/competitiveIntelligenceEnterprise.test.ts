import { describe, expect, it } from 'vitest';
import { professionalIntelligenceMarket as m } from '../features/competitive-intelligence/marketProfessionalIntelligence';
import { markets } from '../features/competitive-intelligence/markets';

describe('professional intelligence market (market 2)', () => {
  it('has unique specimen names and ranks', () => {
    const names = m.specimens.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    const ranks = m.specimens.map((s) => s.rank);
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it('declares pricing confidence on every specimen', () => {
    for (const s of m.specimens) {
      expect(['confirmed', 'estimate', 'none'], s.name).toContain(s.pricingConfidence);
      expect(s.pricing.length, s.name).toBeGreaterThan(0);
    }
  });

  it('keeps durability in range and gives every specimen a verdict and lesson', () => {
    for (const s of m.specimens) {
      expect(s.durability, s.name).toBeGreaterThanOrEqual(0);
      expect(s.durability, s.name).toBeLessThanOrEqual(100);
      expect(s.verdict.length, s.name).toBeGreaterThan(0);
      expect(s.lesson.length, s.name).toBeGreaterThan(0);
      expect(s.weakness.length, s.name).toBeGreaterThan(0);
    }
  });

  it('records an honest position on every unserved gap, including the ones we cannot serve', () => {
    for (const g of m.unserved) {
      expect(['yes', 'partly', 'no'], g.gap).toContain(g.weCanServe);
      expect(g.evidence.length, g.gap).toBeGreaterThan(0);
      expect(g.ourPosition.length, g.gap).toBeGreaterThan(0);
    }
    // Guard against flattery: at least one gap must be a flat "we cannot serve".
    expect(m.unserved.some((g) => g.weCanServe === 'no')).toBe(true);
  });

  it('stays in sync with the market coverage register', () => {
    const entry = markets.find((x) => x.id === 'professional-intelligence');
    expect(entry?.coverage).toBe('covered');
    expect(entry?.specimens).toBe(m.specimens.length);
    expect(entry?.route).toBe('/professional-intelligence/competitive/enterprise');
  });
});

import { describe, expect, it } from 'vitest';
import { allCoverage, coverageFor, regionSummaries, worldGradeDistribution } from '../features/catalogue/coverage';
import { COUNTRIES } from '../data/countries';
import { DATA_SOURCES } from '../data/dataSources';

describe('data catalogue — per-country coverage grading', () => {
  it('grades every registered country', () => {
    const all = allCoverage();
    expect(all.length).toBe(COUNTRIES.length);
    expect(all.length).toBeGreaterThan(180); // "all ~195 countries of the world"
    for (const c of all) expect(['A', 'B', 'C', 'D', 'F']).toContain(c.grade);
  });

  it('grades the US highest — it holds the US federal stack nobody else has', () => {
    const us = coverageFor('US')!;
    expect(us.grade).toBe('A');
    expect(us.pct).toBe(1); // US is the ceiling the scale normalises against
    const others = allCoverage().filter((c) => c.iso !== 'US');
    // No other country reaches an A — honest about the ceiling.
    expect(others.every((c) => c.grade !== 'A')).toBe(true);
  });

  it('grades a data-poor low-income state worse than a high-income one (honest, not uniform)', () => {
    const de = coverageFor('DE')!; // Germany, high income
    const td = coverageFor('TD')!; // Chad, low income, lightly mapped
    expect(de.score).toBeGreaterThan(td.score);
    // The whole point: the world is NOT painted uniformly green.
    const dist = worldGradeDistribution();
    const belowC = dist.filter((d) => ['D', 'F'].includes(d.grade)).reduce((n, d) => n + d.count, 0);
    expect(belowC).toBeGreaterThan(0);
  });

  it('excludes sovereign and planned sources from country grading', () => {
    const us = coverageFor('US')!;
    const hitIds = new Set(us.hits.map((h) => h.id));
    const sovereignOrPlanned = DATA_SOURCES.filter((s) => s.scope === 'sovereign' || s.status === 'planned');
    for (const s of sovereignOrPlanned) expect(hitIds.has(s.id)).toBe(false);
  });

  it('reports a live-source count that never exceeds the total contributing count', () => {
    for (const c of allCoverage()) {
      expect(c.liveCount).toBeLessThanOrEqual(c.totalCount);
      expect(c.liveCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('summarises all five regions', () => {
    const rs = regionSummaries();
    expect(rs.length).toBe(5);
    for (const r of rs) {
      expect(r.countries).toBeGreaterThan(0);
      const summed = Object.values(r.dist).reduce((a, b) => a + b, 0);
      expect(summed).toBe(r.countries);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { PLANETS, heliocentric, orbitPath, solveKepler, julianCenturiesSinceJ2000 } from '../space/ephemeris';

const mag = ([x, y, z]: [number, number, number]) => Math.hypot(x, y, z);

describe('Kepler solver', () => {
  it('is exact for a circular orbit (e=0 ⇒ E=M)', () => {
    for (const M of [0, 0.5, 1, 3, -2]) expect(solveKepler(M, 0)).toBeCloseTo(((M % (2 * Math.PI)) + Math.PI) % (2 * Math.PI) - Math.PI, 6);
  });
  it('satisfies M = E − e·sinE at its solution', () => {
    for (const e of [0.01, 0.2, 0.5, 0.9]) {
      for (const M of [0.3, 1.7, 4.2]) {
        const E = solveKepler(M, e);
        const m = ((M % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
        expect(E - e * Math.sin(E)).toBeCloseTo(m, 6);
      }
    }
  });
});

describe('J2000 epoch', () => {
  it('is zero Julian centuries at 2000-01-01 12:00 UTC', () => {
    expect(julianCenturiesSinceJ2000(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)))).toBeCloseTo(0, 6);
  });
});

describe('heliocentric distances stay within true perihelion/aphelion bounds', () => {
  // Sampling across two centuries must never place a planet outside a(1±e).
  const dates = [
    new Date(Date.UTC(1900, 0, 1)), new Date(Date.UTC(2000, 0, 1, 12)),
    new Date(Date.UTC(2025, 6, 15)), new Date(Date.UTC(2099, 11, 31)),
  ];
  for (const p of PLANETS) {
    it(`${p.name} r ∈ [a(1−e), a(1+e)]`, () => {
      const { a, e } = p.elements;
      const peri = a * (1 - e), apo = a * (1 + e);
      for (const d of dates) {
        const r = mag(heliocentric(p, d));
        expect(r).toBeGreaterThanOrEqual(peri - 0.01);
        expect(r).toBeLessThanOrEqual(apo + 0.01);
      }
    });
  }
});

describe('known positions', () => {
  it('Earth is near perihelion (~0.983 AU) in early January 2000', () => {
    const r = mag(heliocentric(PLANETS.find((p) => p.id === 'earth')!, new Date(Date.UTC(2000, 0, 1, 12))));
    expect(r).toBeGreaterThan(0.982);
    expect(r).toBeLessThan(0.985);
  });
  it('planets are ordered outward by semi-major axis', () => {
    const rs = PLANETS.map((p) => p.elements.a);
    for (let k = 1; k < rs.length; k++) expect(rs[k]).toBeGreaterThan(rs[k - 1]);
  });
});

describe('orbit path', () => {
  it('is a closed ring whose radii bracket peri/aphelion', () => {
    const mars = PLANETS.find((p) => p.id === 'mars')!;
    const path = orbitPath(mars, new Date(Date.UTC(2025, 0, 1)), 64);
    expect(path.length).toBe(65);
    expect(mag(path[0])).toBeCloseTo(mag(path[64]), 6); // closed
    const radii = path.map(mag);
    const { a, e } = mars.elements;
    expect(Math.min(...radii)).toBeGreaterThanOrEqual(a * (1 - e) - 0.02);
    expect(Math.max(...radii)).toBeLessThanOrEqual(a * (1 + e) + 0.02);
  });
});

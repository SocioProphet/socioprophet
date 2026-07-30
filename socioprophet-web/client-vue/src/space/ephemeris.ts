// Heliocentric ephemeris for the eight planets — pure, deterministic, replayable.
//
// This is the "computed" tier of the estate's Assay: given a time, the position is
// derived from published orbital elements by Kepler's equation, with no network call
// and no hidden state. The whole solar-system twin is therefore sovereign (nothing
// leaves the browser) and its provenance is honest — it is analytic Kepler from JPL's
// J2000 approximate elements, NOT a live Horizons VECTORS ephemeris. Good to roughly
// arc-minute fidelity over 1800–2050; the twin labels itself as such rather than
// overclaiming a precision it does not have.
//
// Source of the element table: Standish, "Keplerian Elements for Approximate Positions
// of the Major Planets" (JPL Solar System Dynamics). Elements are given at J2000 with
// linear rates per Julian century.

export interface KeplerElements {
  /** semi-major axis, AU, and its rate (AU/century) */
  a: number; aDot: number;
  /** eccentricity (rad-less) and rate per century */
  e: number; eDot: number;
  /** inclination to the ecliptic, degrees, and rate */
  i: number; iDot: number;
  /** mean longitude, degrees, and rate */
  L: number; LDot: number;
  /** longitude of perihelion, degrees, and rate */
  wBar: number; wBarDot: number;
  /** longitude of the ascending node, degrees, and rate */
  Omega: number; OmegaDot: number;
}

export interface Planet {
  id: string;
  name: string;
  /** display colour [r,g,b] */
  color: [number, number, number];
  /** equatorial radius, km — for a log-scaled marker, never physical scale */
  radiusKm: number;
  /** sidereal orbital period in days, for the readout only */
  periodDays: number;
  elements: KeplerElements;
}

export const AU_KM = 149_597_870.7;
const DEG = Math.PI / 180;
const J2000 = 2_451_545.0; // Julian date of the J2000.0 epoch

// a, aDot, e, eDot, i, iDot, L, LDot, wBar, wBarDot, Omega, OmegaDot
export const PLANETS: Planet[] = [
  { id: 'mercury', name: 'Mercury', color: [176, 156, 130], radiusKm: 2440, periodDays: 87.969,
    elements: { a: 0.38709927, aDot: 0.00000037, e: 0.20563593, eDot: 0.00001906,
      i: 7.00497902, iDot: -0.00594749, L: 252.25032350, LDot: 149472.67411175,
      wBar: 77.45779628, wBarDot: 0.16047689, Omega: 48.33076593, OmegaDot: -0.12534081 } },
  { id: 'venus', name: 'Venus', color: [222, 184, 135], radiusKm: 6052, periodDays: 224.701,
    elements: { a: 0.72333566, aDot: 0.00000390, e: 0.00677672, eDot: -0.00004107,
      i: 3.39467605, iDot: -0.00078890, L: 181.97909950, LDot: 58517.81538729,
      wBar: 131.60246718, wBarDot: 0.00268329, Omega: 76.67984255, OmegaDot: -0.27769418 } },
  { id: 'earth', name: 'Earth', color: [90, 160, 235], radiusKm: 6371, periodDays: 365.256,
    elements: { a: 1.00000261, aDot: 0.00000562, e: 0.01671123, eDot: -0.00004392,
      i: -0.00001531, iDot: -0.01294668, L: 100.46457166, LDot: 35999.37244981,
      wBar: 102.93768193, wBarDot: 0.32327364, Omega: 0.0, OmegaDot: 0.0 } },
  { id: 'mars', name: 'Mars', color: [214, 110, 74], radiusKm: 3390, periodDays: 686.980,
    elements: { a: 1.52371034, aDot: 0.00001847, e: 0.09339410, eDot: 0.00007882,
      i: 1.84969142, iDot: -0.00813131, L: -4.55343205, LDot: 19140.30268499,
      wBar: -23.94362959, wBarDot: 0.44441088, Omega: 49.55953891, OmegaDot: -0.29257343 } },
  { id: 'jupiter', name: 'Jupiter', color: [214, 178, 133], radiusKm: 69911, periodDays: 4332.589,
    elements: { a: 5.20288700, aDot: -0.00011607, e: 0.04838624, eDot: -0.00013253,
      i: 1.30439695, iDot: -0.00183714, L: 34.39644051, LDot: 3034.74612775,
      wBar: 14.72847983, wBarDot: 0.21252668, Omega: 100.47390909, OmegaDot: 0.20469106 } },
  { id: 'saturn', name: 'Saturn', color: [222, 202, 150], radiusKm: 58232, periodDays: 10759.22,
    elements: { a: 9.53667594, aDot: -0.00125060, e: 0.05386179, eDot: -0.00050991,
      i: 2.48599187, iDot: 0.00193609, L: 49.95424423, LDot: 1222.49362201,
      wBar: 92.59887831, wBarDot: -0.41897216, Omega: 113.66242448, OmegaDot: -0.28867794 } },
  { id: 'uranus', name: 'Uranus', color: [172, 214, 220], radiusKm: 25362, periodDays: 30685.4,
    elements: { a: 19.18916464, aDot: -0.00196176, e: 0.04725744, eDot: -0.00004397,
      i: 0.77263783, iDot: -0.00242939, L: 313.23810451, LDot: 428.48202785,
      wBar: 170.95427630, wBarDot: 0.40805281, Omega: 74.01692503, OmegaDot: 0.04240589 } },
  { id: 'neptune', name: 'Neptune', color: [110, 140, 235], radiusKm: 24622, periodDays: 60189.0,
    elements: { a: 30.06992276, aDot: 0.00026291, e: 0.00859048, eDot: 0.00005105,
      i: 1.77004347, iDot: 0.00035372, L: -55.12002969, LDot: 218.45945325,
      wBar: 44.96476227, wBarDot: -0.32241464, Omega: 131.78422574, OmegaDot: -0.00508664 } },
];

/** Days since J2000.0 for a JS Date (UTC). 86_400_000 ms per day. */
export function julianCenturiesSinceJ2000(date: Date): number {
  const jd = date.getTime() / 86_400_000 + 2_440_587.5; // Unix epoch → JD
  return (jd - J2000) / 36525;
}

/** Solve Kepler's equation M = E − e·sinE (E, M in radians) by Newton's method. */
export function solveKepler(M: number, e: number, tol = 1e-8): number {
  // normalise M to [−π, π] so the initial guess and convergence are well-behaved
  let m = M % (2 * Math.PI);
  if (m > Math.PI) m -= 2 * Math.PI;
  if (m < -Math.PI) m += 2 * Math.PI;
  let E = m + e * Math.sin(m); // standard first guess
  for (let k = 0; k < 100; k++) {
    const dE = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

/** Heliocentric ecliptic position in AU at time `t`, as [x, y, z]. */
export function heliocentric(planet: Planet, t: Date): [number, number, number] {
  const T = julianCenturiesSinceJ2000(t);
  const el = planet.elements;
  const a = el.a + el.aDot * T;
  const e = el.e + el.eDot * T;
  const i = (el.i + el.iDot * T) * DEG;
  const L = (el.L + el.LDot * T) * DEG;
  const wBar = (el.wBar + el.wBarDot * T) * DEG;
  const Omega = (el.Omega + el.OmegaDot * T) * DEG;

  const omega = wBar - Omega;       // argument of perihelion
  const M = L - wBar;               // mean anomaly
  const E = solveKepler(M, e);

  // position in the orbital plane (perifocal), x toward perihelion
  const xOrb = a * (Math.cos(E) - e);
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // rotate perifocal → ecliptic: R_z(Omega) · R_x(i) · R_z(omega)
  const cO = Math.cos(Omega), sO = Math.sin(Omega);
  const ci = Math.cos(i), si = Math.sin(i);
  const cw = Math.cos(omega), sw = Math.sin(omega);

  const x = (cO * cw - sO * sw * ci) * xOrb + (-cO * sw - sO * cw * ci) * yOrb;
  const y = (sO * cw + cO * sw * ci) * xOrb + (-sO * sw + cO * cw * ci) * yOrb;
  const z = (sw * si) * xOrb + (cw * si) * yOrb;
  return [x, y, z];
}

/** One full orbit sampled as a closed ring of ecliptic points, for the orbit path.
 *  Sampling in eccentric anomaly (not time) keeps the ellipse smooth at perihelion. */
export function orbitPath(planet: Planet, t: Date, samples = 128): [number, number, number][] {
  const T = julianCenturiesSinceJ2000(t);
  const el = planet.elements;
  const a = el.a + el.aDot * T;
  const e = el.e + el.eDot * T;
  const i = (el.i + el.iDot * T) * DEG;
  const wBar = (el.wBar + el.wBarDot * T) * DEG;
  const Omega = (el.Omega + el.OmegaDot * T) * DEG;
  const omega = wBar - Omega;
  const cO = Math.cos(Omega), sO = Math.sin(Omega);
  const ci = Math.cos(i), si = Math.sin(i);
  const cw = Math.cos(omega), sw = Math.sin(omega);
  const pts: [number, number, number][] = [];
  for (let k = 0; k <= samples; k++) {
    const E = (k / samples) * 2 * Math.PI;
    const xOrb = a * (Math.cos(E) - e);
    const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);
    pts.push([
      (cO * cw - sO * sw * ci) * xOrb + (-cO * sw - sO * cw * ci) * yOrb,
      (sO * cw + cO * sw * ci) * xOrb + (-sO * sw + cO * cw * ci) * yOrb,
      (sw * si) * xOrb + (cw * si) * yOrb,
    ]);
  }
  return pts;
}

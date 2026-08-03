/**
 * horoscope.ts — the EMPIRICAL skeleton of a horoscope: geocentric celestial orientation at a
 * time and place. Real astronomy (sidereal time, obliquity, Ascendant, Midheaven) — the honest
 * part of a chart. Zodiac *sign names* are an interpretive lens applied on top; the *angles* here
 * are computed, not interpreted.
 *
 * Formulae are standard low-precision ecliptic geometry (arc-minute class), sufficient to orient the
 * ecliptic lens and read out ASC/MC/LST. Not an ephemeris for the planets — see space/ephemeris.ts.
 */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

export function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

function centuriesSinceJ2000(date: Date): number {
  return (julianDay(date) - 2451545.0) / 36525;
}

/** Mean obliquity of the ecliptic (degrees). */
export function obliquityDeg(date: Date): number {
  return 23.439291 - 0.0130042 * centuriesSinceJ2000(date);
}

/** Greenwich Mean Sidereal Time (degrees, 0..360). */
export function gmstDeg(date: Date): number {
  const d = julianDay(date) - 2451545.0;
  return norm360(280.46061837 + 360.98564736629 * d);
}

/** Local Sidereal Time (degrees = RAMC), longitude east positive. */
export function lstDeg(date: Date, lonDeg: number): number {
  return norm360(gmstDeg(date) + lonDeg);
}

export function lstHours(date: Date, lonDeg: number): number {
  return lstDeg(date, lonDeg) / 15;
}

/** Midheaven ecliptic longitude (degrees, 0..360). */
export function midheavenLon(date: Date, lonDeg: number): number {
  const th = lstDeg(date, lonDeg) * D2R;
  const e = obliquityDeg(date) * D2R;
  return norm360(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(e)) * R2D);
}

/** Ascendant ecliptic longitude (degrees, 0..360) — the sign rising on the eastern horizon. */
export function ascendantLon(date: Date, latDeg: number, lonDeg: number): number {
  const th = lstDeg(date, lonDeg) * D2R;
  const e = obliquityDeg(date) * D2R;
  const phi = latDeg * D2R;
  const asc = Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * R2D;
  return norm360(asc);
}

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;
export const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'] as const;

export interface SignPosition {
  index: number;   // 0..11
  name: string;
  glyph: string;
  deg: number;     // 0..30 within the sign
}

export function signOf(lonDeg: number): SignPosition {
  const l = norm360(lonDeg);
  const index = Math.floor(l / 30);
  return { index, name: SIGNS[index]!, glyph: SIGN_GLYPHS[index]!, deg: l - index * 30 };
}

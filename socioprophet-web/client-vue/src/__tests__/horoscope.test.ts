import { describe, it, expect } from 'vitest';
import { ascendantLon, midheavenLon, lstHours, obliquityDeg, signOf, julianDay, SIGNS } from '../space/horoscope';

describe('horoscope (empirical geocentric orientation)', () => {
  const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)); // J2000.0 epoch
  it('julian day at J2000 epoch is 2451545.0', () => { expect(julianDay(d)).toBeCloseTo(2451545.0, 3); });
  it('obliquity is ~23.44 deg near J2000', () => { expect(obliquityDeg(d)).toBeGreaterThan(23.0); expect(obliquityDeg(d)).toBeLessThan(23.9); });
  it('ASC / MC / LST are in range', () => {
    const asc = ascendantLon(d, 40.1, -75.1), mc = midheavenLon(d, -75.1), lst = lstHours(d, -75.1);
    expect(asc).toBeGreaterThanOrEqual(0); expect(asc).toBeLessThan(360);
    expect(mc).toBeGreaterThanOrEqual(0); expect(mc).toBeLessThan(360);
    expect(lst).toBeGreaterThanOrEqual(0); expect(lst).toBeLessThan(24);
  });
  it('is deterministic for a fixed instant + place', () => { expect(ascendantLon(d, 40.1, -75.1)).toBe(ascendantLon(d, 40.1, -75.1)); });
  it('ASC changes as the Earth turns', () => { const later = new Date(d.getTime() + 3 * 3600 * 1000); expect(ascendantLon(later, 40.1, -75.1)).not.toBe(ascendantLon(d, 40.1, -75.1)); });
  it('signOf maps longitude to the 12 signs', () => {
    expect(signOf(0).name).toBe('Aries'); expect(signOf(35).index).toBe(1);
    expect(signOf(35).deg).toBeCloseTo(5, 6); expect(signOf(359.9).index).toBe(11); expect(SIGNS.length).toBe(12);
  });
});

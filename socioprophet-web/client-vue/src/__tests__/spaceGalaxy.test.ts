import { describe, it, expect } from 'vitest';
import { generateGalaxy } from '../space/galaxy';

describe('procedural galaxy', () => {
  it('is deterministic for a given seed', () => {
    const a = generateGalaxy({ seed: 7, count: 500 });
    const b = generateGalaxy({ seed: 7, count: 500 });
    expect(a).toEqual(b);
  });
  it('a different seed yields a different galaxy', () => {
    const a = generateGalaxy({ seed: 1, count: 500 });
    const b = generateGalaxy({ seed: 2, count: 500 });
    expect(a).not.toEqual(b);
  });
  it('emits the requested count and stays within the disk radius', () => {
    const stars = generateGalaxy({ seed: 3, count: 1000, radius: 90 });
    expect(stars.length).toBe(1000);
    for (const s of stars) {
      const [x, y, z] = s.position;
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(90 + 1e-6);
      expect(Math.abs(z)).toBeLessThan(90); // thin disk, always inside a cube
      expect(s.color.every((c) => c >= 0 && c <= 255)).toBe(true);
    }
  });
});

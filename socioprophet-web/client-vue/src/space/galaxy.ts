// Procedural galaxy point field — the far-field backdrop of the twin.
//
// This is NOT a star catalogue: it is a generated logarithmic-spiral disk, deterministic
// given its seed, used as a structural stand-in until a real HYG/Gaia subset is wired in.
// The screen labels it as such (provenance: "generated") so it is never mistaken for
// observed stellar positions. Kept pure and seeded so the same seed always yields the
// same galaxy — a twin must be reproducible, not a different sky each reload.

export interface StarPoint {
  position: [number, number, number];
  color: [number, number, number];
  size: number;
}

/** Mulberry32 — a tiny, fast, seedable PRNG. Determinism is the point. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GalaxyOptions {
  seed?: number;
  arms?: number;
  count?: number;
  /** disk radius in scene units */
  radius?: number;
  /** how tightly the arms wind (radians of twist per unit radius) */
  twist?: number;
}

/** A logarithmic-spiral galaxy: a warm bulge, cooler disk stars scattered around
 *  `arms` trailing spiral arms, with vertical thickness falling off toward the rim. */
export function generateGalaxy(opts: GalaxyOptions = {}): StarPoint[] {
  const { seed = 42, arms = 4, count = 6000, radius = 90, twist = 2.6 } = opts;
  const rnd = mulberry32(seed);
  const out: StarPoint[] = [];
  for (let k = 0; k < count; k++) {
    // radius biased toward the centre (r = R·u² gives a denser bulge)
    const u = rnd();
    const r = radius * u * u;
    const arm = Math.floor(rnd() * arms);
    const armAngle = (arm / arms) * 2 * Math.PI;
    // spiral: angle grows with radius; scatter shrinks outward so arms stay defined
    const scatter = (rnd() - 0.5) * (0.6 - 0.4 * u);
    const theta = armAngle + r * twist / radius + scatter;
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    const z = (rnd() - 0.5) * radius * 0.06 * (1 - u); // thin disk, thinner at the rim

    // colour: warm/bright in the bulge, cool blue-white in the outer arms
    const warm = 1 - u;
    const cr = Math.round(150 + 105 * warm);
    const cg = Math.round(150 + 70 * warm);
    const cb = Math.round(200 + 55 * u);
    out.push({ position: [x, y, z], color: [cr, cg, Math.min(255, cb)], size: 0.6 + rnd() * 1.4 });
  }
  return out;
}

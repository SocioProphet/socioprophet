/**
 * quadrant.ts — the "cube of space" data plane for the Space Twin quadrant hologram.
 *
 * Fed by **live USOL plus an initial data load**, in that order of preference:
 *   1. live USOL service — `GET /api/space/quadrant` (via the Vite `/api` proxy);
 *   2. the initial data load — a shipped asset `/space/quadrant.initial.json`, EMITTED FROM USOL
 *      (`usolspace.nearby_stars`), so the cube renders instantly and offline;
 *   3. a minimal Sol-only seed — so the cube is never empty.
 *
 * The view owns no star catalogue: the data's canonical home is USOL. `loadQuadrant` never throws;
 * `.source` declares which tier produced the frame so the surface stays honest about what it shows.
 */

export interface StarSystem {
  id: string;
  name: string;
  position: [number, number, number]; // light-years, equatorial, Sol at origin
  color: [number, number, number];
  distLy: number;
  spectral: string;
}

export interface QuadrantData {
  source: 'usol-live' | 'initial-load' | 'seed';
  systems: StarSystem[];
}

export const CUBE_LY = 40;      // half-extent of the mapped cube (Sol-centred)
export const QUAD_SCALE = 5;    // scene units per light-year
export const SECTORS = 4;       // subdivisions per axis → SECTORS³ regions

const SEED: StarSystem[] = [
  { id: 'sol', name: 'Sol', position: [0, 0, 0], color: [255, 236, 170], distLy: 0, spectral: 'G' },
];

function coerce(raw: unknown): StarSystem[] {
  if (!Array.isArray(raw)) return [];
  const out: StarSystem[] = [];
  for (const s of raw as any[]) {
    if (!s || typeof s.name !== 'string' || !Array.isArray(s.position) || s.position.length < 3) continue;
    out.push({
      id: String(s.id ?? s.name),
      name: String(s.name),
      position: [Number(s.position[0]), Number(s.position[1]), Number(s.position[2])],
      color: (Array.isArray(s.color) && s.color.length >= 3 ? [Number(s.color[0]), Number(s.color[1]), Number(s.color[2])] : [200, 200, 210]) as [number, number, number],
      distLy: Number(s.distLy ?? Math.hypot(s.position[0], s.position[1], s.position[2])),
      spectral: String(s.spectral ?? '?'),
    });
  }
  return out;
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<any | null> {
  try {
    const res = await fetch(url, { signal, headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Load the quadrant: live USOL → shipped initial asset → seed. Never throws; the caller learns which
 * tier produced the frame via `.source`.
 */
export async function loadQuadrant(signal?: AbortSignal): Promise<QuadrantData> {
  const live = await fetchJson('/api/space/quadrant', signal);
  const liveSystems = coerce(live?.systems);
  if (liveSystems.length) return { source: 'usol-live', systems: liveSystems };

  const initial = await fetchJson('/space/quadrant.initial.json', signal);
  const initialSystems = coerce(initial?.systems);
  if (initialSystems.length) return { source: 'initial-load', systems: initialSystems };

  return { source: 'seed', systems: SEED };
}

/** The 12 edges of the mapped cube, in scene units. */
export function cubeEdges(): { path: [number, number, number][] }[] {
  const c = CUBE_LY * QUAD_SCALE;
  const v: [number, number, number][] = [];
  for (const z of [-c, c]) for (const y of [-c, c]) for (const x of [-c, c]) v.push([x, y, z]);
  const E = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]];
  return E.map(([a, b]) => ({ path: [v[a]!, v[b]!] }));
}

/** A holographic sector grid: floor (z = −cube) plus two back walls, at sector boundaries. */
export function sectorGrid(): { path: [number, number, number][] }[] {
  const c = CUBE_LY * QUAD_SCALE;
  const step = (2 * c) / SECTORS;
  const at = Array.from({ length: SECTORS + 1 }, (_, i) => -c + i * step);
  const lines: { path: [number, number, number][] }[] = [];
  for (const g of at) { // floor z = -c
    lines.push({ path: [[g, -c, -c], [g, c, -c]] });
    lines.push({ path: [[-c, g, -c], [c, g, -c]] });
  }
  for (const g of at) { // back wall x = -c
    lines.push({ path: [[-c, g, -c], [-c, g, c]] });
    lines.push({ path: [[-c, -c, g], [-c, c, g]] });
  }
  for (const g of at) { // back wall y = -c
    lines.push({ path: [[g, -c, -c], [g, -c, c]] });
    lines.push({ path: [[-c, -c, g], [c, -c, g]] });
  }
  return lines;
}

/** How many of the SECTORS³ regions contain at least one catalogued system (the 5th axis: coverage). */
export function mappedSectors(systems: StarSystem[]): number {
  const c = CUBE_LY;
  const idx = (v: number) => Math.max(0, Math.min(SECTORS - 1, Math.floor(((v + c) / (2 * c)) * SECTORS)));
  const seen = new Set<string>();
  for (const s of systems) {
    const [x, y, z] = s.position;
    if (Math.abs(x) <= c && Math.abs(y) <= c && Math.abs(z) <= c) seen.add(`${idx(x)},${idx(y)},${idx(z)}`);
  }
  return seen.size;
}

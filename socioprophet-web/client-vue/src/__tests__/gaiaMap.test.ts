/**
 * Unit tests for the gaiaMap API client.
 *
 * Covers:
 *  - demo fallback data structure
 *  - fallback mode when API is unavailable
 *  - live mode when API responds successfully
 *  - H3 lookup fallback path
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  demoGaiaMapSnapshot,
  fetchFeaturesByH3WithFallback,
  fetchGaiaMapSnapshotWithFallback,
} from '../api/gaiaMap';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const DEFAULT_H3_CELL = '8928308280fffff';

function makeFetchMock(ok: boolean, payload: unknown) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 503,
    statusText: ok ? 'OK' : 'Service Unavailable',
    json: () => Promise.resolve(payload),
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────────────────────
// demoGaiaMapSnapshot
// ──────────────────────────────────────────────────────────────

describe('demoGaiaMapSnapshot()', () => {
  it('returns a complete GaiaMapSnapshot', () => {
    const snap = demoGaiaMapSnapshot();

    expect(snap).toHaveProperty('layers');
    expect(snap).toHaveProperty('feature');
    expect(snap).toHaveProperty('h3');
    expect(snap).toHaveProperty('routes');
    expect(snap).toHaveProperty('runtimeBoundaries');
    expect(snap).toHaveProperty('governance');
    expect(snap).toHaveProperty('search');
  });

  it('demo layers list contains at least one layer', () => {
    const snap = demoGaiaMapSnapshot();
    expect(snap.layers.layers.length).toBeGreaterThan(0);
  });

  it('demo h3 cell matches the default H3 cell', () => {
    const snap = demoGaiaMapSnapshot();
    expect(snap.h3.h3_cell).toBe(DEFAULT_H3_CELL);
  });

  it('demo governance has attribution_required set', () => {
    const snap = demoGaiaMapSnapshot();
    expect(snap.governance.attribution_required).toBe(true);
  });

  it('demo runtimeBoundaries has at least one runtime', () => {
    const snap = demoGaiaMapSnapshot();
    expect(snap.runtimeBoundaries.runtimes.length).toBeGreaterThan(0);
  });

  it('returns independent copies on each call', () => {
    const a = demoGaiaMapSnapshot();
    const b = demoGaiaMapSnapshot();
    a.h3.h3_cell = 'mutated';
    expect(b.h3.h3_cell).toBe(DEFAULT_H3_CELL);
  });
});

// ──────────────────────────────────────────────────────────────
// fetchGaiaMapSnapshotWithFallback – fallback mode (API down)
// ──────────────────────────────────────────────────────────────

describe('fetchGaiaMapSnapshotWithFallback() – fallback mode', () => {
  it('returns demo mode when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')));

    const result = await fetchGaiaMapSnapshotWithFallback();

    expect(result.mode).toBe('demo');
    expect(result.snapshot).toBeDefined();
    expect(result.warning).toMatch(/demo fallback/i);
  });

  it('returns demo mode when API responds with a non-2xx status', async () => {
    vi.stubGlobal('fetch', makeFetchMock(false, {}));

    const result = await fetchGaiaMapSnapshotWithFallback();

    expect(result.mode).toBe('demo');
    expect(result.snapshot.layers.layers.length).toBeGreaterThan(0);
  });

  it('snapshot in fallback mode has governance data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchGaiaMapSnapshotWithFallback();

    expect(result.snapshot.governance).toBeDefined();
    expect(result.snapshot.governance.attribution_required).toBe(true);
  });

  it('snapshot in fallback mode has runtime boundaries', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchGaiaMapSnapshotWithFallback();

    expect(result.snapshot.runtimeBoundaries.runtimes.length).toBeGreaterThan(0);
  });

  it('snapshot in fallback mode has evidence refs in search result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchGaiaMapSnapshotWithFallback();

    expect(Array.isArray(result.snapshot.search.evidence_refs)).toBe(true);
    expect((result.snapshot.search.evidence_refs ?? []).length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────
// fetchGaiaMapSnapshotWithFallback – live mode (API available)
// ──────────────────────────────────────────────────────────────

describe('fetchGaiaMapSnapshotWithFallback() – live API mode', () => {
  it('returns live mode when all API calls succeed', async () => {
    const demo = demoGaiaMapSnapshot();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(demo.layers),
      } as Response),
    );

    // Each parallel fetch returns the demo layers payload; the snapshot will be
    // constructed from those. We only care about mode here.
    const result = await fetchGaiaMapSnapshotWithFallback();

    expect(result.mode).toBe('live');
    expect(result.warning).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────
// fetchFeaturesByH3WithFallback
// ──────────────────────────────────────────────────────────────

describe('fetchFeaturesByH3WithFallback()', () => {
  it('returns demo mode when API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await fetchFeaturesByH3WithFallback(DEFAULT_H3_CELL);

    expect(result.mode).toBe('demo');
    expect(result.result.h3_cell).toBe(DEFAULT_H3_CELL);
    expect(result.warning).toMatch(/demo/i);
  });

  it('mirrors the requested h3Cell in the fallback result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const cell = '891f1d48177ffff';

    const result = await fetchFeaturesByH3WithFallback(cell);

    expect(result.result.h3_cell).toBe(cell);
  });

  it('does not throw – page must not blank on H3 lookup failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    await expect(fetchFeaturesByH3WithFallback('badcell')).resolves.toBeDefined();
  });

  it('returns live mode when API responds successfully', async () => {
    const demo = demoGaiaMapSnapshot();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(demo.h3),
      } as Response),
    );

    const result = await fetchFeaturesByH3WithFallback(DEFAULT_H3_CELL);

    expect(result.mode).toBe('live');
    expect(result.warning).toBeUndefined();
  });
});

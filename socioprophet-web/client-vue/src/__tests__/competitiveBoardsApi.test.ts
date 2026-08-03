import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCompetitiveBoardsWithFallback } from '../api/competitiveBoardsApi';
import { COMPETITIVE_BOARDS_FIXTURE } from '../features/competitive-intelligence/boards/fixture';

afterEach(() => vi.unstubAllGlobals());

describe('competitiveBoardsApi', () => {
  it('returns the live dataset and mode when the producer responds ok', async () => {
    const payload = { ...COMPETITIVE_BOARDS_FIXTURE, service: 'competitive-boards (live)' };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => payload })));
    const result = await fetchCompetitiveBoardsWithFallback();
    expect(result.mode).toBe('live');
    expect(result.data.service).toBe('competitive-boards (live)');
    expect(result.error).toBeUndefined();
  });

  it('fails closed to the bundled fixture when the producer 404s', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) })));
    const result = await fetchCompetitiveBoardsWithFallback();
    expect(result.mode).toBe('fixture');
    expect(result.data).toBe(COMPETITIVE_BOARDS_FIXTURE);
    expect(result.error).toContain('404');
  });

  it('fails closed to the bundled fixture when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    const result = await fetchCompetitiveBoardsWithFallback();
    expect(result.mode).toBe('fixture');
    expect(result.data).toBe(COMPETITIVE_BOARDS_FIXTURE);
    expect(result.error).toBe('network down');
  });
});

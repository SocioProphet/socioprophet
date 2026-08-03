import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchModelBoard } from '../api/modelBoardApi';

afterEach(() => vi.unstubAllGlobals());

describe('modelBoardApi', () => {
  it('parses a live board and keeps it sovereignty-ranked', async () => {
    const payload = {
      kind: 'ModelBoardNotebook', entryCount: 2, sovereigntyMix: { 'sovereign-local': 1, 'vendor-cloud': 1 },
      leaderboard: [
        { rank: 1, model_id: 'gemma-2-9b-it', provider_id: 'g', privacy_profile: 'sovereign-local', score: 5 },
        { rank: 2, model_id: 'claude-opus-4-8', provider_id: 'a', privacy_profile: 'vendor-cloud', score: 1.5 },
      ], note: 'x',
    };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => payload })));
    const { board, live } = await fetchModelBoard();
    expect(live).toBe(true);
    const by = Object.fromEntries(board.leaderboard.map((r) => [r.model_id, r.score]));
    expect(by['gemma-2-9b-it']).toBeGreaterThan(by['claude-opus-4-8']);
  });

  it('falls back to the fixture when the endpoint is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    const { board, live } = await fetchModelBoard();
    expect(live).toBe(false);
    expect(board.kind).toBe('ModelBoardNotebook');
    expect(board.leaderboard[0].rank).toBe(1);
  });
});

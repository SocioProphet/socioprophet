// Model Board API — fronts the Lattice Studio BFF `GET /api/model-board` (notebook_fixture):
// one sovereignty-ranked board across foundation + business models, cloud ∩ local, on the
// shared InferenceGateway catalog. Same env base as the other clients; degrades to a fixture.
const API_BASE = (import.meta as any).env?.VITE_DASHBOARD_BFF_BASE || (import.meta as any).env?.VITE_MESH_BASE || '/api';

export interface LeaderboardRow { rank: number; model_id: string; provider_id: string; privacy_profile: string; score: number }
export interface ModelBoard { kind: string; entryCount: number; sovereigntyMix: Record<string, number>; leaderboard: LeaderboardRow[]; note: string }

const FIXTURE: ModelBoard = {
  kind: 'ModelBoardNotebook', entryCount: 8,
  sovereigntyMix: { 'sovereign-local': 5, 'sovereign-both': 2, 'vendor-cloud': 1 },
  leaderboard: [
    { rank: 1, model_id: 'gemma-2-9b-it', provider_id: 'google-open-weight', privacy_profile: 'sovereign-local', score: 5.0 },
    { rank: 2, model_id: 'gbm-fraud-v4', provider_id: 'socioprophet-fraud', privacy_profile: 'sovereign-local', score: 4.5 },
    { rank: 3, model_id: 'llama-3.3-70b', provider_id: 'meta-open-weight', privacy_profile: 'sovereign-both', score: 4.0 },
    { rank: 4, model_id: 'claude-opus-4-8', provider_id: 'anthropic', privacy_profile: 'vendor-cloud', score: 1.5 },
  ],
  note: 'fixture — live via /api/model-board',
};

export async function fetchModelBoard(): Promise<{ board: ModelBoard; live: boolean }> {
  try {
    const r = await fetch(`${API_BASE}/model-board`, { headers: { 'content-type': 'application/json' } });
    if (!r.ok) throw new Error(String(r.status));
    const board = (await r.json()) as ModelBoard;
    if (!board || !Array.isArray(board.leaderboard)) throw new Error('shape');
    return { board, live: true };
  } catch {
    return { board: FIXTURE, live: false };
  }
}

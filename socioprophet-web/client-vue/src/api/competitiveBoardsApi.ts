// Competitive-intelligence comparison-boards API client.
//
// Consumes the BOARD DATA MODEL produced by the intelligence-superiority benchmark
// contract (competitive-intel / strategy plane): per-category comparison boards whose
// rows are litmus features, whose columns are the estate + each competitor, and whose
// cells carry a BEAT / MEET / PARTIAL / GAP rank. The estate's own cells additionally
// carry an evidence link (repo/path/PR), a maturity badge (live vs spec), and an
// assessment basis (self-assessed vs externally-certified).
//
// Live-first, fail-open-to-fixture — mirrors intelligenceSuperiorityApi.ts /
// isotaApi.ts: an env-configured base, a getJson wrapper, and a *WithFallback variant
// that returns a bundled, deterministic fixture when the producer is absent so the
// surface ALWAYS renders. Scores are NOT hardcoded in the component — the board renders
// only from this dataset (single source of truth = the benchmark contract). When the
// producer lands, wire the live seam and the same renderer serves live data unchanged.
//
// HONESTY: every board dataset carries an `assessment_basis` on estate cells so the UI
// badges self-assessed vs externally-certified ranks — a BEAT the estate asserts about
// itself is never laundered into an independently-certified result.

import { COMPETITIVE_BOARDS_FIXTURE } from '../features/competitive-intelligence/boards/fixture';

// The benchmark board dataset is served by the estate data surface. The default base
// matches the dashboard-bff / catalog-gateway convention used across the app; override
// with VITE_COMPETITIVE_BOARDS_BASE (or the shared VITE_DASHBOARD_BFF_BASE) to point at
// the live producer once it is wired.
const API_BASE =
  (import.meta as any).env?.VITE_COMPETITIVE_BOARDS_BASE ||
  (import.meta as any).env?.VITE_DASHBOARD_BFF_BASE ||
  '/api';

// The live artifact path (dashboard-bff / catalog-gateway benchmark-board endpoint).
export const COMPETITIVE_BOARDS_PATH = '/v1/competitive-boards';

/** A cell's competitive rank against a litmus feature. */
export type BoardRank = 'BEAT' | 'MEET' | 'PARTIAL' | 'GAP';

/** Whether the estate capability is live (shipped) or spec (declared/planned). */
export type BoardMaturity = 'live' | 'spec';

/** Whether an estate rank is self-asserted or verified by an external party. */
export type AssessmentBasis = 'self-assessed' | 'externally-certified';

/** A litmus criterion (board row) with the definition shown in the portal. */
export interface LitmusFeature {
  id: string;
  name: string;
  /** The litmus definition — shown on hover/expand, never hidden. */
  definition: string;
}

/** A board column: the estate or one competitor. */
export interface BoardColumn {
  id: string;
  name: string;
  /** True for the estate's own column. */
  is_estate: boolean;
  /** Optional short descriptor (e.g. the competitor's category posture). */
  note?: string;
}

/** A single (feature × column) cell. */
export interface BoardCell {
  feature_id: string;
  column_id: string;
  rank: BoardRank;
  /** Estate-only: evidence link (repo/path/PR) grounding the rank. */
  evidence?: { label: string; href: string };
  /** Estate-only: live (shipped) vs spec (declared). */
  maturity?: BoardMaturity;
  /** Estate-only: self-assessed vs externally-certified. */
  basis?: AssessmentBasis;
  /** Short rationale shown on expand. */
  note?: string;
}

/** One category comparison board. */
export interface CategoryBoard {
  id: string;
  name: string;
  description: string;
  /** The column id that is the estate (its cells carry evidence/maturity/basis). */
  estate_column_id: string;
  columns: BoardColumn[];
  features: LitmusFeature[];
  cells: BoardCell[];
}

/** The full board dataset — one document, the single source of truth. */
export interface CompetitiveBoardsDataset {
  service: string;
  version: string;
  /** ISO timestamp the producer stamped. */
  generated_at: string;
  /** Human label for the estate column across all boards. */
  estate_label: string;
  categories: CategoryBoard[];
  disclaimer: string;
}

export type BoardsMode = 'live' | 'fixture';

export interface BoardsLoadResult {
  data: CompetitiveBoardsDataset;
  mode: BoardsMode;
  error?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Fetch the live board dataset, falling back to the bundled representative fixture
 * when the producer is unavailable. The renderer never hardcodes scores — it consumes
 * whichever dataset this returns.
 */
export async function fetchCompetitiveBoardsWithFallback(): Promise<BoardsLoadResult> {
  try {
    const data = await getJson<CompetitiveBoardsDataset>(COMPETITIVE_BOARDS_PATH);
    return { data, mode: 'live' };
  } catch (err) {
    return {
      data: COMPETITIVE_BOARDS_FIXTURE,
      mode: 'fixture',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

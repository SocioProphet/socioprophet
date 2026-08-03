// Board tally helpers — pure functions over the board dataset. Kept out of the
// component so the arithmetic (per-category and overall scorecards) is unit-testable
// and the renderer stays declarative.

import type {
  BoardCell,
  BoardRank,
  CategoryBoard,
  CompetitiveBoardsDataset,
} from '../../../api/competitiveBoardsApi';

export const RANK_ORDER: BoardRank[] = ['BEAT', 'MEET', 'PARTIAL', 'GAP'];

export type RankTally = Record<BoardRank, number>;

function emptyTally(): RankTally {
  return { BEAT: 0, MEET: 0, PARTIAL: 0, GAP: 0 };
}

/** Look up a single cell (feature × competitor). */
export function cellFor(
  board: CategoryBoard,
  featureId: string,
  competitorId: string,
): BoardCell | undefined {
  return board.cells.find((c) => c.feature_id === featureId && c.competitor_id === competitorId);
}

/** Per-category tally over EVERY cell — there is no separate estate column to single out;
 * every cell already is an estate-vs-one-competitor verdict. */
export function tallyBoard(board: CategoryBoard): RankTally {
  const tally = emptyTally();
  for (const cell of board.cells) tally[cell.rank] += 1;
  return tally;
}

/** Overall scorecard = every cell's rank summed across every category. */
export function tallyDataset(dataset: CompetitiveBoardsDataset): RankTally {
  const tally = emptyTally();
  for (const board of dataset.categories) {
    const boardTally = tallyBoard(board);
    for (const rank of RANK_ORDER) tally[rank] += boardTally[rank];
  }
  return tally;
}

/** Total number of ranked cells in a tally (denominator for shares). */
export function tallyTotal(tally: RankTally): number {
  return RANK_ORDER.reduce((sum, rank) => sum + tally[rank], 0);
}

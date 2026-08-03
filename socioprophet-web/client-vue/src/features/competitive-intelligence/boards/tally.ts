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

/** The estate's cells for a board, in feature order. */
export function estateCells(board: CategoryBoard): BoardCell[] {
  const byFeature = new Map<string, BoardCell>();
  for (const cell of board.cells) {
    if (cell.column_id === board.estate_column_id) byFeature.set(cell.feature_id, cell);
  }
  return board.features
    .map((f) => byFeature.get(f.id))
    .filter((c): c is BoardCell => Boolean(c));
}

/** Look up a single cell (feature × column). */
export function cellFor(
  board: CategoryBoard,
  featureId: string,
  columnId: string,
): BoardCell | undefined {
  return board.cells.find((c) => c.feature_id === featureId && c.column_id === columnId);
}

/** Per-category tally of the ESTATE column's ranks. */
export function tallyBoard(board: CategoryBoard): RankTally {
  const tally = emptyTally();
  for (const cell of estateCells(board)) tally[cell.rank] += 1;
  return tally;
}

/** Overall scorecard = the estate's ranks summed across every category. */
export function tallyDataset(dataset: CompetitiveBoardsDataset): RankTally {
  const tally = emptyTally();
  for (const board of dataset.categories) {
    const boardTally = tallyBoard(board);
    for (const rank of RANK_ORDER) tally[rank] += boardTally[rank];
  }
  return tally;
}

/** Total number of ranked estate cells in a tally (denominator for shares). */
export function tallyTotal(tally: RankTally): number {
  return RANK_ORDER.reduce((sum, rank) => sum + tally[rank], 0);
}

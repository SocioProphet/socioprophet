import { describe, expect, it } from 'vitest';
import { COMPETITIVE_BOARDS_FIXTURE } from '../features/competitive-intelligence/boards/fixture';
import { RANK_ORDER, cellFor, estateCells, tallyBoard, tallyDataset, tallyTotal } from '../features/competitive-intelligence/boards/tally';

describe('competitive-intelligence boards fixture', () => {
  it('has unique category ids', () => {
    const ids = COMPETITIVE_BOARDS_FIXTURE.categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every category exactly one estate column matching estate_column_id', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      const estateCols = board.columns.filter((c) => c.is_estate);
      expect(estateCols.length, board.id).toBe(1);
      expect(estateCols[0]?.id, board.id).toBe(board.estate_column_id);
    }
  });

  it('never references a column or feature id that is not declared on the board', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      const colIds = new Set(board.columns.map((c) => c.id));
      const featIds = new Set(board.features.map((f) => f.id));
      for (const cell of board.cells) {
        expect(colIds.has(cell.column_id), `${board.id}: ${cell.column_id}`).toBe(true);
        expect(featIds.has(cell.feature_id), `${board.id}: ${cell.feature_id}`).toBe(true);
      }
    }
  });

  it('has no duplicate (feature × column) cells', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      const keys = board.cells.map((c) => `${c.feature_id}::${c.column_id}`);
      expect(new Set(keys).size, board.id).toBe(keys.length);
    }
  });

  it('gives every litmus feature an estate cell so the row never renders empty for the estate', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      for (const feat of board.features) {
        const cell = cellFor(board, feat.id, board.estate_column_id);
        expect(cell, `${board.id}: ${feat.id}`).toBeDefined();
      }
    }
  });
});

describe('board tally helpers', () => {
  const board = COMPETITIVE_BOARDS_FIXTURE.categories[0];

  it('estateCells returns exactly one cell per feature, in feature order', () => {
    const cells = estateCells(board);
    expect(cells.map((c) => c.feature_id)).toEqual(board.features.map((f) => f.id));
  });

  it('tallyBoard counts only the estate column and reconciles with the feature count', () => {
    const tally = tallyBoard(board);
    expect(tallyTotal(tally)).toBe(board.features.length);
  });

  it('tallyDataset sums every category tally', () => {
    const overall = tallyDataset(COMPETITIVE_BOARDS_FIXTURE);
    const summed = COMPETITIVE_BOARDS_FIXTURE.categories.reduce((sum, b) => {
      const t = tallyBoard(b);
      for (const r of RANK_ORDER) sum[r] += t[r];
      return sum;
    }, { BEAT: 0, MEET: 0, PARTIAL: 0, GAP: 0 });
    expect(overall).toEqual(summed);
    expect(tallyTotal(overall)).toBe(
      COMPETITIVE_BOARDS_FIXTURE.categories.reduce((n, b) => n + b.features.length, 0),
    );
  });

  it('cellFor returns undefined for a non-existent (feature × column) pair', () => {
    expect(cellFor(board, 'does-not-exist', board.estate_column_id)).toBeUndefined();
  });
});

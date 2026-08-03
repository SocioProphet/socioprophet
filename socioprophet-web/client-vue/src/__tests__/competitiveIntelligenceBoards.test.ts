import { describe, expect, it } from 'vitest';
import { COMPETITIVE_BOARDS_FIXTURE } from '../features/competitive-intelligence/boards/fixture';
import { RANK_ORDER, cellFor, tallyBoard, tallyDataset, tallyTotal } from '../features/competitive-intelligence/boards/tally';

describe('competitive-intelligence boards fixture', () => {
  it('has unique category ids', () => {
    const ids = COMPETITIVE_BOARDS_FIXTURE.categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no estate pseudo-competitor — the relative-only model has no such column', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      const names = board.competitors.map((c) => c.name.toLowerCase());
      expect(names, board.id).not.toContain('estate');
      expect(names, board.id).not.toContain('socioprophet');
    }
  });

  it('never references a competitor or feature id that is not declared on the board', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      const compIds = new Set(board.competitors.map((c) => c.id));
      const featIds = new Set(board.features.map((f) => f.id));
      for (const cell of board.cells) {
        expect(compIds.has(cell.competitor_id), `${board.id}: ${cell.competitor_id}`).toBe(true);
        expect(featIds.has(cell.feature_id), `${board.id}: ${cell.feature_id}`).toBe(true);
      }
    }
  });

  it('has no duplicate (feature × competitor) cells', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      const keys = board.cells.map((c) => `${c.feature_id}::${c.competitor_id}`);
      expect(new Set(keys).size, board.id).toBe(keys.length);
    }
  });

  it('gives every litmus feature a cell against every declared competitor — no empty row', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      for (const feat of board.features) {
        for (const comp of board.competitors) {
          const cell = cellFor(board, feat.id, comp.id);
          expect(cell, `${board.id}: ${feat.id} vs ${comp.id}`).toBeDefined();
        }
      }
    }
  });

  it('every cell carries evidence, maturity and basis — the relative-only model has no bare cells', () => {
    for (const board of COMPETITIVE_BOARDS_FIXTURE.categories) {
      for (const cell of board.cells) {
        expect(cell.evidence, `${board.id}: ${cell.feature_id} vs ${cell.competitor_id}`).toBeDefined();
        expect(cell.maturity, `${board.id}: ${cell.feature_id} vs ${cell.competitor_id}`).toBeDefined();
        expect(cell.basis, `${board.id}: ${cell.feature_id} vs ${cell.competitor_id}`).toBe('self-assessed');
      }
    }
  });
});

describe('board tally helpers', () => {
  const board = COMPETITIVE_BOARDS_FIXTURE.categories[0];

  it('tallyBoard counts every cell and reconciles with features × competitors', () => {
    const tally = tallyBoard(board);
    expect(tallyTotal(tally)).toBe(board.features.length * board.competitors.length);
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
      COMPETITIVE_BOARDS_FIXTURE.categories.reduce((n, b) => n + b.features.length * b.competitors.length, 0),
    );
  });

  it('cellFor returns undefined for a non-existent (feature × competitor) pair', () => {
    expect(cellFor(board, 'does-not-exist', board.competitors[0].id)).toBeUndefined();
  });
});

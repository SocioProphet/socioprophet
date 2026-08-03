import { describe, expect, it } from 'vitest';
import { groupIntoRuns, demoLedger, type ExecutionRow } from '../features/executions-ledger/types';

// Minimal row factory — only the fields groupIntoRuns reads.
function row(id: string, run?: ExecutionRow['run'], over: Partial<ExecutionRow> = {}): ExecutionRow {
  return {
    executionReceiptId: id,
    executedAt: over.executedAt ?? '2026-08-01T00:00:00Z',
    agent: over.agent ?? { name: id, version: '1.0.0' },
    input: { type: 'event' },
    decision: { verdict: 'allow', authorityBand: 'observe' },
    verdict: over.verdict ?? 'verified',
    capabilitiesHeld: [],
    capabilitiesUsed: [],
    proofReplayable: true,
    receiptHash: 'sha256:' + '0'.repeat(64),
    run,
    ...over,
  };
}

describe('groupIntoRuns', () => {
  it('separates standalone rows from runs', () => {
    const { runs, ungrouped } = groupIntoRuns([row('a'), row('b')]);
    expect(runs).toHaveLength(0);
    expect(ungrouped.map((r) => r.executionReceiptId)).toEqual(['a', 'b']);
  });

  it('reconstructs a linear handoff chain in step order with increasing depth', () => {
    const rows = [
      row('c', { runId: 'R', step: 2, handoffFrom: 'b' }),
      row('a', { runId: 'R', step: 0 }),
      row('b', { runId: 'R', step: 1, handoffFrom: 'a' }),
    ];
    const { runs, ungrouped } = groupIntoRuns(rows);
    expect(ungrouped).toHaveLength(0);
    expect(runs).toHaveLength(1);
    expect(runs[0].nodes.map((n) => [n.row.executionReceiptId, n.depth])).toEqual([
      ['a', 0], ['b', 1], ['c', 2],
    ]);
    expect(runs[0].count).toBe(3);
  });

  it('renders a fork: siblings share depth, ordered by step', () => {
    const rows = [
      row('root', { runId: 'R', step: 0 }),
      row('child2', { runId: 'R', step: 2, handoffFrom: 'root' }),
      row('child1', { runId: 'R', step: 1, handoffFrom: 'root' }),
    ];
    const { runs } = groupIntoRuns(rows);
    expect(runs[0].nodes.map((n) => [n.row.executionReceiptId, n.depth])).toEqual([
      ['root', 0], ['child1', 1], ['child2', 1],
    ]);
  });

  it('rolls up the worst-case verdict (denied ≻ pending ≻ verified)', () => {
    const rows = [
      row('a', { runId: 'R', step: 0 }, { verdict: 'verified' }),
      row('b', { runId: 'R', step: 1, handoffFrom: 'a' }, { verdict: 'pending' }),
    ];
    expect(groupIntoRuns(rows).runs[0].verdict).toBe('pending');
    const rows2 = [...rows, row('c', { runId: 'R', step: 2, handoffFrom: 'b' }, { verdict: 'denied' })];
    expect(groupIntoRuns(rows2).runs[0].verdict).toBe('denied');
  });

  it('treats a handoffFrom pointing outside the group as a root (no drop)', () => {
    const rows = [row('x', { runId: 'R', step: 1, handoffFrom: 'ghost' })];
    const { runs } = groupIntoRuns(rows);
    expect(runs[0].nodes).toHaveLength(1);
    expect(runs[0].nodes[0].depth).toBe(0);
  });

  it('is total under a cycle — every member appears exactly once', () => {
    const rows = [
      row('a', { runId: 'R', step: 0, handoffFrom: 'b' }),
      row('b', { runId: 'R', step: 1, handoffFrom: 'a' }),
    ];
    const ids = groupIntoRuns(rows).runs[0].nodes.map((n) => n.row.executionReceiptId).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('groups the shipped fixture run and leaves the standalone rows ungrouped', () => {
    const { runs, ungrouped } = groupIntoRuns(demoLedger);
    expect(runs).toHaveLength(1);
    expect(runs[0].runId).toBe('run_incident_atlas_88231');
    expect(runs[0].count).toBe(5);
    expect(runs[0].verdict).toBe('pending'); // two steps await approval
    expect(runs[0].nodes[0].row.executionReceiptId).toBe('exec_triage_router_atlas');
    // every grouped row accounted for; the rest stay standalone
    expect(runs[0].count + ungrouped.length).toBe(demoLedger.length);
    expect(ungrouped.every((r) => !r.run)).toBe(true);
  });
});

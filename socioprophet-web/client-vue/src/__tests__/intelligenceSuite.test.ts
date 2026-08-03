/**
 * The intelligence suite is the join between markets, the estate graph and
 * board-spec streams. These tests guard the invariants the module itself
 * declares in its header comment:
 *  - every market has a surface-ref entry (no market silently falls through)
 *  - a stream name not in board-spec is reported as BROKEN, not rendered as prose
 *  - a repo outside the estate graph's scan window is UNKNOWN, not absent/zero
 *  - a repo that IS in the graph but whose metrics failed to collect
 *    (collected:false) is equally unmeasured — repoMeasured must agree with
 *    marketRows()'s own `n.collected` filter, or the two would disagree about
 *    which repos are unknown.
 */
import { describe, expect, it, vi } from 'vitest';
import { estateGraph } from '../data/estateGraph';
import { markets } from '../features/competitive-intelligence/markets';
import {
  marketSurfaces,
  resolveRef,
  marketRows,
  suiteGaps,
  suiteSurfaces,
} from '../features/intelligence/suite';

describe('intelligence suite — surface refs against the real estate graph', () => {
  it('gives every market a surface-ref entry, keyed by its real id', () => {
    for (const m of markets) {
      expect(marketSurfaces[m.id], m.id).toBeDefined();
      expect(marketSurfaces[m.id].length, m.id).toBeGreaterThan(0);
    }
  });

  it('resolves a ref whose repo and stream are both real', () => {
    const r = resolveRef({ label: 'socioprophet', repo: 'socioprophet', stream: 'Product Surfaces' });
    expect(r.repoMeasured).toBe(true);
    expect(r.streamFound).toBe(true);
    expect(r.broken).toBe(false);
    expect(r.node?.name).toBe('socioprophet');
    expect(r.detail).toBe('Resolved.');
  });

  it('reports a stream not in board-spec as BROKEN, not as prose', () => {
    const r = resolveRef({ label: 'made up', repo: 'socioprophet', stream: 'Not A Real Stream' });
    expect(r.broken).toBe(true);
    expect(r.streamFound).toBe(false);
    expect(r.detail).toContain('broken link');
  });

  it('marks a repo never scanned as UNKNOWN, not absent', () => {
    const r = resolveRef({ label: 'hellgraph', repo: 'hellgraph' });
    expect(r.node).toBeNull();
    expect(r.repoMeasured).toBe(false);
    expect(r.broken).toBe(false);
    expect(r.detail).toContain("outside the estate graph's scan window");
  });

  it('never claims a broken stream for a repo that is simply outside the scan window', () => {
    // Absence of the repo must not be conflated with a bad stream reference.
    const r = resolveRef({ label: 'agentplane', repo: 'agentplane', stream: 'Agent Runtime & Terminal' });
    expect(r.node).toBeNull();
    expect(r.repoMeasured).toBe(false);
    expect(r.streamFound).toBe(true);
    expect(r.broken).toBe(false);
  });

  it('every stream named by a surface ref is a real board-spec stream, or the ref is meant to prove broken-link detection', () => {
    const streamNames = new Set(estateGraph.streams.map((s) => s.name));
    for (const refs of Object.values(marketSurfaces)) {
      for (const ref of refs) {
        if (ref.stream) expect(streamNames.has(ref.stream), ref.label).toBe(true);
      }
    }
  });
});

describe('intelligence suite — marketRows aggregation', () => {
  const rows = marketRows();

  it('produces exactly one row per market, in market order', () => {
    expect(rows.map((r) => r.market.id)).toEqual(markets.map((m) => m.id));
  });

  it('keeps ciRate either null or a 0-100 percentage', () => {
    for (const row of rows) {
      if (row.ciRate !== null) {
        expect(row.ciRate, row.market.id).toBeGreaterThanOrEqual(0);
        expect(row.ciRate, row.market.id).toBeLessThanOrEqual(100);
      }
    }
  });

  it('never counts an uncollected node toward measuredNodes', () => {
    for (const row of rows) {
      for (const ref of row.refs) {
        if (ref.node && !ref.node.collected) {
          expect(row.measuredNodes, row.market.id).toBeLessThan(row.refs.length);
        }
      }
    }
  });

  it('keeps costProxyUsd non-negative and rounded to cents', () => {
    for (const row of rows) {
      expect(Number.isFinite(row.costProxyUsd), row.market.id).toBe(true);
      expect(row.costProxyUsd, row.market.id).toBeGreaterThanOrEqual(0);
      // Rounded-to-cents, allowing for float representation error (e.g. 2.18
      // can be stored internally as 2.1800000000000002) rather than exact equality.
      const cents = row.costProxyUsd * 100;
      expect(Math.abs(cents - Math.round(cents)), row.market.id).toBeLessThan(1e-6);
    }
  });
});

describe('intelligence suite — suiteGaps', () => {
  it('always states the cost-proxy caveat', () => {
    const gaps = suiteGaps(marketRows());
    expect(gaps.some((g) => g.area === 'Cost')).toBe(true);
  });

  it('flags uncovered markets as a blocking gap', () => {
    const gaps = suiteGaps(marketRows());
    const uncovered = markets.filter((m) => m.coverage === 'none');
    const gap = gaps.find((g) => g.area === 'Market coverage');
    if (uncovered.length) {
      expect(gap?.blocking).toBe(true);
      expect(gap?.detail).toContain(String(uncovered.length));
    } else {
      expect(gap).toBeUndefined();
    }
  });
});

describe('intelligence suite — suiteSurfaces', () => {
  it('gives every listed surface a route and a role, so the index can link rather than describe', () => {
    for (const s of suiteSurfaces) {
      expect(s.to.startsWith('/'), s.label).toBe(true);
      expect(s.role.length, s.label).toBeGreaterThan(0);
    }
  });
});

describe('intelligence suite — a repo present in the graph but not collected is unmeasured, not resolved', () => {
  it('repoMeasured agrees with marketRows()\'s own n.collected filter', async () => {
    vi.resetModules();
    vi.doMock('../data/estateGraph', () => ({
      estateGraph: {
        ...estateGraph,
        streams: [{ name: 'Test Stream', org: 'SocioProphet' }],
        nodes: [
          {
            id: 'SocioProphet/failed-scan',
            name: 'failed-scan',
            org: 'SocioProphet',
            collected: false,
            reason: 'API rate limited',
            merged: 0,
            openPrs: 0,
            ciRuns: 0,
            ciSuccess: 0,
            ciSuccessRate: null,
            buildMinutes: 0,
            deployments: 0,
            agentAuthored: 0,
            humanAuthored: 0,
            agentShare: null,
            costProxyUsd: null,
            lastPush: '2026-08-03T00:00:00Z',
          },
        ],
      },
    }));

    const mod = await import('../features/intelligence/suite');
    const r = mod.resolveRef({ label: 'failed-scan', repo: 'failed-scan' });

    // The repo IS in the graph (node is non-null) but its metrics were never
    // collected — this must read as unmeasured, exactly like a repo that was
    // never scanned at all, not as "Resolved."
    expect(r.node).not.toBeNull();
    expect(r.node?.collected).toBe(false);
    expect(r.repoMeasured).toBe(false);
    expect(r.detail).not.toBe('Resolved.');
    expect(r.detail).toContain('were not collected');
    expect(r.detail).toContain('API rate limited');

    vi.doUnmock('../data/estateGraph');
    vi.resetModules();
  });
});

import { describe, expect, it } from 'vitest';
import { estateGraph as g } from '../data/estateGraph';
import { nodeHealth, nodesByOrg, streamsByOrg, orgHealth, driftRatio } from '../features/delivery/estate';

describe('estate graph', () => {
  it('separates all three orgs structurally', () => {
    expect(g.orgs).toHaveLength(3);
    for (const o of g.orgs) expect(g.orgTotals.some((t) => t.org === o), o).toBe(true);
  });

  it('assigns every node to exactly one org', () => {
    for (const n of g.nodes) expect(g.orgs, n.id).toContain(n.org);
    const sum = g.orgs.reduce((s, o) => s + nodesByOrg(g, o).length, 0);
    expect(sum).toBe(g.nodes.length);
  });

  it('carries project streams from the declarative board spec, owned per org', () => {
    expect(g.streams.length).toBeGreaterThan(0);
    for (const s of g.streams) expect(g.orgs, s.name).toContain(s.org);
    expect(g.orgs.some((o) => streamsByOrg(g, o).length > 0)).toBe(true);
  });

  it('never shows an uncollected node as zero-health', () => {
    for (const n of g.nodes) {
      if (!n.collected) expect(nodeHealth(n), n.id).toBe('unknown');
    }
  });

  it('derives health from CI rate rather than asserting it', () => {
    for (const n of g.nodes.filter((x) => x.collected && x.ciSuccessRate !== null)) {
      const r = n.ciSuccessRate as number;
      const expected = r >= 90 ? 'healthy' : r >= 70 ? 'degraded' : 'failing';
      expect(nodeHealth(n), n.id).toBe(expected);
    }
  });

  it('refuses an org health rate when no node reported', () => {
    const empty = { ...g, nodes: [] };
    const h = orgHealth(empty, g.orgs[0]);
    expect(h.rate).toBeNull();
    expect(h.detail).toContain('no rate is derivable');
  });

  it('keeps cost a declared proxy, never presented as billed', () => {
    expect(g.costBasis).toBe('declared');
    expect(g.costNote).toContain('PROXY');
    expect(g.costNote).toContain('not a billed figure');
  });

  it('splits agent and human authorship so attribution is never merged', () => {
    for (const n of g.nodes.filter((x) => x.collected)) {
      expect(n.agentAuthored + n.humanAuthored).toBe(n.merged);
    }
  });
});

describe('declared topology and registry drift', () => {
  it('reports drift rather than filtering it away', () => {
    expect(g.edges.declared).toBeGreaterThan(0);
    expect(g.edges.real + g.edges.driftEdges).toBe(g.edges.declared);
    expect(g.edges.note).toContain('reported, not filtered');
  });

  it('keeps the three edge kinds separate', () => {
    expect(g.edges.note).toContain('submodule pin is not an authority relationship');
    expect(Array.isArray(g.edges.lanes)).toBe(true);
    expect(Array.isArray(g.edges.authority)).toBe(true);
  });

  it('never draws an edge to a repo that does not exist', () => {
    const names = new Set(g.nodes.map((n) => n.name));
    for (const e of g.edges.dependency) {
      expect(names.has(e.from) && names.has(e.to), `${e.from}->${e.to}`).toBe(true);
    }
  });

  it('computes a drift ratio, or refuses when nothing is declared', () => {
    expect(driftRatio(g.edges)).toBeGreaterThanOrEqual(0);
    expect(driftRatio({ ...g.edges, declared: 0 })).toBeNull();
  });
});

// Estate graph — three orgs, project streams, per-node AgentOps.
//
// Separation is structural, not cosmetic: an org is a boundary, a stream is a
// funded lane inside it, and a node is a repo that carries its own health.
// Rolling them together is what makes an estate dashboard useless.

export type OrgTotal = {
  org: string;
  collected: boolean;
  reason: string | null;
  repos: number;
  merged: number;
  openPrs: number;
};

/** A funded lane from registry/board-spec.yaml. */
export type Stream = { name: string; org: string };

export type EstateNode = {
  id: string;
  name: string;
  org: string;
  /** False means metrics could not be collected. NOT the same as zero. */
  collected: boolean;
  reason: string | null;
  merged: number;
  openPrs: number;
  ciRuns: number;
  ciSuccess: number;
  ciSuccessRate: number | null;
  buildMinutes: number;
  deployments: number;
  /** AgentOps: who actually authored the merged work. */
  agentAuthored: number;
  humanAuthored: number;
  agentShare: number | null;
  /** Cost PROXY — measured minutes x declared rate. Never a billed figure. */
  costProxyUsd: number | null;
  lastPush: string;
};

export type EstateGraph = {
  sourceMode: 'live' | 'fixture';
  generatedAt: string;
  windowDays: number;
  orgs: string[];
  orgTotals: OrgTotal[];
  streams: Stream[];
  streamSpecSource: string;
  nodes: EstateNode[];
  nodesCollected: number;
  nodesFailed: number;
  totals: {
    buildMinutes: number;
    costProxyUsd: number;
    agentAuthored: number;
    humanAuthored: number;
    agentSharePct: number | null;
    deployments: number;
  };
  costBasis: 'declared';
  costNote: string;
  boundaryNotice: string;
};

/** Node health, derived — never asserted. */
export type NodeHealth = 'healthy' | 'degraded' | 'failing' | 'unknown';

export function nodeHealth(n: EstateNode): NodeHealth {
  if (!n.collected || n.ciSuccessRate === null) return 'unknown';
  if (n.ciSuccessRate >= 90) return 'healthy';
  if (n.ciSuccessRate >= 70) return 'degraded';
  return 'failing';
}

export const healthLabel: Record<NodeHealth, string> = {
  healthy: 'healthy', degraded: 'degraded', failing: 'failing', unknown: 'not collected',
};

export function nodesByOrg(g: EstateGraph, org: string): EstateNode[] {
  return g.nodes.filter((n) => n.org === org);
}

export function streamsByOrg(g: EstateGraph, org: string): Stream[] {
  return g.streams.filter((s) => s.org === org);
}

/** Rollup that refuses to average an uncollected node into a health figure. */
export function orgHealth(g: EstateGraph, org: string): { rate: number | null; of: number; detail: string } {
  const ns = nodesByOrg(g, org).filter((n) => n.collected && n.ciSuccessRate !== null);
  if (!ns.length) return { rate: null, of: 0, detail: 'No node in this org reported CI health — no rate is derivable.' };
  const rate = Math.round(ns.reduce((s, n) => s + (n.ciSuccessRate as number), 0) / ns.length);
  return { rate, of: ns.length, detail: `Mean CI success across ${ns.length} reporting node(s).` };
}

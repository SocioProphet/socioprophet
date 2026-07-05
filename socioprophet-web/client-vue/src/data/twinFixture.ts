// Corporate digital twin + scenario simulation.
//
// A twin is a company's operational footprint — the supply-chain nodes (facilities,
// ports, routes) it depends on, mapped across geography. A scenario shocks a node or
// route; the simulation propagates the disruption downstream through the chain graph
// and reports the risk + economic-impact deltas. Deterministic and provenance-stamped
// (illustrative) — economic-prophet's policy_simulation engine swaps in behind the
// same shape, resolving each node's twinRef/graphId to live models.

import { edges, nodesForChain, type SCNode } from './supplyChainFixture';
import { chainRisk, type Rating } from './supplyChainRiskFixture';

export interface CorporateTwin {
  id: string;
  name: string;
  kind: string;
  chains: string[];
  headlineSymbol: string;
  evBaseline: number;
  leadTimeDays: number;
  note: string;
}

export const twins: CorporateTwin[] = [
  {
    id: 'nvda', name: 'NVIDIA', kind: 'fabless OEM', chains: ['semis'], headlineSymbol: 'NVDA',
    evBaseline: 3.2e12, leadTimeDays: 84,
    note: 'Designs chips fabbed at TSMC; value is concentrated in a single-source Taiwan fab and the trans-Pacific lane.',
  },
  {
    id: 'copper-major', name: 'Andes Copper (Escondida operator)', kind: 'integrated miner', chains: ['copper'], headlineSymbol: 'COPPER',
    evBaseline: 1.1e11, leadTimeDays: 45,
    note: 'Mine → smelter → port → ocean route → refined-metal buyers; mine water/energy and shipping lanes are the swing risks.',
  },
];

export type ShockKind = 'facility-outage' | 'port-closure' | 'route-disruption' | 'input-shortage';

export interface Scenario {
  id: string;
  name: string;
  targets: string[];
  kind: ShockKind;
  magnitude: number;
  addLeadDays: number;
  note: string;
}

export const scenarios: Scenario[] = [
  { id: 'baseline', name: 'Baseline (no shock)', targets: [], kind: 'facility-outage', magnitude: 0, addLeadDays: 0, note: 'Steady state — the twin as it stands today.' },
  { id: 'taiwan-fab-outage', name: 'Taiwan fab outage', targets: ['tsmc-fab'], kind: 'facility-outage', magnitude: 0.85, addLeadDays: 60, note: 'Leading-edge fab offline (quake / grid). Single-source concentration bites hardest.' },
  { id: 'kaohsiung-port-closure', name: 'Kaohsiung port closure', targets: ['kaohsiung-port'], kind: 'port-closure', magnitude: 0.55, addLeadDays: 21, note: 'Primary export port shut; air-freight fallback is partial and costly.' },
  { id: 'trans-pacific-freight', name: 'Trans-Pacific freight spike', targets: ['route-khh-lax', 'route-anf-sha'], kind: 'route-disruption', magnitude: 0.45, addLeadDays: 12, note: 'Container-rate spike + congestion across the Pacific lanes.' },
  { id: 'chile-water-shortage', name: 'Chile water shortage', targets: ['escondida'], kind: 'input-shortage', magnitude: 0.6, addLeadDays: 30, note: 'Drought curtails mine throughput; energy / water costs surge.' },
  { id: 'chile-port-strike', name: 'Antofagasta port strike', targets: ['antofagasta-port'], kind: 'port-closure', magnitude: 0.5, addLeadDays: 18, note: 'Export gateway blocked; cathode backs up upstream.' },
];

// Per-node economic exposure — how much of the twin's value rides on it. Single-source
// fabs/mines carry the most; commodities at the head carry the least (fungible).
const TYPE_EXPOSURE: Record<string, number> = {
  commodity: 0.4, facility: 1.0, port: 0.7, route: 0.6, company: 0.9, sector: 0.3,
};
function nodeExposure(n: SCNode): number {
  if (n.facility === 'fab' || n.facility === 'mine') return 1.2;
  return TYPE_EXPOSURE[n.type] ?? 0.5;
}

export interface ImpactedNode {
  id: string;
  name: string;
  type: string;
  severity: number;
  geo?: SCNode['geo'];
}

export interface SimResult {
  twinId: string;
  scenarioId: string;
  nodes: SCNode[];
  severityById: Record<string, number>;
  impacted: ImpactedNode[];
  valueAtRisk: number;
  valueAtRiskPct: number;
  pathRiskBefore: number;
  pathRiskAfter: number;
  ratingBefore: Rating;
  ratingAfter: Rating;
  leadTimeBefore: number;
  leadTimeAfter: number;
  provenance: { engine: string; deterministic: boolean; note: string };
}

function ratingFor(score: number): Rating {
  if (score < 0.3) return 'Low';
  if (score < 0.55) return 'Medium';
  if (score < 0.78) return 'High';
  return 'Critical';
}

function twinNodes(twin: CorporateTwin): SCNode[] {
  return twin.chains.flatMap((c) => nodesForChain(c));
}

// Downstream reachability severity: BFS from each shocked target over the chain
// edges, decaying by hop (0.6^distance) — a disruption dampens as it flows on.
function propagate(targets: string[], magnitude: number, ids: Set<string>): Map<string, number> {
  const sev = new Map<string, number>();
  const queue: Array<{ id: string; hop: number }> = [];
  for (const t of targets) {
    if (!ids.has(t)) continue;
    sev.set(t, magnitude);
    queue.push({ id: t, hop: 0 });
  }
  while (queue.length) {
    const { id, hop } = queue.shift()!;
    for (const e of edges) {
      if (e.from !== id || !ids.has(e.to)) continue;
      const next = magnitude * Math.pow(0.6, hop + 1);
      if ((sev.get(e.to) ?? 0) < next) {
        sev.set(e.to, next);
        queue.push({ id: e.to, hop: hop + 1 });
      }
    }
  }
  return sev;
}

export function simulate(twinId: string, scenarioId: string): SimResult {
  const twin = twins.find((t) => t.id === twinId) ?? twins[0]!;
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]!;
  const tnodes = twinNodes(twin);
  const ids = new Set(tnodes.map((n) => n.id));

  const sev = propagate(scenario.targets, scenario.magnitude, ids);

  const totalExposure = tnodes.reduce((a, n) => a + nodeExposure(n), 0) || 1;
  const severityById: Record<string, number> = {};
  const impacted: ImpactedNode[] = [];
  let varFraction = 0;
  for (const n of tnodes) {
    const s = sev.get(n.id) ?? 0;
    severityById[n.id] = s;
    if (s > 0) {
      varFraction += (nodeExposure(n) / totalExposure) * s;
      impacted.push({ id: n.id, name: n.name, type: n.type, severity: s, geo: n.geo });
    }
  }
  impacted.sort((a, b) => b.severity - a.severity);

  const base = twin.chains.map((c) => chainRisk[c]?.pathRisk ?? 0.4);
  const pathRiskBefore = base.reduce((a, b) => a + b, 0) / (base.length || 1);
  const pathRiskAfter = Math.min(1, pathRiskBefore + scenario.magnitude * 0.3 + Math.min(0.15, impacted.length * 0.02));

  return {
    twinId: twin.id,
    scenarioId: scenario.id,
    nodes: tnodes,
    severityById,
    impacted,
    valueAtRisk: twin.evBaseline * varFraction,
    valueAtRiskPct: varFraction,
    pathRiskBefore,
    pathRiskAfter,
    ratingBefore: ratingFor(pathRiskBefore),
    ratingAfter: ratingFor(pathRiskAfter),
    leadTimeBefore: twin.leadTimeDays,
    leadTimeAfter: twin.leadTimeDays + scenario.addLeadDays,
    provenance: {
      engine: 'client twin-sim (deterministic)',
      deterministic: true,
      note: 'Illustrative propagation over the supply-chain graph; economic-prophet policy_simulation swaps in behind this shape.',
    },
  };
}

// Severity → color ramp (green → amber → red) for map pins and bars.
export function severityColor(s: number): string {
  if (s <= 0) return '#4bbf73';
  if (s < 0.34) return '#d8a250';
  if (s < 0.67) return '#e8833e';
  return '#f0656a';
}

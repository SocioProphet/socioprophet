/**
 * Cockpit read-model helpers for CausalGraphSnapshot.
 *
 * Three query functions the render layer needs:
 *   - warrantsForEdge / warrantsForHypothesis: the "every surface shows its
 *     warrant" primitive (W11). Renders on hover, click, drill-down.
 *   - severityBadge: what claim status a hypothesis reports today, in the
 *     five-axis claim verdict vocabulary (proposed / evidenced / scored).
 *   - contributionSummary: a first-cut narrative for an edge — sign,
 *     magnitude, lag, confidence — kept as pure text so the render layer
 *     can drop it in without formatting concerns. The cockpit does NOT
 *     compute propagation itself; that is the engine's job (economic-prophet
 *     `causal_graph.propagate`). This module is display, not maths.
 *
 * Stateless module. `demoAutoPartsSnapshot` gives the smoke test and any
 * initial route a real graph to render; production surfaces will fetch a
 * CausalGraphSnapshot from the API.
 */

import type {
  CausalEdge,
  CausalGraphSnapshot,
  CausalHypothesis,
  ClaimStatus,
  WarrantSummary,
} from './types';

// Own-property guard — a bare `snapshot.warrants[ref]` resolves prototype
// members (toString, valueOf, __proto__) as if they were warrants, and the
// downstream render layer then crashes on `w.excerpt.…` / `w.sourceDocRef.
// startsWith(...)` because those Function values have no such fields. Same
// class of bug that PR #474 hardened in `assertWellFormed`; hardened here
// too so the render helpers are also safe on a malformed snapshot.
function resolveWarrant(
  snapshot: CausalGraphSnapshot,
  ref: string,
): WarrantSummary | undefined {
  if (!Object.prototype.hasOwnProperty.call(snapshot.warrants, ref)) return undefined;
  const w = snapshot.warrants[ref];
  return w || undefined;
}

export function warrantsForEdge(
  snapshot: CausalGraphSnapshot,
  edge: CausalEdge,
): WarrantSummary[] {
  return edge.warrantRefs
    .map((ref) => resolveWarrant(snapshot, ref))
    .filter((w): w is WarrantSummary => w !== undefined);
}

export function warrantsForHypothesis(
  snapshot: CausalGraphSnapshot,
  hypothesis: CausalHypothesis,
): WarrantSummary[] {
  return hypothesis.warrantRefs
    .map((ref) => resolveWarrant(snapshot, ref))
    .filter((w): w is WarrantSummary => w !== undefined);
}

export interface SeverityBadge {
  status: ClaimStatus;
  label: string;
  tone: 'neutral' | 'informational' | 'confident';
}

const BADGES: Record<ClaimStatus, SeverityBadge> = {
  proposed: {
    status: 'proposed', label: 'Proposed', tone: 'neutral',
  },
  evidenced: {
    status: 'evidenced', label: 'Evidenced', tone: 'informational',
  },
  scored: {
    status: 'scored', label: 'Scored', tone: 'confident',
  },
};

export function severityBadge(hypothesis: CausalHypothesis): SeverityBadge {
  return BADGES[hypothesis.claimStatus];
}

export function contributionSummary(edge: CausalEdge): string {
  const direction = edge.sign === 'positive' ? 'raises' : 'lowers';
  const weightPart = edge.weight === undefined
    ? '' : ` (magnitude ${(edge.weight * 100).toFixed(0)}%)`;
  const lagPart = edge.lagDays === undefined
    ? '' : ` with a ${edge.lagDays}-day lag`;
  const confPart = edge.confidence === undefined
    ? '' : `, confidence ${(edge.confidence * 100).toFixed(0)}%`;
  return `${direction}${weightPart}${lagPart}${confPart}`;
}

/**
 * Assert every edge in a snapshot has at least one warrant AND every
 * referenced warrant id resolves to a WarrantSummary. Cockpit refuses to
 * render an unwarranted edge — the same contract economic-prophet
 * `causal_graph.propagate` enforces at the engine layer. A snapshot that
 * fails this assertion is a fabric bug, not a display quirk.
 */
export function assertWellFormed(snapshot: CausalGraphSnapshot): void {
  for (const edge of snapshot.edges) {
    if (edge.warrantRefs.length === 0) {
      throw new Error(
        `CausalGraphSnapshot ${snapshot.graphRef}: edge ${edge.id} has no warrantRefs — unwarranted causality is inadmissible`,
      );
    }
    for (const ref of edge.warrantRefs) {
      // Own-property check: `snapshot.warrants[ref]` would treat prototype
      // properties (toString, __proto__) as present, letting an attacker
      // craft a warrantRef of 'toString' that passes validation but resolves
      // to a Function at render time.
      if (!Object.prototype.hasOwnProperty.call(snapshot.warrants, ref)) {
        throw new Error(
          `CausalGraphSnapshot ${snapshot.graphRef}: edge ${edge.id} references warrant ${ref} not present in snapshot.warrants`,
        );
      }
    }
  }
  // Hypothesis warrant refs must resolve too — otherwise a broken lookup on a
  // hypothesis would slip past validation and later render as "no warrants
  // attached yet" in the UI, misleading a viewer into thinking a claim is
  // deliberately unbacked when it is actually a fabric bug.
  for (const h of snapshot.hypotheses) {
    for (const ref of h.warrantRefs) {
      if (!Object.prototype.hasOwnProperty.call(snapshot.warrants, ref)) {
        throw new Error(
          `CausalGraphSnapshot ${snapshot.graphRef}: hypothesis ${h.id} references warrant ${ref} not present in snapshot.warrants`,
        );
      }
    }
  }
  const hypIds = new Set(snapshot.hypotheses.map((h) => h.id));
  for (const edge of snapshot.edges) {
    if (!hypIds.has(edge.fromRef) || !hypIds.has(edge.toRef)) {
      throw new Error(
        `CausalGraphSnapshot ${snapshot.graphRef}: edge ${edge.id} references a hypothesis not in this snapshot`,
      );
    }
    if (edge.fromRef === edge.toRef) {
      throw new Error(
        `CausalGraphSnapshot ${snapshot.graphRef}: edge ${edge.id} is a self-loop`,
      );
    }
  }
}

/** The IBM HOPE auto-parts worked example — a real graph the cockpit can render today. */
export const demoAutoPartsSnapshot: CausalGraphSnapshot = {
  graphRef: 'urn:srcos:causal-graph:auto_parts_demo',
  displayName: 'Auto parts — worked HOPE example',
  hypotheses: [
    {
      id: 'urn:srcos:causal-hypothesis:auto_parts_demo_tariffs',
      type: 'CausalHypothesis',
      specVersion: '0.1.0',
      graphRef: 'urn:srcos:causal-graph:auto_parts_demo',
      label: 'Tariffs',
      hypothesis: 'Tariff rates on imported product parts change materially.',
      topics: [
        { kind: 'literal', value: 'tariffs' },
        { kind: 'literal', value: 'automotive' },
      ],
      claimStatus: 'evidenced',
      warrantRefs: ['urn:srcos:evidence:atom_asx_gyg_tariff_2026_07'],
    },
    {
      id: 'urn:srcos:causal-hypothesis:auto_parts_demo_op_cost',
      type: 'CausalHypothesis',
      specVersion: '0.1.0',
      graphRef: 'urn:srcos:causal-graph:auto_parts_demo',
      label: 'Operation cost',
      hypothesis: 'Operating costs change materially for the parts manufacturer.',
      topics: [{ kind: 'literal', value: 'operations' }],
      claimStatus: 'evidenced',
      warrantRefs: ['urn:srcos:evidence:atom_op_cost_2026_q2'],
    },
    {
      id: 'urn:srcos:causal-hypothesis:auto_parts_demo_revenue',
      type: 'CausalHypothesis',
      specVersion: '0.1.0',
      graphRef: 'urn:srcos:causal-graph:auto_parts_demo',
      label: 'Revenue',
      hypothesis: 'Quarterly revenue for the modeled manufacturer changes materially.',
      topics: [{ kind: 'template', value: 'customer_name' }],
      claimStatus: 'proposed',
      warrantRefs: [],
    },
  ],
  edges: [
    {
      id: 'urn:srcos:causal-edge:auto_parts_demo_tariffs_op_cost',
      type: 'CausalEdge',
      specVersion: '0.1.0',
      graphRef: 'urn:srcos:causal-graph:auto_parts_demo',
      fromRef: 'urn:srcos:causal-hypothesis:auto_parts_demo_tariffs',
      toRef: 'urn:srcos:causal-hypothesis:auto_parts_demo_op_cost',
      sign: 'positive', weight: 0.6, lagDays: 45, confidence: 0.75,
      warrantRefs: ['urn:srcos:evidence:atom_asx_gyg_tariff_2026_07'],
    },
    {
      id: 'urn:srcos:causal-edge:auto_parts_demo_op_cost_revenue',
      type: 'CausalEdge',
      specVersion: '0.1.0',
      graphRef: 'urn:srcos:causal-graph:auto_parts_demo',
      fromRef: 'urn:srcos:causal-hypothesis:auto_parts_demo_op_cost',
      toRef: 'urn:srcos:causal-hypothesis:auto_parts_demo_revenue',
      sign: 'negative', weight: 0.5, lagDays: 30, confidence: 0.7,
      warrantRefs: ['urn:srcos:evidence:atom_op_cost_2026_q2'],
    },
    {
      id: 'urn:srcos:causal-edge:auto_parts_demo_tariffs_revenue_direct',
      type: 'CausalEdge',
      specVersion: '0.1.0',
      graphRef: 'urn:srcos:causal-graph:auto_parts_demo',
      fromRef: 'urn:srcos:causal-hypothesis:auto_parts_demo_tariffs',
      toRef: 'urn:srcos:causal-hypothesis:auto_parts_demo_revenue',
      sign: 'negative', weight: 0.4, lagDays: 90, confidence: 0.6,
      warrantRefs: ['urn:srcos:evidence:atom_asx_gyg_tariff_2026_07'],
    },
  ],
  warrants: {
    'urn:srcos:evidence:atom_asx_gyg_tariff_2026_07': {
      id: 'urn:srcos:evidence:atom_asx_gyg_tariff_2026_07',
      sourceDocRef: 'urn:srcos:doc:asx_gyg_annual_2026',
      excerpt: 'Tariff exposure on imported components remains material to FY2026 unit economics.',
    },
    'urn:srcos:evidence:atom_op_cost_2026_q2': {
      id: 'urn:srcos:evidence:atom_op_cost_2026_q2',
      sourceDocRef: 'urn:srcos:doc:internal_q2_ops_review',
      excerpt: 'Q2 operating-cost review notes a 3.4% uplift attributable to tariff pass-through.',
    },
  },
};

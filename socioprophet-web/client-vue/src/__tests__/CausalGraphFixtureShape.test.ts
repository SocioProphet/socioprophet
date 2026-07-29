/**
 * Fixture-chain parity for the causal-graph cockpit types.
 *
 * The client-side types mirror sourceos-spec's v0.1 CausalHypothesis /
 * CausalEdge. When either canonical schema bumps, these tests are the guard
 * that catches the mirror drifting out of step: every required field the
 * shipped v0.1 contract names is asserted present on the demo fixture.
 *
 * Also exercises the read-model invariants the cockpit refuses to render
 * past: unwarranted edge, missing warrant lookup, endpoint not in the
 * hypothesis set, self-loop.
 */
import { describe, expect, it } from 'vitest';
import {
  assertWellFormed,
  contributionSummary,
  demoAutoPartsSnapshot,
  severityBadge,
  warrantsForEdge,
  warrantsForHypothesis,
} from '../features/causal-graph/state';
import type { CausalEdge, CausalHypothesis } from '../features/causal-graph/types';

// Required fields per sourceos-spec CausalHypothesis.json v0.1 (subset the
// cockpit renders — NOT the ingest-only fields like kkoTypeRef or entityClusterRef).
const HYPOTHESIS_REQUIRED = [
  'id', 'type', 'specVersion', 'graphRef', 'label', 'hypothesis', 'topics',
  'claimStatus', 'warrantRefs',
] as const;

const EDGE_REQUIRED = [
  'id', 'type', 'specVersion', 'graphRef', 'fromRef', 'toRef', 'sign', 'warrantRefs',
] as const;

describe('CausalGraphSnapshot mirrors the shipped v0.1 contracts', () => {
  it('every fixture hypothesis carries every required v0.1 field', () => {
    for (const h of demoAutoPartsSnapshot.hypotheses) {
      for (const key of HYPOTHESIS_REQUIRED) {
        expect(h, `${h.id} missing ${key}`).toHaveProperty(key);
      }
      expect(h.type).toBe('CausalHypothesis');
      expect(h.specVersion).toBe('0.1.0');
      expect(h.graphRef).toBe(demoAutoPartsSnapshot.graphRef);
    }
  });

  it('every fixture edge carries every required v0.1 field, non-empty warrants, and valid sign', () => {
    for (const e of demoAutoPartsSnapshot.edges) {
      for (const key of EDGE_REQUIRED) {
        expect(e, `${e.id} missing ${key}`).toHaveProperty(key);
      }
      expect(e.type).toBe('CausalEdge');
      expect(e.specVersion).toBe('0.1.0');
      expect(['positive', 'negative']).toContain(e.sign);
      expect(e.warrantRefs.length).toBeGreaterThan(0);
    }
  });
});

describe('cockpit read-model invariants', () => {
  it('demo snapshot passes assertWellFormed', () => {
    expect(() => assertWellFormed(demoAutoPartsSnapshot)).not.toThrow();
  });

  it('refuses to render an edge with no warrantRefs', () => {
    const broken = structuredClone(demoAutoPartsSnapshot);
    broken.edges[0]!.warrantRefs = [];
    expect(() => assertWellFormed(broken)).toThrow(/no warrantRefs/);
  });

  it('refuses to render an edge whose warrant is not in the lookup', () => {
    const broken = structuredClone(demoAutoPartsSnapshot);
    broken.edges[0]!.warrantRefs = ['urn:srcos:evidence:missing'];
    expect(() => assertWellFormed(broken)).toThrow(/not present in snapshot.warrants/);
  });

  it('refuses to render an edge whose endpoint is not declared', () => {
    const broken = structuredClone(demoAutoPartsSnapshot);
    broken.edges[0]!.toRef = 'urn:srcos:causal-hypothesis:ghost';
    expect(() => assertWellFormed(broken)).toThrow(/not in this snapshot/);
  });

  it('refuses to render a self-loop', () => {
    const broken = structuredClone(demoAutoPartsSnapshot);
    broken.edges[0]!.toRef = broken.edges[0]!.fromRef;
    expect(() => assertWellFormed(broken)).toThrow(/self-loop/);
  });
});

describe('warrant drill-down surfaces every referenced evidence atom', () => {
  it('warrantsForEdge returns a WarrantSummary per referenced warrant', () => {
    for (const edge of demoAutoPartsSnapshot.edges) {
      const found = warrantsForEdge(demoAutoPartsSnapshot, edge);
      expect(found.length).toBe(edge.warrantRefs.length);
      for (const w of found) {
        expect(w.excerpt.length).toBeGreaterThan(0);
        expect(w.sourceDocRef.startsWith('urn:srcos:doc:')).toBe(true);
      }
    }
  });

  it('warrantsForHypothesis returns warrants for an evidenced claim and empty for proposed', () => {
    const evidenced = demoAutoPartsSnapshot.hypotheses.find((h) => h.claimStatus === 'evidenced');
    expect(evidenced).toBeDefined();
    expect(warrantsForHypothesis(demoAutoPartsSnapshot, evidenced!).length).toBeGreaterThan(0);

    const proposed = demoAutoPartsSnapshot.hypotheses.find((h) => h.claimStatus === 'proposed');
    expect(proposed).toBeDefined();
    expect(warrantsForHypothesis(demoAutoPartsSnapshot, proposed!)).toEqual([]);
  });
});

describe('display projections', () => {
  it('severityBadge tone tracks claim status distinctly', () => {
    const tones = (['proposed', 'evidenced', 'scored'] as const).map((s) =>
      severityBadge({ claimStatus: s } as CausalHypothesis).tone,
    );
    expect(new Set(tones).size).toBe(3);
  });

  it('contributionSummary reports direction, magnitude, lag, and confidence when present', () => {
    const edge: CausalEdge = {
      id: 'e', type: 'CausalEdge', specVersion: '0.1.0', graphRef: 'g',
      fromRef: 'a', toRef: 'b', sign: 'negative', weight: 0.5, lagDays: 30,
      confidence: 0.75, warrantRefs: ['w'],
    };
    const s = contributionSummary(edge);
    expect(s).toContain('lowers');
    expect(s).toContain('50%');
    expect(s).toContain('30-day');
    expect(s).toContain('75%');
  });

  it('contributionSummary omits optional fields when absent', () => {
    const edge: CausalEdge = {
      id: 'e', type: 'CausalEdge', specVersion: '0.1.0', graphRef: 'g',
      fromRef: 'a', toRef: 'b', sign: 'positive', warrantRefs: ['w'],
    };
    const s = contributionSummary(edge);
    expect(s).toBe('raises');
  });
});

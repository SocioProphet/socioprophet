// Prototype-pollution guard on the causal-graph render helpers.
//
// `snapshot.warrants[ref]` returns Object.prototype members (toString,
// valueOf, __proto__) as if they were warrants — a snapshot whose
// warrantRefs contains 'toString' would render a Function where a
// WarrantSummary is expected, then crash downstream on w.excerpt.… /
// w.sourceDocRef.startsWith(…). PR #474 hardened `assertWellFormed`
// against the same bug; this guards the render helpers.
import { describe, expect, it } from 'vitest';
import { warrantsForEdge, warrantsForHypothesis } from '../features/causal-graph/state';
import type {
  CausalEdge, CausalGraphSnapshot, CausalHypothesis, WarrantSummary,
} from '../features/causal-graph/types';

function snap(overrides: Partial<CausalGraphSnapshot> = {}): CausalGraphSnapshot {
  return {
    graphRef: 'urn:srcos:causal-graph:test',
    displayName: 'test',
    hypotheses: [],
    edges: [],
    warrants: {},
    ...overrides,
  };
}

function edge(warrantRefs: string[]): CausalEdge {
  return {
    id: 'urn:srcos:causal-edge:test',
    type: 'CausalEdge',
    specVersion: '0.1.0',
    graphRef: 'urn:srcos:causal-graph:test',
    fromRef: 'urn:srcos:causal-hypothesis:a',
    toRef: 'urn:srcos:causal-hypothesis:b',
    sign: 'positive',
    warrantRefs,
  };
}

function hypothesis(warrantRefs: string[]): CausalHypothesis {
  return {
    id: 'urn:srcos:causal-hypothesis:test',
    type: 'CausalHypothesis',
    specVersion: '0.1.0',
    graphRef: 'urn:srcos:causal-graph:test',
    label: 'test',
    hypothesis: 'test',
    topics: [],
    claimStatus: 'proposed',
    warrantRefs,
  };
}

const realWarrant: WarrantSummary = {
  id: 'urn:srcos:evidence:real',
  sourceDocRef: 'urn:srcos:doc:real',
  excerpt: 'a real excerpt',
};

describe('warrantsForEdge / warrantsForHypothesis — own-property guard', () => {
  it('returns an empty list when warrantRefs targets a prototype member (toString)', () => {
    const s = snap({ warrants: {} });
    // Bare lookup would resolve to Object.prototype.toString — a Function,
    // not a WarrantSummary. The fix uses hasOwnProperty and drops it.
    expect(warrantsForEdge(s, edge(['toString']))).toEqual([]);
    expect(warrantsForEdge(s, edge(['valueOf']))).toEqual([]);
    expect(warrantsForEdge(s, edge(['__proto__']))).toEqual([]);
    expect(warrantsForHypothesis(s, hypothesis(['toString']))).toEqual([]);
  });

  it('still resolves real own-property warrants', () => {
    const s = snap({ warrants: { 'urn:srcos:evidence:real': realWarrant } });
    expect(warrantsForEdge(s, edge(['urn:srcos:evidence:real']))).toEqual([realWarrant]);
    expect(warrantsForHypothesis(s, hypothesis(['urn:srcos:evidence:real']))).toEqual([realWarrant]);
  });

  it('drops missing refs alongside real ones without polluting the list', () => {
    const s = snap({ warrants: { 'urn:srcos:evidence:real': realWarrant } });
    const out = warrantsForEdge(s, edge(['toString', 'urn:srcos:evidence:real', 'missing']));
    expect(out).toEqual([realWarrant]);
  });
});

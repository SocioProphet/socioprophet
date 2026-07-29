/**
 * TypeScript types mirroring the causal-graph contracts shipped in
 * sourceos-spec PR #209 (CausalHypothesis, CausalEdge) and the MPCC channel
 * envelopes shipped in profit-mpcc #7.
 *
 * These are cockpit-side types — the schemas of record live in sourceos-spec.
 * They mirror the shape so the client can render, drill down, and route
 * without having to re-derive the vocabulary. When either canonical schema
 * bumps, this file bumps to match: parity is enforced by
 * src/__tests__/CausalGraphFixtureShape.test.ts, which asserts every
 * required field of the shipped v0.1 contracts appears on a fixture the
 * cockpit already renders.
 *
 * DELIBERATE OMISSIONS. This is the read-side shape. It carries the
 * signal a viewer needs (label, hypothesis text, warrants, sign, weight,
 * lag, confidence, claim status) and NOT extraction internals (extractor
 * digests, KKO ontology refs, ER cluster refs) — those are payload
 * concerns for the ingest layer, not display concerns. A callable can
 * request the full document; the cockpit view uses this subset.
 */

export type SpecVersion = '0.1.0';

export type ClaimStatus = 'proposed' | 'evidenced' | 'scored';
export type EdgeSign = 'positive' | 'negative';

export interface TopicRef {
  kind: 'literal' | 'template';
  value: string;
}

export interface CausalHypothesis {
  id: string;                    // urn:srcos:causal-hypothesis:...
  type: 'CausalHypothesis';
  specVersion: SpecVersion;
  graphRef: string;              // urn:srcos:causal-graph:...
  label: string;                 // display label — "Tariffs", "Revenue"
  hypothesis: string;            // direction-neutral falsifiable statement
  topics: TopicRef[];
  claimStatus: ClaimStatus;
  warrantRefs: string[];         // urn:srcos:evidence:...
}

export interface CausalEdge {
  id: string;                    // urn:srcos:causal-edge:...
  type: 'CausalEdge';
  specVersion: SpecVersion;
  graphRef: string;
  fromRef: string;               // hypothesis id
  toRef: string;                 // hypothesis id
  sign: EdgeSign;                // polarity lives ONLY here
  weight?: number;               // magnitude in [0,1]
  lagDays?: number;
  confidence?: number;           // in [0,1]
  warrantRefs: string[];         // mandatory + non-empty by contract
}

/**
 * A warrant surfaced in the cockpit. This is what "every surface shows its
 * warrant" (the W11 cockpit-UX register principle) resolves to for the
 * viewer: the id, the source-document reference, and a short human excerpt.
 *
 * The full warrant lives in the evidence-intake-kernel catalog now that
 * `evidence-intake-kernel#1` shipped hash-chained storage; this is the
 * display projection.
 */
export interface WarrantSummary {
  id: string;                    // urn:srcos:evidence:...
  sourceDocRef: string;          // e.g. urn:srcos:doc:asx_gyg_annual_2026
  excerpt: string;               // short human quote
  ledgerChainDigest?: string;    // sha256:... if fetched from the eik chain
}

/** A single graph as rendered in the cockpit — hypotheses + edges + warrant lookup. */
export interface CausalGraphSnapshot {
  graphRef: string;
  displayName: string;
  hypotheses: CausalHypothesis[];
  edges: CausalEdge[];
  warrants: Record<string, WarrantSummary>;
}

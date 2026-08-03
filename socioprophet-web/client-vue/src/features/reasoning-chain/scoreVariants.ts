// Governed variant scorer — the owner's dilution-risk fix, with teeth.
//
// The parse produces many candidate plan variants; a naive "coverage" score
// leaves plan-equivalent variants tied, so selection falls to tie-break order
// (scorer noise) rather than signal. This module encodes four governance rules:
//
//  (1) Collapse plan-equivalent variants (same output/scope → one node) BEFORE
//      scoring. The canonical form of a collapsed node is the ontology default
//      (declaredCanonicalPath / canonicalExecutor), never the most frequent shape.
//  (2) Coverage is normalized per primitive-hop, plus an explicit PARSIMONY term
//      that penalizes redundant hops (a hop that re-covers an already-covered
//      concept, or re-asserts ambient/default scope).
//  (3) Epsilon tie-break is resolved by the DECLARED canonical path, never by
//      raw scorer float noise.
//  (4) precisionAt1() checks the top-1 selection against a logged-question fixture
//      set — the counter-test gate. Maps to the estate's min-n>=30 + Goodhart
//      guards (GKN#9): the seed fixture set here is a gate stub; the corpus must
//      grow to n>=30 before any precision@1 claim is made (tracked follow-up).
//
// This is the annotation→concept-graph→plan derivation's scoring stage: it maps
// the token-tree→KG (regis NLU semantic-role head + span-alignment #27 + HellGraph)
// candidate plans down to a governed, defensible top-1.

export interface ChainStep {
  /** Learned concept label, e.g. ':ContactLists' or 'ContactLists'. */
  concept: string;
  /** Bound primitive/executor, e.g. 'engage:GetContactLists'. */
  executor: string;
  /** Parse-derived hop weight, retained for provenance/display. */
  weight: number;
  /** Source CAT token (action/entity/relation/…). */
  cat: string;
}

export interface RawVariant {
  id?: string;
  text: string;
  chain: ChainStep[];
  /** The parse scorer's own score, kept for faithful display alongside governed. */
  parseScore?: string;
}

export interface ScoringOntology {
  /** Core deliverable concepts — the coverage numerator target. */
  requestedCore: string[];
  /** Default-scope concepts; an explicit hop to one is a redundant (prunable) hop. */
  ambient: string[];
  /** Ontology-declared canonical concept order — canonical form + tie-break authority. */
  declaredCanonicalPath: string[];
  /** Ontology-default executor per concept (canonical form, NOT frequency-derived). */
  canonicalExecutor?: Record<string, string>;
  /** Per-redundant-hop parsimony penalty (default 0.15). */
  parsimonyLambda?: number;
}

export interface ScoredVariant {
  /** Canonical scope signature — the collapsed-group id. */
  key: string;
  /** Canonical member text. */
  text: string;
  coverage: number;
  redundantHops: number;
  /** clamp(coverage - lambda*redundantHops, 0, 1). */
  score: number;
  canonicalChain: ChainStep[];
  /** How many raw variants collapsed into this node. */
  collapsedFrom: number;
  /** Executors pruned as redundant/ambient during canonicalization. */
  prunedExecutors: string[];
  note?: string;
}

export interface ScoreResult {
  ranked: ScoredVariant[];
  top: ScoredVariant | null;
  /** top1.score - top2.score, after dedup + parsimony. */
  margin: number;
  /** Best-minus-next WITHOUT dedup/parsimony — exposes the raw tie. */
  rawMargin: number;
  collapsedFrom: number;
  collapsedTo: number;
}

const EPS = 1e-9;
const DEFAULT_LAMBDA = 0.15;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const isAction = (h: ChainStep): boolean => h.cat === 'action';

/**
 * Prune hops that only re-assert ambient/default scope, UNLESS pruning would
 * remove the sole entity hop (then the ambient concept IS the requested output).
 */
function pruneChain(chain: ChainStep[], ont: ScoringOntology): { pruned: ChainStep[]; prunedOut: ChainStep[] } {
  const ambient = new Set(ont.ambient);
  const nonAmbientEntity = chain.filter((h) => !isAction(h) && !ambient.has(h.concept));
  const pruned: ChainStep[] = [];
  const prunedOut: ChainStep[] = [];
  for (const h of chain) {
    if (!isAction(h) && ambient.has(h.concept) && nonAmbientEntity.length > 0) prunedOut.push(h);
    else pruned.push(h);
  }
  return { pruned, prunedOut };
}

/** Coverage (per requestedCore concept) + count of redundant hops. */
function coverageAndParsimony(chain: ChainStep[], ont: ScoringOntology): { coverage: number; redundant: number } {
  const core = new Set(ont.requestedCore);
  const covered = new Set<string>();
  let redundant = 0;
  for (const h of chain) {
    if (core.has(h.concept) && !covered.has(h.concept)) covered.add(h.concept);
    else redundant++;
  }
  const coverage = core.size === 0 ? 0 : covered.size / core.size;
  return { coverage, redundant };
}

/**
 * Score a single literal chain (coverage - lambda*redundant), WITHOUT dedup or
 * pruning. Used to demonstrate that parsimony alone penalizes a redundant hop:
 * a longer chain carrying a redundant hop scores strictly below the shorter one.
 */
export function scoreChain(chainSteps: ChainStep[], ont: ScoringOntology): { coverage: number; redundant: number; score: number } {
  const { coverage, redundant } = coverageAndParsimony(chainSteps, ont);
  const lambda = ont.parsimonyLambda ?? DEFAULT_LAMBDA;
  return { coverage: +coverage.toFixed(4), redundant, score: +clamp01(coverage - lambda * redundant).toFixed(4) };
}

/** Scope signature of a pruned chain — the collapse key (executor set, ordered). */
function signature(pruned: ChainStep[]): string {
  return Array.from(new Set(pruned.map((h) => h.executor))).sort().join('|');
}

/** Declared-canonical rank of a signature's earliest concept (lower = earlier). */
function declaredRank(chain: ChainStep[], ont: ScoringOntology): number {
  let best = Number.POSITIVE_INFINITY;
  for (const h of chain) {
    const i = ont.declaredCanonicalPath.indexOf(h.concept);
    if (i >= 0 && i < best) best = i;
  }
  return best;
}

/**
 * Rank raw variants by coverage only — NO dedup, NO parsimony. Exposes the tie
 * the governed scorer resolves (raw top-1 margin is 0 when plan-equivalent
 * variants share coverage).
 */
export function rawRank(variants: RawVariant[], ont: ScoringOntology): { coverage: number; text: string }[] {
  return variants
    .map((v) => ({ coverage: coverageAndParsimony(v.chain, ont).coverage, text: v.text }))
    .sort((a, b) => b.coverage - a.coverage);
}

/** Best-minus-next coverage without dedup/parsimony. */
export function rawMargin(variants: RawVariant[], ont: ScoringOntology): number {
  const r = rawRank(variants, ont);
  if (r.length < 2) return r.length === 1 ? r[0].coverage : 0;
  return +(r[0].coverage - r[1].coverage).toFixed(6);
}

/** The governed scorer: dedup → parsimony → declared-path tie-break. */
export function scoreVariants(variants: RawVariant[], ont: ScoringOntology): ScoreResult {
  const lambda = ont.parsimonyLambda ?? DEFAULT_LAMBDA;

  // (1) collapse plan-equivalent variants by pruned scope signature.
  const groups = new Map<string, { members: RawVariant[]; pruned: ChainStep[][]; prunedOut: ChainStep[][] }>();
  for (const v of variants) {
    const { pruned, prunedOut } = pruneChain(v.chain, ont);
    const key = signature(pruned);
    const g = groups.get(key) ?? { members: [], pruned: [], prunedOut: [] };
    g.members.push(v);
    g.pruned.push(pruned);
    g.prunedOut.push(prunedOut);
    groups.set(key, g);
  }

  const scored: ScoredVariant[] = [];
  for (const [key, g] of groups) {
    // Canonical member = fewest ORIGINAL hops (parsimony); canonical form from
    // ontology default, not frequency.
    let ci = 0;
    for (let i = 1; i < g.members.length; i++) {
      if (g.members[i].chain.length < g.members[ci].chain.length) ci = i;
    }
    let canonicalChain = g.pruned[ci];
    if (ont.canonicalExecutor) {
      // Rebuild in declared-path order using ontology-default executors where declared.
      const seen = new Set<string>();
      const rebuilt: ChainStep[] = [];
      for (const h of canonicalChain) {
        if (seen.has(h.concept)) continue;
        seen.add(h.concept);
        const declared = ont.canonicalExecutor[h.concept];
        rebuilt.push(declared ? { ...h, executor: declared } : h);
      }
      canonicalChain = rebuilt;
    }
    const { coverage, redundant } = coverageAndParsimony(canonicalChain, ont);
    const score = clamp01(coverage - lambda * redundant);
    const prunedExecutors = Array.from(new Set(g.prunedOut.flat().map((h) => h.executor)));
    let note: string | undefined;
    if (prunedExecutors.length) note = `canonical — redundant ${prunedExecutors.join(', ')} hop pruned`;
    if (score < 0.15) note = 'flagged for pattern-catalog review';
    scored.push({
      key,
      text: g.members[ci].text,
      coverage: +coverage.toFixed(4),
      redundantHops: redundant,
      score: +score.toFixed(4),
      canonicalChain,
      collapsedFrom: g.members.length,
      prunedExecutors,
      note,
    });
  }

  // (2)/(3) rank by score; epsilon ties broken by DECLARED canonical path, never noise.
  scored.sort((a, b) => {
    if (Math.abs(a.score - b.score) > EPS) return b.score - a.score;
    return declaredRank(a.canonicalChain, ont) - declaredRank(b.canonicalChain, ont);
  });

  const top = scored[0] ?? null;
  const margin = scored.length >= 2 ? +(scored[0].score - scored[1].score).toFixed(6) : top ? top.score : 0;
  return {
    ranked: scored,
    top,
    margin,
    rawMargin: rawMargin(variants, ont),
    collapsedFrom: variants.length,
    collapsedTo: scored.length,
  };
}

// ---- (4) precision@1 counter-test gate ----

export interface LoggedQuestion {
  id: string;
  question: string;
  variants: RawVariant[];
  ontology: ScoringOntology;
  /** The canonical scope signature the governed scorer must select as top-1. */
  goldKey: string;
}

export interface PrecisionResult {
  n: number;
  correct: number;
  precisionAt1: number;
  misses: string[];
  /** True only once the corpus meets the estate min-n>=30 bar (GKN#9). */
  meetsMinN: boolean;
}

export const MIN_N = 30;

export function precisionAt1(fixtures: LoggedQuestion[]): PrecisionResult {
  let correct = 0;
  const misses: string[] = [];
  for (const f of fixtures) {
    const top = scoreVariants(f.variants, f.ontology).top;
    if (top && top.key === f.goldKey) correct++;
    else misses.push(f.id);
  }
  const n = fixtures.length;
  return { n, correct, precisionAt1: n === 0 ? 0 : +(correct / n).toFixed(4), misses, meetsMinN: n >= MIN_N };
}

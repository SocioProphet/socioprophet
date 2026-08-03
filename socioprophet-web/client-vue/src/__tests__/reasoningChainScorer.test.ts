// Teeth for the governed variant scorer. These tests prove the owner's
// dilution-risk fix actually bites: the raw 0.75/0.75 tie in example A collapses
// to a clear top-1 under dedup + parsimony (margin > 0), and a redundant longer
// chain never out-scores a shorter correct one. Maps to the counter-test gate.

import { describe, expect, it } from 'vitest';
import { scoreVariants, scoreChain, rawMargin, precisionAt1 } from '../features/reasoning-chain/scoreVariants';
import { EXAMPLES, LOGGED_QUESTIONS } from '../features/reasoning-chain/examples';

const exA = EXAMPLES[0];
const rawVariants = exA.variants.raw;
const ont = exA.scoring.raw;

describe('scoreVariants — example A (org scoping)', () => {
  it('the raw scorer leaves an exact tie (margin 0.00) — selection is noise', () => {
    // At least two plan-equivalent variants share the top coverage.
    expect(rawMargin(rawVariants, ont)).toBe(0);
  });

  it('dedup collapses plan-equivalent variants (6 raw → 4 canonical nodes)', () => {
    const res = scoreVariants(rawVariants, ont);
    expect(res.collapsedFrom).toBe(6);
    expect(res.collapsedTo).toBe(4);
  });

  it('TEETH: the 0.75/0.75 tie collapses to a CLEAR top-1 (margin > 0)', () => {
    const res = scoreVariants(rawVariants, ont);
    expect(res.rawMargin).toBe(0); // was a tie
    expect(res.margin).toBeGreaterThan(0); // now separated
    expect(res.top?.key).toBe('common:ShowDataMessage|engage:GetContactLists');
    expect(res.top?.text).toBe('Show me contact lists.');
  });

  it('TEETH: the canonical top-1 pruned the redundant Organization hop', () => {
    const res = scoreVariants(rawVariants, ont);
    expect(res.top?.prunedExecutors).toContain('engage:GetOrganization');
    expect(res.top?.canonicalChain.map((h) => h.executor)).toEqual([
      'common:ShowDataMessage',
      'engage:GetContactLists',
    ]);
  });

  it('TEETH: a redundant longer chain does NOT out-score the shorter correct one', () => {
    // V1 = 3 hops (redundant Organization); V4 = 2 hops, minimal & correct.
    const v1 = rawVariants[0];
    const v4 = rawVariants[3];
    const long = scoreChain(v1.chain, ont);
    const short = scoreChain(v4.chain, ont);
    expect(long.redundant).toBeGreaterThan(short.redundant);
    expect(long.score).toBeLessThan(short.score);
  });

  it('flags the degenerate "Contains." plan for pattern-catalog review', () => {
    const res = scoreVariants(rawVariants, ont);
    const contains = res.ranked.find((r) => r.text === 'Contains.');
    expect(contains?.note).toBe('flagged for pattern-catalog review');
  });
});

describe('scoreVariants — tie-break is by DECLARED path, never scorer noise', () => {
  it('an exact score tie is broken by declaredCanonicalPath, not input order', () => {
    // Two single-hop plans with identical coverage/parsimony → exact tie.
    const variants = [
      { text: 'B first in input', chain: [{ concept: 'Beta', executor: 'x:Beta', weight: 1, cat: 'entity' }] },
      { text: 'A first in declared path', chain: [{ concept: 'Alpha', executor: 'x:Alpha', weight: 1, cat: 'entity' }] },
    ];
    const tieOnt = { requestedCore: ['Alpha', 'Beta'], ambient: [], declaredCanonicalPath: ['Alpha', 'Beta'] };
    const res = scoreVariants(variants, tieOnt);
    expect(res.margin).toBe(0); // genuine tie on score
    expect(res.top?.text).toBe('A first in declared path'); // declared path wins
  });
});

describe('precisionAt1 — counter-test gate (seed set)', () => {
  it('selects the gold plan for every seeded logged question', () => {
    const p = precisionAt1(LOGGED_QUESTIONS);
    expect(p.precisionAt1).toBe(1);
    expect(p.misses).toEqual([]);
  });

  it('honestly reports the corpus is below the estate min-n bar (GKN#9)', () => {
    const p = precisionAt1(LOGGED_QUESTIONS);
    expect(p.meetsMinN).toBe(false); // seed set only; corpus must grow to n>=30
  });
});

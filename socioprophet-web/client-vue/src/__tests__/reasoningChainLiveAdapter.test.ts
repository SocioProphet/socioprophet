// Live-chain adapter for the Reasoning Chain Inspector (augments PR #516).
// Proves the ChatTurn → inspector-model transform:
//   - a live turn's plan/retrieval/grounding populate tokens/variants/execution
//     in the SAME Example shape the fixtures produce;
//   - concept LABELS come from the injected live resolver (resolved wins), and a
//     miss falls back gracefully to the KIND (never crashes, never fabricates);
//   - the produced variant feeds the UNCHANGED governed scorer.
import { describe, expect, it } from 'vitest';
import { chatTurnToExample, liveChainsFromTurns, type LiveChain } from '../features/reasoning-chain/chatTurnAdapter';
import { resolveConceptLabel, type ConceptResolver } from '../features/reasoning-chain/conceptResolver';
import { scoreVariants } from '../features/reasoning-chain/scoreVariants';
import type { ChatTurn } from '../composables/useNoeticaChat';

// A mock resolver: only 'organization' resolves; everything else misses → fallback.
const mockResolver: ConceptResolver = {
  resolveLabel: (term) =>
    term.trim().toLowerCase() === 'organization' ? { label: ':Organization', provenance: 'learned' } : null,
};

function assistantTurn(over: Partial<ChatTurn> = {}): ChatTurn {
  return {
    role: 'assistant',
    content: 'I found the 12 contact lists in your org.',
    intentName: 'show-contact-lists',
    plan: {
      capability: 'engage',
      skill: 'GetContactLists',
      steps: [
        { id: 'GetContactLists', label: 'contact lists', status: 'done' },
        { id: 'GetOrganization', label: 'organization', status: 'done' },
      ],
    },
    grounding: { domain: 'engagement', terms: ['organization', 'widgets'], topics: ['Markets'] },
    judgment: { verdict: 'grounded', notes: ['bound to engage primitives'] },
    ...over,
  };
}

const chainOf = (turn: ChatTurn, turnIndex = 1, question = 'show me all contact lists in my org'): LiveChain => ({
  turnIndex,
  question,
  turn,
});

describe('resolveConceptLabel — live resolution + graceful fallback', () => {
  it('resolved label wins (from the live resolver)', () => {
    const r = resolveConceptLabel('organization', 'ENTITY_TYPE', mockResolver);
    expect(r.label).toBe(':Organization');
    expect(r.resolved).toBe(true);
    expect(r.provisional).toBe(false);
    expect(r.provenance).toBe('learned');
  });

  it('a miss falls back to the KIND (provisional, never fabricated)', () => {
    const r = resolveConceptLabel('widgets', 'ENTITY_TYPE', mockResolver);
    expect(r.label).toBe('ENTITY_TYPE'); // the KIND itself, shown as a provisional marker
    expect(r.resolved).toBe(false);
    expect(r.provisional).toBe(true);
  });
});

describe('chatTurnToExample — ChatTurn → inspector Example', () => {
  const ex = chatTurnToExample(chainOf(assistantTurn()), mockResolver);

  it('carries the paired question and a live mode', () => {
    expect(ex.id).toBe('L1');
    expect(ex.question).toBe('show me all contact lists in my org');
    expect(ex.modes).toEqual([{ key: 'live', label: 'Live plan' }]);
  });

  it('builds an annotation tree with an ACTION head + grounding concepts', () => {
    expect(ex.tokens.length).toBeGreaterThanOrEqual(3);
    const head = ex.tokens[0];
    expect(head.dep).toBe('ROOT');
    expect(head.parent).toBeNull();
    expect(head.concepts[0].c).toBe('action');
  });

  it('resolves a known concept label and flags an unknown one as provisional', () => {
    const labels = ex.tokens.flatMap((t) => t.concepts.map((c) => c.l));
    expect(labels).toContain(':Organization');
    // 'widgets' had no resolution → provisional entity concept typed by its KIND.
    const provisionalEntity = ex.tokens
      .flatMap((t) => t.concepts)
      .find((c) => c.provisional === true && c.c === 'entity');
    expect(provisionalEntity).toBeTruthy();
    expect(provisionalEntity!.l).toBe('ENTITY_TYPE');
  });

  it('produces exactly one candidate variant from the real plan (no synthetic ties)', () => {
    const variants = ex.variants.live;
    expect(variants).toHaveLength(1);
    expect(variants[0].chain[0].cat).toBe('action');
    // plan steps become entity hops with capability:stepId executors.
    expect(variants[0].chain.some((h) => h.executor === 'engage:GetContactLists')).toBe(true);
  });

  it('the produced variant feeds the UNCHANGED governed scorer', () => {
    const res = scoreVariants(ex.variants.live, ex.scoring.live);
    expect(res.top).toBeTruthy();
    expect(res.top!.score).toBeGreaterThan(0);
    expect(res.collapsedFrom).toBe(1);
    // action + both resolved-or-provisional step concepts are the requested core.
    expect(ex.scoring.live.requestedCore.length).toBeGreaterThanOrEqual(2);
    expect(ex.scoring.live.ambient).toEqual([]);
  });

  it('maps judgment.verdict → execution status (grounded → resolved)', () => {
    expect(ex.execution.live.status).toBe('resolved');
    expect(ex.execution.live.response).toContain('contact lists');
  });

  it('maps a contradiction verdict to a declared gap', () => {
    const gapEx = chatTurnToExample(
      chainOf(assistantTurn({ judgment: { verdict: 'contradiction', contradictions: [{ statement: 'scope mismatch' }] } })),
      mockResolver,
    );
    expect(gapEx.execution.live.status).toBe('gap');
    expect(gapEx.execution.live.note).toContain('scope mismatch');
  });

  it('an errored turn is a gap; a plain answer with no judgment is resolved', () => {
    const err = chatTurnToExample(chainOf(assistantTurn({ judgment: undefined, error: true, content: '' })), mockResolver);
    expect(err.execution.live.status).toBe('gap');
    const ok = chatTurnToExample(chainOf(assistantTurn({ judgment: undefined })), mockResolver);
    expect(ok.execution.live.status).toBe('resolved');
  });

  it('falls back to plan step labels for tokens when grounding has no terms', () => {
    const noGround = chatTurnToExample(chainOf(assistantTurn({ grounding: undefined })), mockResolver);
    // still has the action head + one concept per plan step
    expect(noGround.tokens.length).toBe(3);
  });
});

describe('liveChainsFromTurns — pairing + streaming filter', () => {
  it('pairs each finalized assistant turn with the preceding question and skips streaming', () => {
    const turns: ChatTurn[] = [
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2' },
      { role: 'assistant', content: '', streaming: true }, // in-flight → excluded
    ];
    const chains = liveChainsFromTurns(turns);
    expect(chains).toHaveLength(1);
    expect(chains[0].turnIndex).toBe(1);
    expect(chains[0].question).toBe('q1');
  });
});

import { describe, expect, it } from 'vitest';
import {
  evaluate, applyAction, ReceiptChain, revokeWarrant, warrantState,
  inScope, purposeMatches, fnv1a, DIGEST_DISCLOSURE,
  type Warrant, type ActionRequest,
} from '../features/delivery/actions';

const NOW = new Date('2026-08-03T12:00:00Z');
const iso = (d: Date) => d.toISOString();

const warrant = (over: Partial<Warrant> = {}): Warrant => ({
  id: 'w-1',
  grantee: 'agent.triage',
  purpose: 'triage aging pull requests',
  scope: ['SocioProphet/socioprophet'],
  permits: ['edit', 'add'],
  issuedAt: '2026-08-01T00:00:00Z',
  expiresAt: '2026-08-10T00:00:00Z',
  budget: 5,
  used: 0,
  revokedAt: null,
  grantedBy: 'mdheller',
  ...over,
});

const req = (over: Partial<ActionRequest> = {}): ActionRequest => ({
  kind: 'edit',
  actor: { kind: 'agent', id: 'agent.triage', warrantId: 'w-1' },
  target: 'SocioProphet/socioprophet',
  purpose: 'triage aging pull requests in the estate',
  at: iso(NOW),
  ...over,
});

describe('the gate refuses — every denial path', () => {
  it('allows a warranted agent inside purpose, scope, budget and time', () => {
    expect(evaluate(req(), [warrant()], NOW).decision).toBe('allow');
  });

  it('denies an agent with no warrant at all', () => {
    const v = evaluate(req({ actor: { kind: 'agent', id: 'agent.triage' } }), [warrant()], NOW);
    expect(v.decision).toBe('deny');
    expect(v.reasons.join()).toContain('without a warrant');
  });

  it('denies when the warrant has expired', () => {
    const v = evaluate(req(), [warrant({ expiresAt: '2026-08-02T00:00:00Z' })], NOW);
    expect(v.decision).toBe('deny');
    expect(v.reasons.join()).toContain('expired');
  });

  it('denies when the warrant has been revoked', () => {
    const v = evaluate(req(), [revokeWarrant(warrant(), iso(NOW))], NOW);
    expect(v.decision).toBe('deny');
    expect(v.reasons.join()).toContain('revoked');
  });

  it('denies when the budget is exhausted', () => {
    const v = evaluate(req(), [warrant({ used: 5, budget: 5 })], NOW);
    expect(v.decision).toBe('deny');
    expect(v.reasons.join()).toContain('exhausted');
  });

  it('denies a target outside scope', () => {
    const v = evaluate(req({ target: 'SomeoneElse/repo' }), [warrant()], NOW);
    expect(v.decision).toBe('deny');
    expect(v.reasons.join()).toContain('outside the warrant scope');
  });

  it('denies an action whose purpose is not covered by the warrant', () => {
    const v = evaluate(req({ purpose: 'delete the release branch' }), [warrant()], NOW);
    expect(v.decision).toBe('deny');
    expect(v.reasons.join()).toContain('purpose');
  });

  it('denies an action kind the warrant does not permit', () => {
    const v = evaluate(req({ kind: 'remove' }), [warrant()], NOW);
    expect(v.decision).toBe('deny');
  });

  it('never lets an agent self-grant delegation or farm-out', () => {
    for (const kind of (['delegate', 'farm-out'] as const)) {
      const v = evaluate(req({ kind, purpose: 'triage aging pull requests now' }),
        [warrant({ permits: ['delegate', 'farm-out', 'edit'] })], NOW);
      expect(v.decision, kind).toBe('deny');
      expect(v.reasons.join()).toContain('self-granted');
    }
  });

  it('requires a human for destructive removal', () => {
    const v = evaluate(req({ kind: 'remove' }), [warrant({ permits: ['remove'] })], NOW);
    expect(v.decision).toBe('deny');
    expect(v.reasons.join()).toContain('requires a human');
  });

  it('asks a human to confirm a destructive action rather than silently doing it', () => {
    const v = evaluate(req({ kind: 'remove', actor: { kind: 'human', id: 'mdheller' } }), [], NOW);
    expect(v.decision).toBe('needs-approval');
  });

  it('denies an action with no stated purpose', () => {
    expect(evaluate(req({ purpose: '  ' }), [warrant()], NOW).decision).toBe('deny');
  });

  it('treats an empty scope as granting nothing, not everything', () => {
    expect(inScope('anything', [])).toBe(false);
    expect(evaluate(req(), [warrant({ scope: [] })], NOW).decision).toBe('deny');
  });

  it('does not honour a wildcard as blanket authority', () => {
    expect(inScope('SocioProphet/socioprophet', ['*'])).toBe(false);
  });
});

describe('human vs agent attribution', () => {
  it('records an agent action as an agent action', () => {
    const chain = new ReceiptChain();
    applyAction(req(), [warrant()], chain, NOW);
    expect(chain.all()[0].actor.kind).toBe('agent');
    expect(chain.all()[0].actor.warrantId).toBe('w-1');
  });

  it('records a human action distinctly and with no warrant', () => {
    const chain = new ReceiptChain();
    applyAction(req({ actor: { kind: 'human', id: 'mdheller' }, kind: 'add' }), [], chain, NOW);
    expect(chain.all()[0].actor.kind).toBe('human');
    expect(chain.all()[0].actor.warrantId).toBeUndefined();
  });
});

describe('receipt chain', () => {
  it('records DENIED actions too — a gate with no record of refusals is unauditable', () => {
    const chain = new ReceiptChain();
    applyAction(req({ actor: { kind: 'agent', id: 'rogue' } }), [warrant()], chain, NOW);
    expect(chain.all()).toHaveLength(1);
    expect(chain.all()[0].decision).toBe('deny');
  });

  it('only spends budget on an allowed action', () => {
    const w = warrant();
    const chain = new ReceiptChain();
    applyAction(req({ target: 'Nope/elsewhere' }), [w], chain, NOW); // denied
    expect(w.used).toBe(0);
    applyAction(req(), [w], chain, NOW); // allowed
    expect(w.used).toBe(1);
  });

  it('verifies an untampered chain', () => {
    const chain = new ReceiptChain();
    applyAction(req(), [warrant()], chain, NOW);
    applyAction(req({ kind: 'add' }), [warrant()], chain, NOW);
    const v = chain.verify();
    expect(v.ok).toBe(true);
    expect(v.detail).toContain('non-cryptographic');
  });

  it('detects an altered receipt', () => {
    const chain = new ReceiptChain();
    applyAction(req(), [warrant()], chain, NOW);
    applyAction(req({ kind: 'add' }), [warrant()], chain, NOW);
    (chain.all()[0] as { purpose: string }).purpose = 'something else entirely';
    const v = chain.verify();
    expect(v.ok).toBe(false);
    expect(v.brokenAt).toBe(1);
  });

  it('links each receipt to its predecessor', () => {
    const chain = new ReceiptChain();
    applyAction(req(), [warrant()], chain, NOW);
    applyAction(req({ kind: 'add' }), [warrant()], chain, NOW);
    expect(chain.all()[1].prev).toBe(chain.all()[0].digest);
  });

  it('states plainly that it is not signed', () => {
    expect(DIGEST_DISCLOSURE).toContain('not signed');
    expect(DIGEST_DISCLOSURE).toContain('NOT against a motivated adversary');
  });

  it('accepts an injected digest so a real deployment can supply a cryptographic one', () => {
    const chain = new ReceiptChain((s) => `sha:${s.length}`);
    applyAction(req(), [warrant()], chain, NOW);
    expect(chain.all()[0].digest.startsWith('sha:')).toBe(true);
    expect(chain.verify().ok).toBe(true);
  });
});

describe('warrant state and purpose binding', () => {
  it('reports each terminal state distinctly', () => {
    expect(warrantState(warrant(), NOW)).toBe('active');
    expect(warrantState(warrant({ revokedAt: iso(NOW) }), NOW)).toBe('revoked');
    expect(warrantState(warrant({ expiresAt: '2026-01-01T00:00:00Z' }), NOW)).toBe('expired');
    expect(warrantState(warrant({ used: 9, budget: 5 }), NOW)).toBe('exhausted');
  });

  it('binds purpose by narrowing, not by overlap', () => {
    expect(purposeMatches('triage aging pull requests in the estate', 'triage aging pull requests')).toBe(true);
    expect(purposeMatches('triage', 'triage aging pull requests')).toBe(false);
    expect(purposeMatches('', 'anything')).toBe(false);
  });

  it('has a stable digest', () => {
    expect(fnv1a('abc')).toBe(fnv1a('abc'));
    expect(fnv1a('abc')).not.toBe(fnv1a('abd'));
  });
});

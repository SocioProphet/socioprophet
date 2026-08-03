// The durable KE-workbench contract: authored assets are versioned + receipted,
// receipts are honestly sealed (never fabricated crypto), human overrides
// supersede while the ledger retains the prior, and the current registries reuse
// the Knowledge Studio KE-contract shapes (consume-not-fork).

import { describe, expect, it } from 'vitest';
import { createKeWorkbench, createPromotionGate } from '../features/knowledge-studio/keWorkbench';
import {
  promoteConceptToDictionaryTerm, overrideConcept, defineRelationType,
} from '../features/reasoning-chain/keAuthorship';

const author = { author: 'charles.peterson@socioprophet.ai', ts: '2026-08-03T00:00:00.000Z' };

describe('KE-workbench durable contract', () => {
  it('the promotion gate seals an HONEST receipt — unsigned, no fabricated crypto', () => {
    const gate = createPromotionGate();
    const receipt = gate.seal({ term: ':OrgUnit', version: 'v1-draft', provenanceClass: 'human_authored' });
    expect(receipt).toContain('unsigned');
    // Never fabricate a signed cryptographic receipt.
    expect(receipt).not.toContain('sha256:');
    expect(receipt).not.toMatch(/\(signed\)/);
  });

  it('appends authored assets into the KE registries as newest-first ledger entries', () => {
    const ke = createKeWorkbench();
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, ke);
    defineRelationType(':RollsUpTo', 'RELATION', 'OrgUnit', 'Organization', author, ke);

    expect(ke.ledger.value).toHaveLength(2);
    expect(ke.ledger.value[0].term).toBe(':RollsUpTo'); // newest-first
    // Reuses the KE-contract shapes, not a forked model.
    expect(ke.dictionaries.value).toHaveLength(1);
    expect(ke.dictionaries.value[0].mappedType).toBe('ORGANIZATION');
    expect(ke.dictionaries.value[0].authored).toBe(true);
    expect(ke.relationTypes.value[0].subject).toBe('OrgUnit');
  });

  it('every appended asset is learned + versioned, never a match rule', () => {
    const ke = createKeWorkbench();
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, ke);
    const rec = ke.ledger.value[0];
    expect(rec.learned).toBe(true);
    expect(rec.matchRule).toBe(false);
    expect(rec.governed).toBe(true);
    expect(rec.version).toBeTruthy();
    expect(rec.receipt).toContain('unsigned');
    expect(rec.origin).toBe('reasoning-chain-inspector');
  });

  it('a superseding authorship shows the latest in the registry while the ledger retains every version', () => {
    const ke = createKeWorkbench();
    // author a term, then re-author the same term with a corrected mapping.
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, ke);
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORG_UNIT', author, ke);

    // registry surfaces only the latest (superseding) asset for the term.
    expect(ke.dictionaries.value).toHaveLength(1);
    expect(ke.dictionaries.value[0].mappedType).toBe('ORG_UNIT');
    // the ledger keeps BOTH versions — nothing is discarded.
    expect(ke.ledger.value.filter((r) => r.term === ':OrgUnit')).toHaveLength(2);
  });

  it('a human override is human-authored and retains the prior learned value as a version', () => {
    const ke = createKeWorkbench();
    const ev = overrideConcept(':OrgUnit', 'ENTITY_TYPE', ':Own', author, ke);
    expect(ev.action).toBe('overwrite');
    expect(ev.provenanceClass).toBe('human_authored');
    expect(ev.priorVersion).toEqual({ value: ':Own', provenanceClass: 'learned', version: 'learned-v0' });
    // the override is recorded durably in the shared ledger.
    expect(ke.ledger.value[0].id).toBe(ev.id);
  });

  it('clear() empties the durable ledger', () => {
    const ke = createKeWorkbench();
    promoteConceptToDictionaryTerm(':A', 'ENTITY_TYPE', 'ORG', author, ke);
    expect(ke.ledger.value).toHaveLength(1);
    ke.clear();
    expect(ke.ledger.value).toHaveLength(0);
    expect(ke.dictionaries.value).toHaveLength(0);
  });
});

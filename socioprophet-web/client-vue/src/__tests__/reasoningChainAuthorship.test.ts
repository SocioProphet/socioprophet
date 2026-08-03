// KE authorship round-trip: promotions are versioned, receipted, learned (not
// match rules), and human overrides supersede the learned value while retaining
// the prior as a version.

import { describe, expect, it } from 'vitest';
import {
  promoteConceptToDictionaryTerm,
  overrideConcept,
  defineRelationType,
  useAuthorshipLedger,
} from '../features/reasoning-chain/keAuthorship';

const author = { author: 'charles.peterson@socioprophet.ai', ts: '2026-08-03T00:00:00.000Z' };

describe('KE authorship', () => {
  it('promotes an annotation to a VERSIONED dictionary term, not a match rule', () => {
    const { event, draft } = promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author);
    expect(event.target).toBe('dictionary_term');
    expect(event.learned).toBe(true);
    expect(event.matchRule).toBe(false); // learn, don't match dictionaries
    expect(event.governed).toBe(true);
    expect(event.version).toBeTruthy();
    expect(event.receipt).toContain('unsigned'); // honest — sealed later by KE workbench
    expect(draft.mappedType).toBe('ORGANIZATION');
    expect(draft.terms).toBe(1);
  });

  it('a human override supersedes the learned value and retains the prior version', () => {
    const event = overrideConcept(':OrgUnit', 'ENTITY_TYPE', ':Own', author);
    expect(event.action).toBe('overwrite');
    expect(event.provenanceClass).toBe('human_authored');
    expect(event.priorVersion).toEqual({ value: ':Own', provenanceClass: 'learned', version: 'learned-v0' });
  });

  it('defines a relation type with subject/object typing', () => {
    const { event, draft } = defineRelationType(':RollsUpTo', 'RELATION', 'OrgUnit', 'Organization', author);
    expect(event.target).toBe('relation_type');
    expect(draft.subject).toBe('OrgUnit');
    expect(draft.object).toBe('Organization');
  });

  it('ledger records newest-first', () => {
    const ledger = useAuthorshipLedger();
    const a = promoteConceptToDictionaryTerm(':A', 'ENTITY_TYPE', 'ORG', author).event;
    const b = promoteConceptToDictionaryTerm(':B', 'ENTITY_TYPE', 'ORG', author).event;
    ledger.record(a);
    ledger.record(b);
    expect(ledger.events.value[0].term).toBe(':B');
    expect(ledger.events.value.length).toBe(2);
  });
});

// Live concept-LABEL resolver for the Reasoning Chain Inspector (augments #516).
// Proves labels are sourced from the LIVE learned surfaces (the induced ontology)
// and the governed KE type registry, with KINDs left to kindVocabulary, and that
// a miss degrades to the KIND rather than fabricating a label.
import { describe, expect, it } from 'vitest';
import {
  createRegistryResolver, resolveConceptLabel, toConceptLabel, useConceptResolver,
} from '../features/reasoning-chain/conceptResolver';
import { useOntology } from '../stores/ontology';

describe('toConceptLabel', () => {
  it('normalizes to :PascalCase and preserves existing governed labels', () => {
    expect(toConceptLabel('Organization')).toBe(':Organization');
    expect(toConceptLabel('MONETARY_VALUE')).toBe(':MonetaryValue');
    expect(toConceptLabel('issued by')).toBe(':IssuedBy');
    expect(toConceptLabel(':AlreadyGoverned')).toBe(':AlreadyGoverned');
  });
});

describe('createRegistryResolver — learned surfaces + governed KE registry', () => {
  const resolver = createRegistryResolver({
    classes: () => [{ label: 'Organization', instances: ['Acme Corp'] }],
    predicates: () => ['issued by'],
    topics: () => ['Markets'],
  });

  it('resolves a learned lexical instance to its induced class label', () => {
    expect(resolver.resolveLabel('Acme Corp', 'ENTITY_TYPE')).toEqual({ label: ':Organization', provenance: 'learned' });
  });

  it('resolves a class label directly', () => {
    expect(resolver.resolveLabel('organization', 'ENTITY_TYPE')?.label).toBe(':Organization');
  });

  it('resolves a learned relation predicate for relation-ish KINDs', () => {
    expect(resolver.resolveLabel('issued by', 'RELATION')?.label).toBe(':IssuedBy');
  });

  it('resolves a learned/observed topic for CONTEXT', () => {
    expect(resolver.resolveLabel('Markets', 'CONTEXT')?.label).toBe(':Markets');
  });

  it('falls through to the governed KE entity-type registry', () => {
    // Empty induced classes → the governed registry (knowledge-studio fixture) resolves it.
    const bare = createRegistryResolver({ classes: () => [], predicates: () => [], topics: () => [] });
    expect(bare.resolveLabel('ORGANIZATION', 'ENTITY_TYPE')?.label).toBe(':Organization');
    expect(bare.resolveLabel('ISSUED_BY', 'RELATION')?.label).toBe(':IssuedBy');
  });

  it('returns null for an unknown term (caller decides the fallback)', () => {
    expect(resolver.resolveLabel('quux', 'ENTITY_TYPE')).toBeNull();
    expect(resolveConceptLabel('quux', 'ENTITY_TYPE', resolver)).toMatchObject({
      label: 'ENTITY_TYPE', resolved: false, provisional: true,
    });
  });
});

describe('useConceptResolver — bound to the live induced ontology', () => {
  it('resolves a term the living ontology has learned from the corpus', () => {
    const ont = useOntology();
    // Induce a learned instance of the ORG class (the schema-on-the-fly loop).
    ont.observe([{ text: 'Globex', class: 'org', confidence: 0.9 }], [], []);
    const resolver = useConceptResolver();
    expect(resolver.resolveLabel('Globex', 'ENTITY_TYPE')?.label).toBe(':Organization');
    // An unseen term stays unresolved → caller falls back to KIND.
    expect(resolveConceptLabel('nevermentioned', 'ENTITY_TYPE', resolver).provisional).toBe(true);
  });
});

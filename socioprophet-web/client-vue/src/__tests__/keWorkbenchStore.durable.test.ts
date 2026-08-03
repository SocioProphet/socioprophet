// The DURABLE KE-workbench backend: same contract as keWorkbench.test.ts, but
// proven against the persisted store. It locks the four invariants AND the thing
// the in-memory reference cannot: a round-trip through durable storage
// (persist → hydrate) preserves the version chain, the latest-per-term views, the
// honestly-unsigned receipts, and the provenance class on every record.
//
// CONSUME-NOT-FORK: authored assets are the Knowledge Studio KE-contract shapes
// (Dictionary / EntityType / RelationType) — the durable store persists the same
// AuthoredAsset envelopes the reference impl produces, not a forked model.

import { describe, expect, it } from 'vitest';
import {
  createDurableKeWorkbench, memoryStorage, resolveDurableKeWorkbench,
  __resetDurableInstances, type KeStorage,
} from '../features/knowledge-studio/keWorkbenchStore.durable';
import { createPromotionGate } from '../features/knowledge-studio/keWorkbench';
import {
  promoteConceptToDictionaryTerm, overrideConcept, defineRelationType,
} from '../features/reasoning-chain/keAuthorship';

const author = { author: 'charles.peterson@socioprophet.ai', ts: '2026-08-03T00:00:00.000Z' };

/** Peek the persisted rows for a scope — proves durability + the version chain. */
function readRows(storage: KeStorage, projectId: string) {
  const raw = storage.getItem(`sp-ke-workbench-v1::${projectId}`);
  return raw ? (JSON.parse(raw).rows as Array<{ durableId: string; alias: string; supersedes: string | null; record: any }>) : [];
}

describe('KE-workbench durable store — contract invariants', () => {
  it('INVARIANT 3 — the gate seals an HONEST receipt: unsigned, no fabricated crypto', () => {
    const ke = createDurableKeWorkbench({ projectId: 'p1', storage: memoryStorage() });
    const receipt = ke.gate.seal({ term: ':OrgUnit', version: 'v1-draft', provenanceClass: 'human_authored' });
    expect(receipt).toContain('unsigned');
    expect(receipt).not.toContain('sha256:');
    expect(receipt).not.toMatch(/\(signed\)/);
    // and it is the SAME honest gate the reference contract ships.
    expect(createPromotionGate().seal({ term: ':x', version: 'v1', provenanceClass: 'learned' })).toContain('unsigned');
  });

  it('appends authored assets into the KE registries as newest-first ledger entries', () => {
    const ke = createDurableKeWorkbench({ projectId: 'p1', storage: memoryStorage() });
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

  it('INVARIANT 1 — every appended asset is learned + versioned, never a match rule', () => {
    const ke = createDurableKeWorkbench({ projectId: 'p1', storage: memoryStorage() });
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, ke);
    const rec = ke.ledger.value[0];
    expect(rec.learned).toBe(true);
    expect(rec.matchRule).toBe(false);
    expect(rec.governed).toBe(true);
    expect(rec.version).toBeTruthy();
    expect(rec.receipt).toContain('unsigned');
    expect(rec.origin).toBe('reasoning-chain-inspector');
  });

  it('INVARIANT 2 — a supersede shows the latest in the registry while the ledger retains every version', () => {
    const ke = createDurableKeWorkbench({ projectId: 'p1', storage: memoryStorage() });
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, ke);
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORG_UNIT', author, ke);

    expect(ke.dictionaries.value).toHaveLength(1);
    expect(ke.dictionaries.value[0].mappedType).toBe('ORG_UNIT'); // latest wins
    expect(ke.ledger.value.filter((r) => r.term === ':OrgUnit')).toHaveLength(2); // both retained
  });

  it('INVARIANT 2 — a human override is human-authored and retains the prior learned value', () => {
    const ke = createDurableKeWorkbench({ projectId: 'p1', storage: memoryStorage() });
    const ev = overrideConcept(':OrgUnit', 'ENTITY_TYPE', ':Own', author, ke);
    expect(ev.action).toBe('overwrite');
    expect(ev.provenanceClass).toBe('human_authored');
    expect(ev.priorVersion).toEqual({ value: ':Own', provenanceClass: 'learned', version: 'learned-v0' });
    // recorded durably in the shared ledger; id stays the consumer's opaque alias.
    expect(ke.ledger.value[0].id).toBe(ev.id);
  });

  it('clear() empties the durable ledger AND the persisted store', () => {
    const storage = memoryStorage();
    const ke = createDurableKeWorkbench({ projectId: 'p1', storage });
    promoteConceptToDictionaryTerm(':A', 'ENTITY_TYPE', 'ORG', author, ke);
    expect(ke.ledger.value).toHaveLength(1);
    ke.clear();
    expect(ke.ledger.value).toHaveLength(0);
    expect(ke.dictionaries.value).toHaveLength(0);
    expect(readRows(storage, 'p1')).toHaveLength(0);
  });
});

describe('KE-workbench durable store — round-trip persist → hydrate', () => {
  it('a fresh instance over the same store hydrates the full history newest-first', () => {
    const storage = memoryStorage();
    const s1 = createDurableKeWorkbench({ projectId: 'proj-42', storage });
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, s1);
    defineRelationType(':RollsUpTo', 'RELATION', 'OrgUnit', 'Organization', author, s1);

    // NEW session: a brand-new instance backed by the SAME durable store.
    const s2 = createDurableKeWorkbench({ projectId: 'proj-42', storage });
    expect(s2.ledger.value).toHaveLength(2);
    expect(s2.ledger.value[0].term).toBe(':RollsUpTo'); // newest-first preserved
    expect(s2.ledger.value[1].term).toBe(':OrgUnit');
  });

  it('round-trip preserves latest-per-term views, unsigned receipts, and provenance class', () => {
    const storage = memoryStorage();
    const s1 = createDurableKeWorkbench({ projectId: 'proj-42', storage });
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, s1);
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORG_UNIT', author, s1); // supersede

    const s2 = createDurableKeWorkbench({ projectId: 'proj-42', storage });
    // latest-per-term survived hydration.
    expect(s2.dictionaries.value).toHaveLength(1);
    expect(s2.dictionaries.value[0].mappedType).toBe('ORG_UNIT');
    // full history survived.
    expect(s2.ledger.value.filter((r) => r.term === ':OrgUnit')).toHaveLength(2);
    // every hydrated record keeps its honest receipt + provenance class.
    for (const rec of s2.ledger.value) {
      expect(rec.receipt).toContain('unsigned');
      expect(rec.receipt).not.toContain('sha256:');
      expect(rec.provenanceClass).toBeTruthy();
      expect(['learned', 'human_authored']).toContain(rec.provenanceClass);
    }
  });

  it('round-trip preserves the explicit version chain (supersedes links) on disk', () => {
    const storage = memoryStorage();
    const s1 = createDurableKeWorkbench({ projectId: 'proj-42', storage });
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORGANIZATION', author, s1);
    promoteConceptToDictionaryTerm(':OrgUnit', 'ENTITY_TYPE', 'ORG_UNIT', author, s1);

    const rows = readRows(storage, 'proj-42');
    expect(rows).toHaveLength(2);
    // oldest-first on disk: first row starts a chain, second supersedes the first.
    expect(rows[0].supersedes).toBeNull();
    expect(rows[1].supersedes).toBe(rows[0].durableId);
    // durable ids are minted + distinct; the consumer's alias is retained.
    expect(rows[0].durableId).not.toBe(rows[1].durableId);
    expect(rows[0].alias).toBe(rows[0].record.id);
  });

  it('a human override survives the round-trip retaining its prior learned version', () => {
    const storage = memoryStorage();
    const s1 = createDurableKeWorkbench({ projectId: 'proj-42', storage });
    overrideConcept(':OrgUnit', 'ENTITY_TYPE', ':Own', author, s1);

    const s2 = createDurableKeWorkbench({ projectId: 'proj-42', storage });
    const rec = s2.ledger.value[0];
    expect(rec.action).toBe('overwrite');
    expect(rec.provenanceClass).toBe('human_authored');
    expect(rec.priorVersion).toEqual({ value: ':Own', provenanceClass: 'learned', version: 'learned-v0' });
  });
});

describe('KE-workbench durable store — project scoping', () => {
  it('rows are keyed per project — two projects do not bleed into each other', () => {
    const storage = memoryStorage();
    const a = createDurableKeWorkbench({ projectId: 'proj-A', storage });
    const b = createDurableKeWorkbench({ projectId: 'proj-B', storage });
    promoteConceptToDictionaryTerm(':OnlyInA', 'ENTITY_TYPE', 'ORGANIZATION', author, a);

    expect(a.ledger.value).toHaveLength(1);
    expect(b.ledger.value).toHaveLength(0);
    // a fresh instance for B still sees nothing; for A sees the one asset.
    expect(createDurableKeWorkbench({ projectId: 'proj-B', storage }).ledger.value).toHaveLength(0);
    expect(createDurableKeWorkbench({ projectId: 'proj-A', storage }).ledger.value).toHaveLength(1);
  });

  it('resolveDurableKeWorkbench returns ONE shared instance per scope (the bind point)', () => {
    __resetDurableInstances();
    const first = resolveDurableKeWorkbench('proj-shared');
    const second = resolveDurableKeWorkbench('proj-shared');
    expect(second).toBe(first); // Inspector + Studio bind to the same instance
    promoteConceptToDictionaryTerm(':Shared', 'ENTITY_TYPE', 'ORGANIZATION', author, first);
    expect(second.ledger.value).toHaveLength(1); // writes through the shared seam
    __resetDurableInstances();
  });

  it('falls back to a session scope when there is no project context', () => {
    const storage = memoryStorage();
    const ke = createDurableKeWorkbench({ projectId: null, storage });
    promoteConceptToDictionaryTerm(':Sessioned', 'ENTITY_TYPE', 'ORGANIZATION', author, ke);
    expect(readRows(storage, '__session__')).toHaveLength(1);
  });
});

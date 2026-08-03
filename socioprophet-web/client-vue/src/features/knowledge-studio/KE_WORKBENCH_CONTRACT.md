# KE-workbench durable authorship contract — handoff

**Status:** consumer-side interface pinned by the Reasoning Chain Inspector
(`feat/reasoning-chain-inspector`, PR #516 + the rewire on `claude/infallible-haibt-6a4338`).
The durable store is **owned by the KE-workbench agent** and not yet landed. This
doc is the seam both sides converge on so the durable store swaps in behind the
same interface **with no caller change**.

Source of truth for the types: [`keWorkbench.ts`](./keWorkbench.ts). This file is
the prose spec + the decisions the two sides still need to agree on.

---

## Who consumes it

- **Writer** — `features/reasoning-chain/keAuthorship.ts` (the five hooks:
  `buildAuthorshipEvent`, `promoteConceptToDictionaryTerm`, `defineEntityType`,
  `defineRelationType`, `overrideConcept`). Each builds a contract record and
  calls `ke.append(record)`.
- **Reader** — `pages/KnowledgeStudio.vue` reads `ke.dictionaries`,
  `ke.entityTypes`, `ke.relationTypes`, `ke.ledger` and merges authored assets
  ahead of the seeded registries as develop-stage inputs.
- **Bind point** — both call `useKeWorkbench()`, a session-scoped reactive
  singleton. **This is the exact function the durable store replaces.**

## The interface (do not fork)

```ts
// Reuses the Knowledge Studio KE-contract shapes — NOT a parallel data model.
type AuthoredShape = Dictionary | EntityType | RelationType; // from ./fixture

interface AuthoredAsset {
  id: string;
  action: 'add' | 'overwrite' | 'annotate' | 'define';
  target: 'entity_type' | 'relation_type' | 'dictionary_term' | 'rule';
  term: string;                 // e.g. ':OrgUnit'
  kind: string;                 // governed KIND (regis-entity-graph#22)
  mappedType?: string;          // KE type it maps to, e.g. 'ORGANIZATION'
  author: string;
  ts: string;                   // ISO-8601
  version: string;
  priorVersion?: { value: string; provenanceClass: ProvenanceClass; version: string };
  provenanceClass: 'learned' | 'human_authored';
  governed: true; learned: true; matchRule: false;   // learn, don't match
  origin: string;               // 'reasoning-chain-inspector'
  receipt: string;              // sealed by the promotion gate; honest + unsigned
  note?: string;
  asset?: AuthoredShape;        // the KE-contract shape this authored
}

interface PromotionGate {
  seal(input: { term: string; version: string; provenanceClass: ProvenanceClass }): string;
}

interface KeWorkbench {
  ledger: Ref<AuthoredAsset[]>;            // full version history, newest-first
  dictionaries: ComputedRef<Dictionary[]>; // latest per term (supersede applied)
  entityTypes: ComputedRef<EntityType[]>;
  relationTypes: ComputedRef<RelationType[]>;
  gate: PromotionGate;
  append(record: AuthoredAsset): AuthoredAsset;
  clear(): void;
}
```

## Invariants the durable store MUST preserve

1. **Learn, don't match.** Every appended asset is `learned: true`,
   `matchRule: false`, and carries a `version`. Nothing authored here is a static
   match rule.
2. **Human overrides supersede; the prior is retained.** `append` never mutates
   or deletes a prior record. The current registries (`dictionaries`/
   `entityTypes`/`relationTypes`) surface the **latest asset-bearing record per
   `term`**; `ledger` retains **every** version. `priorVersion` on an override
   carries the superseded learned value.
3. **Honest receipts.** `gate.seal()` returns a governance seal that is
   **explicitly unsigned** (the reference impl returns a string containing
   `unsigned (no crypto provenance)`). It **must never** fabricate a
   `sha256:…(signed)`-style receipt. Only a real signer (the
   model-governance-ledger) may mint a signed receipt, and only later.
4. **Provenance class travels with the record** and is rendered on the tag and in
   the ledger (`learned` ◐ vs `human_authored` ✎).

## Decisions the two sides need to agree on

The reference impl (`createKeWorkbench`) is a session-scoped reactive singleton.
The durable store should match the interface above; these are the open points:

1. **Scope / keying.** Per-project? Per-estate? The singleton is currently
   global-per-session. If the durable store is project-scoped, `useKeWorkbench()`
   should take/derive the project id (the active-project store already exists).
2. **`id` scheme.** Reference uses `${target}-${seq}` (session-local monotonic).
   The durable store should mint stable, collision-free ids (uuid / content hash).
   Consumers treat `id` as opaque.
3. **Supersede → durable rows.** Reference derives "latest per term" by scanning a
   newest-first array. A durable store may prefer an explicit version chain
   (`supersedes: id`). Either is fine **as long as** the `dictionaries` /
   `entityTypes` / `relationTypes` views still return latest-per-term and `ledger`
   still exposes the full history newest-first.
4. **Receipt sealing authority.** Confirm the gate stays honestly-unsigned at
   author time and that signing is a **separate, later** promotion step owned by
   the governance ledger — not the gate.
5. **Reactivity contract.** Consumers rely on Vue `Ref`/`ComputedRef`
   reactivity. A remote-backed store must expose reactive refs (e.g. hydrate into
   refs on load + on push) so `KnowledgeStudio.vue` updates live.

## Swap-in checklist (no caller change)

- [ ] Implement `KeWorkbench` (or make `createKeWorkbench` delegate to the store).
- [ ] Keep `useKeWorkbench()` as the single bind point; return the durable-backed
      instance.
- [ ] Preserve the four invariants above (covered by
      `src/__tests__/keWorkbench.test.ts` — keep it green).
- [ ] Confirm `AuthoredAsset` / `PromotionGate` field names unchanged, or land the
      rename in the same PR that updates `keAuthorship.ts`.

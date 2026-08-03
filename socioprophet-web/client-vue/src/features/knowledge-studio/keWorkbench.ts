// Durable KE-workbench authorship contract.
//
// This is the seam the Reasoning Chain Inspector writes THROUGH and the Knowledge
// Studio loop reads FROM. It replaces the inspector's private in-memory unsigned
// ledger with a single, session-durable, versioned + receipted append surface.
//
// CONSUME-NOT-FORK: an authored asset IS a Knowledge Studio KE-contract shape
// (EntityType | RelationType | Dictionary from ./fixture) — there is no parallel
// authorship data model. This module owns the *append surface*, the *version
// chain*, and the *promotion gate*; the concurrent KE-workbench agent's durable
// store swaps in behind this same interface. The reactive singleton below is the
// session-durable stand-in until that store lands (tracked follow-up @mdheller).
//
// INTERFACE HANDOFF: the seam, invariants, and the decisions the durable store
// must converge on are pinned in ./KE_WORKBENCH_CONTRACT.md. Change the shapes
// here and there together — this file is the source of truth for the types.
//
// Estate rules honored (see also features/reasoning-chain/keAuthorship.ts):
//   - "learn, don't match dictionaries": every appended asset is LEARNED +
//     VERSIONED, never a static match rule (`matchRule: false`, `learned: true`).
//   - Human overrides SUPERSEDE the learned value; the prior is retained as a
//     version — the current registries surface the latest, the ledger keeps all.
//   - No fabricated cryptographic provenance: the promotion gate seals an HONEST
//     receipt (a governance seal that states, in the clear, that it is unsigned).

import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { Dictionary, EntityType, RelationType } from './fixture';
// Durable backend selected at the single bind point (`useKeWorkbench`, below).
// Function-declaration exports on both sides keep this import cycle safe (hoisted).
import { resolveDurableKeWorkbench } from './keWorkbenchStore.durable';

/** A learned label vs a human-authored override. Human overrides supersede. */
export type ProvenanceClass = 'learned' | 'human_authored';

export type AuthorshipAction = 'add' | 'overwrite' | 'annotate' | 'define';
export type AuthorshipTarget = 'entity_type' | 'relation_type' | 'dictionary_term' | 'rule';

/** The value a human override supersedes — retained, never discarded. */
export interface AuthorshipVersionRef {
  value: string;
  provenanceClass: ProvenanceClass;
  version: string;
}

/** The KE-contract shape an authored asset carries (never a forked shape). */
export type AuthoredShape = Dictionary | EntityType | RelationType;

/**
 * A durable, versioned, receipted authorship record. The `asset` is a KE-contract
 * shape; the record is the governance envelope the KE contract wraps around it.
 */
export interface AuthoredAsset {
  id: string;
  action: AuthorshipAction;
  target: AuthorshipTarget;
  /** The concept/term being authored, e.g. ':OrgUnit'. */
  term: string;
  /** Governed KIND the term is typed as (regis-entity-graph#22 vocabulary). */
  kind: string;
  /** For dictionary terms / relations: the KE type it maps to (e.g. 'ORGANIZATION'). */
  mappedType?: string;
  author: string;
  ts: string;
  version: string;
  /** Human authorship supersedes learned; the prior is retained here. */
  priorVersion?: AuthorshipVersionRef;
  provenanceClass: ProvenanceClass;
  /** Governance flags — a term is LEARNED + versioned, never a match rule. */
  governed: true;
  learned: true;
  matchRule: false;
  /** Where the authorship originated (e.g. 'reasoning-chain-inspector'). */
  origin: string;
  /** Honest receipt sealed by the promotion gate — unsigned, no crypto fabricated. */
  receipt: string;
  /** Free-text rationale captured from the author. */
  note?: string;
  /** The KE-contract shape this authored, when the action produced one. */
  asset?: AuthoredShape;
}

/**
 * The promotion gate that seals an authored draft. It is HONEST: it records a
 * governance seal and NEVER fabricates cryptographic provenance (no fake
 * `sha256:…(signed)`). Sealed receipts state, in the clear, that they are unsigned
 * — a real signer (the model-governance ledger) is the only thing that may sign.
 */
export interface PromotionGate {
  seal(input: { term: string; version: string; provenanceClass: ProvenanceClass }): string;
}

/** Build an honest promotion gate with a monotonic seal counter. */
export function createPromotionGate(): PromotionGate {
  let seq = 0;
  return {
    seal({ version }) {
      seq += 1;
      // Honest by construction: sealed by the gate, but explicitly unsigned. A
      // signed receipt can only be minted by a real signer, never fabricated here.
      return `promotion-gate seal ke-wb#${seq} · ${version} · unsigned (no crypto provenance)`;
    },
  };
}

/** The append surface + read views both surfaces share. */
export interface KeWorkbench {
  /** Full versioned authorship ledger, newest-first. Durable within the session. */
  ledger: Ref<AuthoredAsset[]>;
  /** Current authored dictionaries — latest per term (supersede applied). */
  dictionaries: ComputedRef<Dictionary[]>;
  /** Current authored entity types — latest per term. */
  entityTypes: ComputedRef<EntityType[]>;
  /** Current authored relation types — latest per term. */
  relationTypes: ComputedRef<RelationType[]>;
  gate: PromotionGate;
  /** Append a record (optionally with its KE-contract asset) durably. */
  append(record: AuthoredAsset): AuthoredAsset;
  clear(): void;
}

/** Latest asset per term for a target — newest-first ledger means first wins. */
function latest<T extends AuthoredShape>(ledger: AuthoredAsset[], target: AuthorshipTarget): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of ledger) {
    if (r.target !== target || !r.asset) continue;
    if (seen.has(r.term)) continue; // an earlier (older) version is superseded
    seen.add(r.term);
    out.push(r.asset as T);
  }
  return out;
}

/**
 * Create a fresh KE-workbench instance. Use `useKeWorkbench()` for the shared
 * singleton that binds the inspector and the Knowledge Studio loop together.
 */
export function createKeWorkbench(): KeWorkbench {
  const ledger = ref<AuthoredAsset[]>([]);
  return {
    ledger,
    dictionaries: computed(() => latest<Dictionary>(ledger.value, 'dictionary_term')),
    entityTypes: computed(() => latest<EntityType>(ledger.value, 'entity_type')),
    relationTypes: computed(() => latest<RelationType>(ledger.value, 'relation_type')),
    gate: createPromotionGate(),
    append(record) {
      ledger.value = [record, ...ledger.value];
      return record;
    },
    clear() {
      ledger.value = [];
    },
  };
}

// Shared bind point between the Reasoning Chain Inspector (writes) and the
// Knowledge Studio loop (reads). The durable store now backs this seam: it is
// project-scoped, persisted client-side (localStorage), and hydrates into the
// same reactive refs — swapped in behind this SAME interface with no caller
// change. `createKeWorkbench()` above stays the pure in-memory reference impl
// (the locked contract test drives it directly); the durable wiring lives in
// ./keWorkbenchStore.durable.ts and is selected here — the single wiring point.
export function useKeWorkbench(): KeWorkbench {
  return resolveDurableKeWorkbench();
}

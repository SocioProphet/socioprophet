// Knowledge-Engineering authorship round-trip for the Reasoning Chain Inspector.
//
// The inspector is not read-only: from the annotation view a user can add /
// overwrite / annotate / define entity types, relation types, dictionary terms
// and rules. Each action emits a GOVERNED authorship record — versioned,
// author-attributed, and receipted — into the durable KE-workbench contract.
//
// Estate rules honored:
//   - "learn, don't match dictionaries": a promoted term becomes a VERSIONED,
//     provenance-carrying dictionary entry (learned + governed), never a static
//     match rule. Every record carries `matchRule: false` + `learned: true`.
//   - Human overrides SUPERSEDE the learned value; the prior is retained as a
//     version (`priorVersion`), never discarded.
//   - No fabricated cryptographic provenance (AGENTS.md): new human authorship is
//     honestly UNSIGNED — the promotion gate seals an honest receipt; only a real
//     signer may ever sign.
//
// CONSUME-NOT-FORK: this module holds NO authorship data model of its own. The
// record shape, the version chain, the promotion gate and the durable append
// surface are all owned by the KE-workbench contract
// (features/knowledge-studio/keWorkbench.ts), which in turn reuses the Knowledge
// Studio KE-contract shapes (EntityType, RelationType, Dictionary). This file is
// the emit surface: the five hooks below build a contract record and, when handed
// the workbench, append it durably so it becomes an input to the Knowledge Studio
// loop. The concurrent KE-workbench agent's durable store swaps in behind the
// same interface with no change here.

import type { Dictionary, EntityType, RelationType } from '../knowledge-studio/fixture';
import {
  createKeWorkbench, createPromotionGate, type AuthoredAsset, type AuthorshipAction,
  type AuthorshipTarget, type AuthorshipVersionRef, type KeWorkbench, type PromotionGate,
} from '../knowledge-studio/keWorkbench';
import type { AnnotationKind } from './kindVocabulary';

// Re-export the contract's authorship types so existing consumers keep importing
// them from here (the reasoning-chain emit surface) without knowing where the
// durable contract lives.
export type {
  AuthoredAsset, AuthorshipAction, AuthorshipTarget, AuthorshipVersionRef, ProvenanceClass,
} from '../knowledge-studio/keWorkbench';

/** An authorship record is a KE-workbench contract record — not a forked shape. */
export type AuthorshipEvent = AuthoredAsset;

// A fallback gate for PURE builds (no workbench handed in). It seals an honest,
// unsigned receipt exactly like the durable one — it simply isn't wired to a
// durable ledger. Durable callers pass `ke.gate` instead (see the hooks below).
const fallbackGate: PromotionGate = createPromotionGate();

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export interface AuthorInput {
  author: string;
  /** ISO timestamp; injectable for deterministic tests. */
  ts?: string;
  note?: string;
  /** The value being superseded, if this is a human override of a learned label. */
  prior?: AuthorshipVersionRef;
}

/**
 * Build a governed authorship record (pure — testable; no side effects). The
 * receipt is sealed by the promotion gate; honest and unsigned by construction.
 */
export function buildAuthorshipEvent(
  action: AuthorshipAction,
  target: AuthorshipTarget,
  term: string,
  kind: AnnotationKind,
  input: AuthorInput,
  mappedType?: string,
  gate: PromotionGate = fallbackGate,
): AuthorshipEvent {
  const version = 'v1-draft';
  return {
    id: nextId(target),
    action,
    target,
    term,
    kind,
    mappedType,
    author: input.author,
    ts: input.ts ?? new Date().toISOString(),
    version,
    priorVersion: input.prior,
    // Any authorship action taken by a person is human-authored provenance; a
    // prior learned value (if superseded) is retained in `priorVersion`.
    provenanceClass: 'human_authored',
    governed: true,
    learned: true,
    matchRule: false,
    origin: 'reasoning-chain-inspector',
    receipt: gate.seal({ term, version, provenanceClass: 'human_authored' }),
    note: input.note,
  };
}

/** Append a built record to the workbench if one is provided, then return it. */
function emit(event: AuthorshipEvent, ke?: KeWorkbench): AuthorshipEvent {
  ke?.append(event);
  return event;
}

/**
 * Promote a learned annotation concept into a versioned dictionary term. Builds a
 * Dictionary-shaped asset (the KE contract) plus its authorship record, and — when
 * a workbench is handed in — appends it durably so it enters the Knowledge Studio
 * loop. The dictionary is a governed + learned + versioned term set, NOT a match rule.
 */
export function promoteConceptToDictionaryTerm(
  concept: string,
  kind: AnnotationKind,
  mappedType: string,
  input: AuthorInput,
  ke?: KeWorkbench,
): { event: AuthorshipEvent; draft: Dictionary } {
  const event = buildAuthorshipEvent('add', 'dictionary_term', concept, kind, input, mappedType, ke?.gate);
  const draft: Dictionary = {
    name: `${concept} (authored)`,
    terms: 1,
    mappedType,
    source: `reasoning-chain-inspector · ${input.author}`,
    licence: 'owned',
    authored: true,
    receipt: event.receipt,
  };
  event.asset = draft;
  return { event: emit(event, ke), draft };
}

/** Define a new entity type from an annotation (KE Assets → Entity Types). */
export function defineEntityType(
  concept: string,
  kind: AnnotationKind,
  input: AuthorInput,
  ke?: KeWorkbench,
): { event: AuthorshipEvent; draft: EntityType } {
  const event = buildAuthorshipEvent('define', 'entity_type', concept, kind, input, undefined, ke?.gate);
  const draft: EntityType = {
    name: concept, color: 'var(--accent)', mentions: 0, f1: null, valueKind: 'derived', roles: '',
    authored: true, receipt: event.receipt,
  };
  event.asset = draft;
  return { event: emit(event, ke), draft };
}

/** Define a new relation type from an annotation (KE Assets → Relation Types). */
export function defineRelationType(
  concept: string,
  kind: AnnotationKind,
  subject: string,
  object: string,
  input: AuthorInput,
  ke?: KeWorkbench,
): { event: AuthorshipEvent; draft: RelationType } {
  const event = buildAuthorshipEvent('define', 'relation_type', concept, kind, input, undefined, ke?.gate);
  const draft: RelationType = {
    name: concept, subject, object, instances: 0, f1: null, authored: true, receipt: event.receipt,
  };
  event.asset = draft;
  return { event: emit(event, ke), draft };
}

/**
 * Overwrite a learned concept label with a human-authored value. The learned
 * value is retained as a prior version and the new record supersedes it — in the
 * workbench, the current registry surfaces the latest while the ledger keeps both.
 */
export function overrideConcept(
  concept: string,
  kind: AnnotationKind,
  learnedPrior: string,
  input: Omit<AuthorInput, 'prior'>,
  ke?: KeWorkbench,
): AuthorshipEvent {
  const event = buildAuthorshipEvent('overwrite', 'dictionary_term', concept, kind, {
    ...input,
    prior: { value: learnedPrior, provenanceClass: 'learned', version: 'learned-v0' },
  }, undefined, ke?.gate);
  return emit(event, ke);
}

/**
 * Back-compat thin ledger. Now backed by a fresh KE-workbench instance so it
 * shares the durable contract's shape and semantics. Prefer `useKeWorkbench()`
 * (the shared singleton) when authored assets should reach the Knowledge Studio
 * loop; this per-caller instance is isolated.
 */
export interface AuthorshipLedger {
  events: KeWorkbench['ledger'];
  record: (e: AuthorshipEvent) => void;
  clear: () => void;
}
export function useAuthorshipLedger(): AuthorshipLedger {
  const ke = createKeWorkbench();
  return {
    events: ke.ledger,
    record: (e) => { ke.append(e); },
    clear: ke.clear,
  };
}

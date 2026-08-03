// Knowledge-Engineering authorship round-trip for the Reasoning Chain Inspector.
//
// The inspector is not read-only: from the annotation view a user can add /
// overwrite / annotate / define entity types, relation types, dictionary terms
// and rules. Each action emits a GOVERNED authorship event — versioned,
// author-attributed, and receipted — into the KE/dictionary workbench contract.
//
// Estate rules honored:
//   - "learn, don't match dictionaries": a promoted term becomes a VERSIONED,
//     provenance-carrying dictionary entry (learned + governed), never a static
//     match rule. Every event carries `matchRule: false` + `learned: true`.
//   - Human overrides SUPERSEDE the learned value; the prior is retained as a
//     version (`priorVersion`), never discarded.
//   - No fabricated cryptographic provenance (AGENTS.md): new human authorship is
//     honestly UNSIGNED — the promotion gate / KE workbench seals it later.
//
// CONSUME-NOT-FORK: the event shapes mirror the live Knowledge Studio KE contract
// (features/knowledge-studio/fixture.ts: EntityType, RelationType, Dictionary,
// Version). The concurrent KE-workbench agent owns the durable authorship
// contract; this module is the local emit surface + the exact hooks to rewire to
// that contract when it lands (tracked follow-up @mdheller). No live/shared write
// happens here — events are held in an in-memory ledger and surfaced in the UI.

import { ref, type Ref } from 'vue';
import type { Dictionary, EntityType, RelationType } from '../knowledge-studio/fixture';
import type { AnnotationKind, ProvenanceClass } from './kindVocabulary';

export type AuthorshipAction = 'add' | 'overwrite' | 'annotate' | 'define';
export type AuthorshipTarget = 'entity_type' | 'relation_type' | 'dictionary_term' | 'rule';

export interface AuthorshipVersionRef {
  value: string;
  provenanceClass: ProvenanceClass;
  version: string;
}

export interface AuthorshipEvent {
  id: string;
  action: AuthorshipAction;
  target: AuthorshipTarget;
  /** The concept/term being authored, e.g. ':OrgUnit'. */
  term: string;
  /** Governed KIND the term is typed as. */
  kind: AnnotationKind;
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
  /** Honest receipt: unsigned until the KE workbench / promotion gate seals it. */
  receipt: string;
  /** Free-text rationale captured from the author (annotate action). */
  note?: string;
}

const UNSIGNED = 'unsigned — pending KE workbench seal';

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

/** Build a governed authorship event (pure — testable; no side effects). */
export function buildAuthorshipEvent(
  action: AuthorshipAction,
  target: AuthorshipTarget,
  term: string,
  kind: AnnotationKind,
  input: AuthorInput,
  mappedType?: string,
): AuthorshipEvent {
  return {
    id: nextId(target),
    action,
    target,
    term,
    kind,
    mappedType,
    author: input.author,
    ts: input.ts ?? new Date().toISOString(),
    version: 'v1-draft',
    priorVersion: input.prior,
    // Any authorship action taken by a person is human-authored provenance; a
    // prior learned value (if superseded) is retained in `priorVersion`.
    provenanceClass: 'human_authored',
    governed: true,
    learned: true,
    matchRule: false,
    receipt: UNSIGNED,
    note: input.note,
  };
}

/**
 * Promote a learned annotation concept into a versioned dictionary term. Emits a
 * Dictionary-shaped draft (mirroring the KE contract) plus the authorship event.
 * The dictionary is a governed + learned + versioned term set, NOT a match rule.
 */
export function promoteConceptToDictionaryTerm(
  concept: string,
  kind: AnnotationKind,
  mappedType: string,
  input: AuthorInput,
): { event: AuthorshipEvent; draft: Dictionary } {
  const event = buildAuthorshipEvent('add', 'dictionary_term', concept, kind, input, mappedType);
  const draft: Dictionary = {
    name: `${concept} (authored)`,
    terms: 1,
    mappedType,
    source: `reasoning-chain-inspector · ${input.author}`,
    licence: 'owned',
  };
  return { event, draft };
}

/** Define a new entity type from an annotation (KE Assets → Entity Types). */
export function defineEntityType(concept: string, kind: AnnotationKind, input: AuthorInput): { event: AuthorshipEvent; draft: EntityType } {
  const event = buildAuthorshipEvent('define', 'entity_type', concept, kind, input);
  const draft: EntityType = { name: concept, color: 'var(--accent)', mentions: 0, f1: null, valueKind: 'derived', roles: '' };
  return { event, draft };
}

/** Define a new relation type from an annotation (KE Assets → Relation Types). */
export function defineRelationType(concept: string, kind: AnnotationKind, subject: string, object: string, input: AuthorInput): { event: AuthorshipEvent; draft: RelationType } {
  const event = buildAuthorshipEvent('define', 'relation_type', concept, kind, input);
  const draft: RelationType = { name: concept, subject, object, instances: 0, f1: null };
  return { event, draft };
}

/**
 * Overwrite a learned concept label with a human-authored value. The learned
 * value is retained as a prior version and the new event supersedes it.
 */
export function overrideConcept(
  concept: string,
  kind: AnnotationKind,
  learnedPrior: string,
  input: Omit<AuthorInput, 'prior'>,
): AuthorshipEvent {
  return buildAuthorshipEvent('overwrite', 'dictionary_term', concept, kind, {
    ...input,
    prior: { value: learnedPrior, provenanceClass: 'learned', version: 'learned-v0' },
  });
}

/** In-memory authorship ledger for the inspector (surfaced in the UI). */
export interface AuthorshipLedger {
  events: Ref<AuthorshipEvent[]>;
  record: (e: AuthorshipEvent) => void;
  clear: () => void;
}
export function useAuthorshipLedger(): AuthorshipLedger {
  const events = ref<AuthorshipEvent[]>([]);
  return {
    events,
    record: (e) => { events.value = [e, ...events.value]; },
    clear: () => { events.value = []; },
  };
}

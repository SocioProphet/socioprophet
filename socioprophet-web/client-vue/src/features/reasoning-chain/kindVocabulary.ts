// Governed semantic-role KIND vocabulary for the Reasoning Chain Inspector.
//
// The annotation layer is bound to the ESTATE's governed topic model, not to
// hard-coded strings:
//   - The closed set of KINDs is the Regis NLU Semantic Role Kind taxonomy
//     (regis-entity-graph#22, schemas/nlu/semantic-role-kind.schema.json).
//     Only the KIND is a closed vocabulary.
//   - The role LABEL (:ActionShow, :ContactLists, :Organization…) is an OPEN,
//     LEARNED vocabulary per the estate rule "learn, don't match dictionaries".
//     This module governs how a learned label is TYPED, never which labels exist.
//   - Entity/relation type labels resolve against the KE registries
//     (regis NER entity-class + Knowledge Studio entity/relation types); see
//     keAuthorship.ts for the authorship round-trip.
//
// The source component keyed color/label off a private CAT token map. Here the
// color + display label are sourced from the KIND set, so the annotation and
// concept-graph layers are bound to the governed vocabulary/topic model.

/** Closed set — mirror of regis-entity-graph#22 SemanticRoleKind.$defs enum. */
export const SEMANTIC_ROLE_KINDS = [
  'ACTION',
  'ENTITY_TYPE',
  'RELATION',
  'QUANTIFIER',
  'POSSESSION',
  'MODIFIER',
  'CONTEXT',
] as const;
export type SemanticRoleKind = (typeof SEMANTIC_ROLE_KINDS)[number];

// Two governance markers that are NOT semantic-role KINDs but must be rendered:
//   DECLARED_UNRESOLVED — a parse concept the ontology cannot yet bind to a
//     primitive (the "gap" the owner cares about; declared, never silently dropped).
//   UNTYPED — a token carrying no resolved concept.
export type AnnotationKind = SemanticRoleKind | 'DECLARED_UNRESOLVED' | 'UNTYPED';

/** The source component's per-token category tokens (faithful port surface). */
export type SourceCat = 'action' | 'entity' | 'relation' | 'modifier' | 'temporal' | 'gap' | 'neutral';

/**
 * Base CAT → governed KIND map (the point of the estate alignment):
 *   action→ACTION, entity→ENTITY_TYPE, relation→RELATION,
 *   modifier→MODIFIER (refined to QUANTIFIER for quantity terms below),
 *   temporal→CONTEXT, gap→DECLARED_UNRESOLVED, neutral→UNTYPED.
 */
export const CAT_TO_KIND: Record<SourceCat, AnnotationKind> = {
  action: 'ACTION',
  entity: 'ENTITY_TYPE',
  relation: 'RELATION',
  modifier: 'MODIFIER',
  temporal: 'CONTEXT',
  gap: 'DECLARED_UNRESOLVED',
  neutral: 'UNTYPED',
};

// Controlled-vocabulary refinements that use the FULL governed KIND set beyond a
// 1:1 CAT map — quantity terms type as QUANTIFIER, ownership terms as POSSESSION.
// These are learned-label → KIND typings, not a match dictionary: the label set
// is illustrative and the resolver, not this table, decides membership at runtime.
const QUANTIFIER_LABELS = new Set([':Count', ':All', ':Some', ':Number', ':HowMany']);
const POSSESSION_LABELS = new Set([':Own', ':My', ':BelongsTo', ':Mine']);

/** Type a learned concept label into the governed KIND, applying refinements. */
export function kindForConcept(cat: SourceCat, label: string): AnnotationKind {
  if (QUANTIFIER_LABELS.has(label)) return 'QUANTIFIER';
  if (POSSESSION_LABELS.has(label)) return 'POSSESSION';
  return CAT_TO_KIND[cat];
}

export interface KindPalette {
  bg: string;
  text: string;
  ring: string;
}
export interface KindMeta {
  /** Human label shown in the legend / tag KIND chip. */
  label: string;
  /** Short governed-vocabulary description (tooltip). */
  gloss: string;
  palette: KindPalette;
}

// Palette provenance: the exact tokens from the source component, re-attached to
// the governed KIND they map to (visual fidelity preserved; binding governed).
// QUANTIFIER shares the MODIFIER family and POSSESSION the RELATION family so the
// refined typings do not change the rendered color, only the governed KIND label.
const P = {
  action: { bg: '#F3B27A', text: '#6B3D0F', ring: '#D98A3D' },
  entity: { bg: '#A9CFB0', text: '#1F5C38', ring: '#4C8A62' },
  relation: { bg: '#A7C2E0', text: '#1B4A73', ring: '#5C8AC0' },
  modifier: { bg: '#DDB3D0', text: '#6B2A5C', ring: '#B36A9E' },
  temporal: { bg: '#DFCB93', text: '#5C4A12', ring: '#B99A45' },
  gap: { bg: '#D98267', text: '#FFFFFF', ring: '#B8563B' },
  neutral: { bg: '#E7E5DF', text: '#4A4640', ring: '#B8B3A8' },
} as const;

export const KIND_META: Record<AnnotationKind, KindMeta> = {
  ACTION: { label: 'Action', gloss: 'Verb frame / operation the utterance requests.', palette: P.action },
  ENTITY_TYPE: { label: 'Entity type', gloss: 'A type/class of thing being referenced.', palette: P.entity },
  RELATION: { label: 'Relation', gloss: 'A relation between references.', palette: P.relation },
  QUANTIFIER: { label: 'Quantifier', gloss: 'Scope/quantity over a reference.', palette: P.modifier },
  POSSESSION: { label: 'Possession', gloss: 'Ownership / attribution.', palette: P.relation },
  MODIFIER: { label: 'Modifier', gloss: 'A qualifying attribute.', palette: P.modifier },
  CONTEXT: { label: 'Context', gloss: 'A scope/sensitivity cue on the information structure.', palette: P.temporal },
  DECLARED_UNRESOLVED: { label: 'Declared-unresolved', gloss: 'A parse concept the ontology cannot yet bind — declared, never silently dropped.', palette: P.gap },
  UNTYPED: { label: 'Untyped', gloss: 'No resolved concept on this token.', palette: P.neutral },
};

export function paletteForConcept(cat: SourceCat, label: string): KindPalette {
  return KIND_META[kindForConcept(cat, label)].palette;
}

// Provenance class shown on every concept tag: a learned label vs a
// human-authored override. Human overrides supersede the learned value; the
// prior is retained as a version (see keAuthorship.ts). The type is owned by the
// KE-workbench contract (single source of truth) and re-exported here for the
// annotation layer — CONSUME-NOT-FORK.
export type { ProvenanceClass } from '../knowledge-studio/keWorkbench';
import type { ProvenanceClass } from '../knowledge-studio/keWorkbench';
export const PROVENANCE_META: Record<ProvenanceClass, { glyph: string; label: string }> = {
  learned: { glyph: '◐', label: 'learned' },
  human_authored: { glyph: '✎', label: 'human-authored' },
};

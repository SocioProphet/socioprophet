// Live concept-LABEL resolver for the Reasoning Chain Inspector.
//
// The seed fixtures (examples.ts) carry hard-coded governed labels (:ActionShow,
// :ContactLists…). When the inspector binds to a LIVE Noetica turn, those labels
// must instead be sourced from the estate's learned resolver / KE registries, per
// the estate rule "learn, don't match dictionaries":
//   - the LIVE learned surface is the living ontology (stores/ontology.ts): the
//     schema-on-the-fly loop that INDUCES concept classes, relation predicates and
//     topics from the read corpus. That is the learned label source.
//   - the governed KE type registry (features/knowledge-studio/fixture.ts:
//     entityTypes / relationTypes — the Knowledge Studio entity/relation types)
//     supplies canonical governed type labels.
// KINDs are NOT resolved here — they stay bound to regis-entity-graph#22 via
// kindVocabulary.ts. This module resolves only the open, LEARNED role LABEL.
//
// CONSUME-NOT-FORK: this reads the existing live surfaces; it neither forks nor
// writes them. If a term has no live resolution, resolveConceptLabel() falls back
// to the KIND (a provisional marker) — it never crashes and never fabricates a
// governed label out of thin air.

import { useOntology } from '../../stores/ontology';
import { entityTypes as keEntityTypes, relationTypes as keRelationTypes } from '../knowledge-studio/fixture';
import type { AnnotationKind, ProvenanceClass } from './kindVocabulary';

export interface ResolvedLabel {
  /** Governed/learned concept label, e.g. ':Organization'. */
  label: string;
  /** Where the label came from — learned (induced/registry) vs human override. */
  provenance: ProvenanceClass;
}

/** A resolver maps a raw term + its KIND to a learned label, or null if unknown. */
export interface ConceptResolver {
  resolveLabel(term: string, kind: AnnotationKind): ResolvedLabel | null;
}

export interface ResolvedConcept {
  label: string;
  provenance: ProvenanceClass;
  /** true when the live resolver produced the label. */
  resolved: boolean;
  /** true when the label is the graceful KIND fallback, not a live resolution. */
  provisional: boolean;
}

/** ':' + PascalCase — the governed concept-label form (':MonetaryValue'). */
export function toConceptLabel(name: string): string {
  const s = (name ?? '').trim();
  if (!s) return ':Concept';
  if (s.startsWith(':')) return s;
  const pascal = s
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return ':' + (pascal || 'Concept');
}

const RELATIONISH: ReadonlySet<AnnotationKind> = new Set<AnnotationKind>(['RELATION', 'POSSESSION']);

/** Live registry surfaces the resolver reads — injected so it stays testable. */
export interface RegistrySources {
  /** Induced entity classes with their learned lexical instances. */
  classes: () => Array<{ label: string; instances: string[] }>;
  /** Learned relation predicates. */
  predicates: () => string[];
  /** Learned/observed topics. */
  topics: () => string[];
}

/**
 * Build a resolver over the given live registry surfaces plus the governed KE
 * type registry. Pure over its injected sources — no store/composable coupling,
 * so tests can drive it directly.
 */
export function createRegistryResolver(sources: RegistrySources): ConceptResolver {
  return {
    resolveLabel(term: string, kind: AnnotationKind): ResolvedLabel | null {
      const t = (term ?? '').trim().toLowerCase();
      if (!t) return null;

      // Learned relation predicates + governed relation-type registry.
      if (RELATIONISH.has(kind)) {
        const pred = sources.predicates().find((p) => p.toLowerCase() === t);
        if (pred) return { label: toConceptLabel(pred), provenance: 'learned' };
        const rt = keRelationTypes.find(
          (r) => r.name.toLowerCase() === t || r.name.toLowerCase().replace(/_/g, ' ') === t,
        );
        if (rt) return { label: toConceptLabel(rt.name), provenance: 'learned' };
      }

      // Learned induced entity classes (instances) + governed entity-type registry.
      const cls = sources
        .classes()
        .find((c) => c.label.toLowerCase() === t || c.instances.some((i) => i.toLowerCase() === t));
      if (cls) return { label: toConceptLabel(cls.label), provenance: 'learned' };

      const et = keEntityTypes.find(
        (e) =>
          e.name.toLowerCase() === t ||
          e.name.toLowerCase().replace(/_/g, ' ') === t ||
          e.roles
            .toLowerCase()
            .split(/[,\s]+/)
            .filter(Boolean)
            .includes(t),
      );
      if (et) return { label: toConceptLabel(et.name), provenance: 'learned' };

      // Learned/observed topics → context concepts.
      const topic = sources.topics().find((tp) => tp.toLowerCase() === t);
      if (topic) return { label: toConceptLabel(topic), provenance: 'learned' };

      return null;
    },
  };
}

/**
 * Resolve a term to a concept, with a graceful fallback. On a live-resolution
 * miss the label becomes the KIND itself (a provisional marker) — honest, never a
 * fabricated governed label.
 */
export function resolveConceptLabel(term: string, kind: AnnotationKind, resolver: ConceptResolver): ResolvedConcept {
  const hit = resolver.resolveLabel(term, kind);
  if (hit) return { label: hit.label, provenance: hit.provenance, resolved: true, provisional: false };
  return { label: kind, provenance: 'learned', resolved: false, provisional: true };
}

/**
 * Live resolver bound to the estate surfaces: the living ontology (induced,
 * learned) + the governed KE type registry. Must be called with an active Pinia
 * (i.e. from a component/composable), like any store consumer.
 */
export function useConceptResolver(): ConceptResolver {
  const ontology = useOntology();
  return createRegistryResolver({
    classes: () => ontology.classes.map((c) => ({ label: c.label, instances: c.instances })),
    predicates: () => ontology.relations.map((r) => r.predicate),
    topics: () => ontology.topics.map((t) => t.topic),
  });
}

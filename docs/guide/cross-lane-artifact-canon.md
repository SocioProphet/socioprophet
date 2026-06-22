# Cross-Lane Artifact Canon

This page is the public architecture entry point for the shared artifact vocabulary across SocioProphet.

The normative semantic standard lives in `SocioProphet/socioprophet-standards-knowledge`:

- `045-cross-lane-artifact-canon.md`
- `046-field-alias-matrix.md`

This guide is the readable map for operators, reviewers, builders, and institutional readers.

## 1. Purpose

SocioProphet already has multiple evidence-producing lanes:

- runtime execution artifacts;
- knowledge artifacts;
- Entity Analytics and legal-entity proof artifacts;
- capability receipts and proof-strength semantics;
- product and UI evidence surfaces.

The goal of the canon is not to force those lanes into one serialization surface. The goal is to make them interoperable, replayable, reversible, and explainable as one governed system.

## 2. The lanes

### Runtime execution

AgentPlane emits proof-bearing lifecycle artifacts such as validation, placement, run, replay, session, promotion, and reversal artifacts. It also carries domain-specific evidence objects such as Agent Machine mount evidence, Office artifact evidence, Network Door planning evidence, external model-provider route evidence, and Native Assistant bridge evidence.

### Knowledge Context

Knowledge Context standardizes notes, claims, annotations, relations, and provenance.

### Entity Analytics and legal-entity proof

Entity Analytics uses typed events, scopes, governed links, merge controls, proof artifacts, safe export, and reversibility. The legal-entity lane specializes the same pattern for source records, identifiers, statements, designation events, evidence objects, rights constraints, and freshness posture.

### Capability Fabric

Capability Fabric defines protocol-independent capability semantics, realization metadata, receipt semantics, controllability, and proof strength. It is the authority for how proof claims must degrade honestly when execution becomes weakly controlled or externalized.

### Product and UI evidence surfaces

Some user-facing surfaces also carry evidence semantics, such as source receipt refs, fixture digests, provenance, readiness state, freshness state, attribution, and placeholder/non-production markers.

## 3. Shared semantic primitives

The cross-lane canon uses the following shared nouns:

- `Event`
- `Claim`
- `Entity`
- `Relationship`
- `DecisionArtifact`
- `ProofPack`
- `TemporalProfile`
- `TrustProfile`

## 4. Mandatory bridge refs

The common bridge layer reuses:

- `ActorRef`
- `ArtifactRef`
- `ProvenanceRef`
- `ProvenanceRecord`

New cross-lane work should reuse these bridge primitives unless there is a documented reason not to.

## 5. Non-breaking field policy

The canon is semantic first, not rename first.

Released fields may remain named as they are today, for example:

- `capturedAt`
- `created_at`
- `occurred_at`
- `asserted_at`
- `validated_at`
- `effective_from`
- `observed_at`

The canon defines what those names mean and how they map. Field-name convergence can happen later through normal versioning.

## 6. DecisionArtifact

A `DecisionArtifact` is any proof-bearing artifact that records a consequential decision or lifecycle transition.

Examples include:

- validation
- placement
- run outcome
- replay package
- session lifecycle
- promotion
- reversal
- merge / unmerge
- export allow / block
- suppression / coarsening
- screening and adjudication decisions

Each lane may serialize these differently, but they belong to one semantic family.

## 7. ProofPack

A `ProofPack` is a public-safe packaging profile for review, replay, disclosure, and audit.

It is not a competing proof model. It packages:

- Capability Fabric receipt/proof semantics
- AgentPlane evidence and lifecycle artifacts
- Knowledge Context claims and provenance
- Entity Analytics proof explanations
- bounded evidence, policy refs, replay refs, and safe summaries

## 8. TemporalProfile and TrustProfile

`TemporalProfile` normalizes time semantics such as capture time, occurrence time, assertion time, validation time, observation time, retrieval time, and validity windows.

`TrustProfile` normalizes validation state, checks, confidence where applicable, review state, rights, freshness, controllability, proof strength, signatures, witnesses, and admissibility posture.

Not every lane uses every slot. The point is shared meaning, not forced uniform density.

## 9. Why this matters

Without the canon, the platform reads like neighboring subsystems.

With the canon, we can explain:

- one evidence model
- one replay model
- one reversibility posture
- one public-safe proof/export vocabulary
- one bridge between runtime, knowledge, entity, capability, and product work

## 10. Read next

- [Architecture](./architecture)
- [Agent Plane and Operator Workflows](./agent-plane-and-operator-workflows)
- [Entity Analytics Reference](./entity-analytics-reference)
- [Provenance, Promotion, and Reversibility](./provenance-promotion-and-reversibility)

The separate `ProofPack` and entity-proof packaging guide should be read after those pages.

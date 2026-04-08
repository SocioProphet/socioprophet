# Legal Entity Reference Fabric

Legal Entity Reference Fabric is the open and privacy-preserving legal-entity reference, resolution, sanctions, and proof subsystem for SocioProphet.

This page defines the public technical shape of the subsystem and its relation to the broader Entity Analytics stack.

The design target is not a proprietary clone of a Bloomberg-style entity master. The design target is a governed evidence fabric that separates public reference commons from private resolution and attestation.

## 1. System purpose

The subsystem exists to provide:

- a source-attributed legal-entity reference graph
- typed identifier crosswalks
- explicit relationship and hierarchy semantics
- sanctions and designation overlays
- reversible merge and unmerge decisions
- privacy-preserving tenant-local matching
- proof-carrying outputs for regulated or adversarial settings

The point is to preserve provenance, rights, and confidence rather than collapse all source facts into a flat ambient row.

## 2. Core thesis

The core thesis is:

**Reference is not identity, and designation is not truth.**

That implies four architectural rules.

1. An entity card is a materialized view over statements, not the primitive source of truth.
2. Accounting parentage, beneficial ownership, operational control, and sanctions designation are distinct predicates.
3. Public reference data and private customer resolution live in separate planes.
4. Every consequential transition must remain replayable and reversible.

## 3. Product planes

The system is split into four planes.

### 3.1 Commons

The commons plane contains open or licensable reference inputs such as:

- LEI and relationship data
- official sanctions publications
- selected registries
- beneficial ownership publications where rights permit
- source metadata and rights metadata

### 3.2 Private resolution

The private plane contains tenant-specific onboarding, KYC, vendor, counterparty, and investigation records.

Matching occurs locally, in tenant infrastructure, or under a stronger protected execution model. Private records are not required to become part of the shared commons.

### 3.3 Adjudication

The adjudication plane handles:

- candidate generation
- deterministic and probabilistic linkage
- analyst review
- sanctions screening decisions
- reversible merge and unmerge events

### 3.4 Proof and export

The proof plane emits signed or otherwise evidence-bearing artifacts for:

- match decisions
- sanctions screening results
- export eligibility
- suppression or coarsening decisions
- replay and audit workflows

## 4. Canonical objects

The physical model is statement-centric with a stable entity cluster on top.

### 4.1 EntityCluster

EntityCluster is the stable internal handle for a legal entity or related subject.

Representative fields include:

- `entity_id`
- `entity_kind`
- `canonical_name`
- `display_name`
- `status`
- `primary_jurisdiction`
- confidence profile fields

### 4.2 SourceRecord

SourceRecord preserves the raw observation from an upstream source.

Representative fields include:

- `source_record_id`
- `source_id`
- `source_native_id`
- `source_url`
- `retrieval_time`
- `effective_time`
- `source_hash`
- `raw_payload`

### 4.3 Identifier

Identifier stores typed identity handles without assuming all schemes are equally global or equally authoritative.

Representative fields include:

- `scheme`
- `value`
- `jurisdiction`
- `issuing_authority`
- `valid_from`
- `valid_to`
- `preferred`

### 4.4 AttributeStatement

AttributeStatement stores time-aware and source-aware facts such as legal name, address, form, or status.

Representative fields include:

- `predicate`
- `value`
- `normalized_value`
- `effective_from`
- `effective_to`
- `observed_at`
- `confidence`
- `review_state`
- `source_record_id`

### 4.5 RelationshipStatement

RelationshipStatement stores typed edges such as accounting parentage, ownership, control, office-holding, and sanctioned-by relationships.

Representative fields include:

- `subject_entity_id`
- `object_entity_id`
- `predicate`
- `ownership_percentage_min`
- `ownership_percentage_max`
- `control_mechanism`
- `confidence`
- `effective_from`
- `effective_to`
- `relationship_meta`

### 4.6 DesignationEvent

Sanctions are modeled as events rather than ordinary attributes.

Representative fields include:

- `designation_event_id`
- `entity_id`
- `source_authority`
- `list_name`
- `program`
- `measure`
- `legal_basis`
- `designation_date`
- `delisting_date`
- `status`
- `source_record_id`

### 4.7 EvidenceObject

EvidenceObject ties normalized facts back to source artifacts.

Representative fields include:

- `evidence_id`
- `statement_id` or `designation_event_id`
- `evidence_type`
- `content_hash`
- `storage_uri`
- `mime_type`
- `captured_at`

### 4.8 RightsProfile

RightsProfile stores redistribution and publication constraints separately from the facts themselves.

Representative fields include:

- `license_name`
- `attribution_required`
- `share_alike`
- `redistribution_allowed`
- `commercial_use_allowed`
- `publication_constraints`
- `retention_constraints`

## 5. Invariants

The subsystem enforces the following invariants.

### 5.1 Statement primacy

Every user-visible fact must be reconstructable from statements, designation events, or evidence objects.

### 5.2 Distinct relationship semantics

The following predicates must never be silently collapsed:

- direct accounting parent
- ultimate accounting parent
- beneficial owner
- controller
- subsidiary
- officer or manager
- sanctions designation

### 5.3 Source and rights preservation

Every normalized claim must retain source and rights metadata.

### 5.4 Bitemporality

The system must distinguish when a fact was true from when the system observed or ingested it.

### 5.5 Reversibility

Merge, unmerge, suppression, and export decisions are reversible and evidence-bearing.

### 5.6 Designation caution

A sanctions-list row is not automatically a globally resolved entity truth. Designations and entity-resolution decisions remain separate objects.

## 6. Source families

The initial source families are:

- global legal entity identifiers and relationship data
- official sanctions publications
- selected official registries
- beneficial ownership publications where available and lawful
- tenant-private intake and case data

Every family receives its own:

- adapter
- source schema binding
- rights profile
- freshness expectations
- confidence posture

## 7. Resolution pipeline

The linkage pipeline is ordered.

1. deterministic anchors such as strong identifiers
2. probabilistic candidate generation and scoring
3. policy gating and sanctions sensitivity checks
4. analyst review for ambiguous or consequential cases
5. materialization of cluster, relationship, and proof artifacts

High score alone is not sufficient for merge.

## 8. Privacy model

The default privacy stance is:

- shared commons for public reference
- tenant-local storage for customer records
- local, enclave, or similarly protected execution for matching when needed
- selective export of proof-carrying outputs

This allows shared reference without forced centralization of private onboarding or investigation data.

## 9. Relation to existing SocioProphet guides

This page extends and narrows several existing public technical pages:

- [Entity Analytics Reference](/guide/entity-analytics-reference)
- [Entity Analytics Overview](/guide/entity-analytics-overview)
- [Entity Graph and Safe Linkage](/guide/entity-graph-and-safe-linkage)
- [Policy-Constrained Merging and Unmerge](/guide/policy-constrained-merging-and-unmerge)
- [Organizations Governance and Institutional Safety](/guide/organizations-governance-and-institutional-safety)

Where those pages discuss governed identity and linkage in general, this page specializes the pattern for legal entities, registries, sanctions, and evidence-bearing reference data.

## 10. Current implementation status

The current implementation pack exists as a staged contract and parser scaffold with:

- PostgreSQL DDL for commons and private planes
- JSON Schema and Avro starter contracts
- parser skeletons for LEI-style and sanctions-style inputs
- validation and smoke-test reports
- a PostgreSQL execution harness for environments with a real engine

The implementation is not yet production-ready. The main remaining gaps are:

- live PostgreSQL migration execution in a real engine
- fresh live-source parser validation for additional source families
- broader connector coverage
- proof/export artifact standardization

## 11. Operational checklist

Before promoting this subsystem into a production lane, confirm:

1. storage schema executes cleanly in a real engine
2. source rights are encoded and enforced
3. relationship predicates remain semantically distinct
4. sanctions parsers preserve source-local identifiers and designation lineage
5. merge and unmerge are both tested
6. private-plane deployment keeps customer data out of the commons by default
7. operator-facing proof artifacts are replayable

## 12. Recommended next work

The next engineering work items are:

- execute the DDL in a real PostgreSQL runtime
- expand parser coverage for additional official source families
- complete the contract parity between SQL, JSON Schema, and Avro
- add screening-case and screening-hit private workflow objects
- define proofpack export objects and signatures

This page is the public narrative anchor for that implementation work.

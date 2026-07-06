# Entity Fabric Contract Overview

This document summarizes the first contract surface for the Legal Entity Reference Fabric.

## Core planes

The implementation is split into two persistent planes.

### `core`

Shared reference commons for public or licensable data.

Representative objects:

- `rights_profile`
- `source_dataset`
- `source_record`
- `entity_cluster`
- `predicate_catalog`
- `identifier`
- `attribute_statement`
- `relationship_statement`
- `designation_event`
- `evidence_object`
- `credential`

### `priv`

Tenant-private matching and workflow plane.

Representative objects:

- `tenant`
- `local_record`
- `match_run`
- `match_candidate`
- `match_decision`

## Key modeling decisions

1. Statement-first model rather than flat master rows.
2. Separate treatment for accounting parentage, ownership, control, and sanctions designation.
3. Rights and redistribution constraints are first-class.
4. Bitemporality is first-class.
5. Merge and unmerge remain reversible.
6. Sanctions are modeled as designation events rather than ordinary attributes.

## Transport objects in the starter bundle

- `EntityCluster`
- `SourceRecord`
- `Identifier`
- `AttributeStatement`
- `RelationshipStatement`
- `DesignationEvent`

## Required follow-on

- keep the split SQL stack validated in CI
- add parser source and fixtures
- add `screening_case` and `screening_hit` workflow objects
- execute the DDL against a real PostgreSQL runtime

# Entity Fabric Implementation Pack

This directory contains the first repo-native implementation scaffold for the Legal Entity Reference Fabric described in `docs/guide/legal-entity-reference-fabric.md`.

It is intentionally text-first and reviewable.

Included in this pack:

- `sql/` — split PostgreSQL schema for commons and private planes.
- `contracts/OVERVIEW.md` — contract pack and connector mapping notes.
- `contracts/entity_fabric_avro.avsc` — starter Avro bundle.
- `runtime/postgres_validation_harness.sh` — local harness for running DDL validation in a real PostgreSQL runtime.
- `reports/entity_fabric_runtime_readiness_report.md` — current runtime readiness notes.
- `reports/entity_fabric_parser_smoke_report.md` — parser smoke summary.
- `reports/entity_fabric_validation_report.md` — static contract-validation summary.

This pack is not yet production-ready.

Current gaps:

- live PostgreSQL execution against a real engine
- full parser source landing in-repo
- fresh live-source validation for GLEIF and additional official sources

Recommended follow-on after this scaffold lands:

1. run the PostgreSQL harness in a real runtime and capture results
2. land parser source and fixtures as a follow-on PR
3. keep docs navigation wired through the governance checks now on `master`

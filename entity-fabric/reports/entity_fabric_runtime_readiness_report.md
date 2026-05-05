# Entity Fabric Runtime Readiness Report

## Current state

- Repo-native scaffold exists.
- Avro starter bundle exists.
- Split SQL stack exists.
- Governance controls are now present on `master`.

## Stronger areas

- statement-first model
- sanctions as designation events
- split commons/private planes
- rights and provenance are first-class

## Remaining gaps

- live PostgreSQL execution in CI or a real runtime
- parser source and fixtures in-repo
- fresh official-source parser validation

## Promotion rule

Do not treat this pack as production-ready until the PostgreSQL smoke path passes against the split SQL stack.

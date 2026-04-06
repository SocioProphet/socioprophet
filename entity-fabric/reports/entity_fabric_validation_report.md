# Entity Fabric validation report

Status: **PASS**

## Notes
- SQL statement count: 70
- Tables discovered: 16
- JSON Schema bundle validates against Draft 2020-12 meta-schema.
- Avro record count: 6

## Warnings
- No local `psql` binary or Postgres server was available, so validation is static rather than migration-executed.

## Errors
- None

## Static checks performed
- SQL statement split with `sqlparse`.
- Create-table inventory and foreign-key target resolution.
- Presence checks for key tables and the relationship_meta extension.
- JSON Schema meta-schema validation via `jsonschema`.
- Avro bundle JSON parse and duplicate-record-name check.

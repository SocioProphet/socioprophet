# Entity Fabric Parser Smoke Report

## Test command

```bash
cd /mnt/data/entity_fabric_parsers_pkg && PYTHONPATH=. pytest -q
```

## Result

- 5 tests passed.

## Covered cases

1. GLEIF Level 1 fixture emits LEI identifier and core attributes.
2. GLEIF RR fixture preserves parent/child direction for accounting-consolidation relationships.
3. OFAC legacy-style synthetic fixture emits OFAC UID, alias, designation, and control relationship.
4. OFAC attribute/reference-table fixture resolves list code, legal basis, sanctions measure, passport identifier, nationality, and address from XSD-style IDs.
5. OFAC minimal fixture validates against the current official OFAC Advanced XML XSD.

# MemoryAPI Interface

## System-of-record rule
System-of-record is **git + AIWG artifact directory**.
MemoryAPI is a **queryable cache/service**, not authority.

## Required capabilities
- `put(namespace, key, payload, metadata)`
- `get(namespace, key)`
- `search(namespace, query, filters)` -> ranked results + citations to artifacts
- `export(namespace)` -> for backup/migration
- `import(namespace, dump)` -> for restore/replacement

## Example providers
Mem0 (primary).

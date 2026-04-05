# Agentic Open Knowledge Commons runtime bootstrap v0.1

## Purpose

This note defines the first post-merge bootstrap path for the dedicated commons runtime.

## Constraint

The runtime must consume the staged contracts and bridge notes. It must not invent a competing descriptor, order, transport, or execution model.

## First end-to-end slice

The first runtime slice should implement this path:

1. ingest a GitHub-backed knowledge object
2. wrap it in a valid `GeneralDescriptor`
3. register it through the descriptor service surface
4. create an `OrderDescriptor` for promotion or publication when needed
5. validate the order
6. resolve to `agentplane` only if governed execution is required
7. preserve `descriptorId` and `orderId` in resulting evidence
8. expose retrieval by descriptor id, task, and PARA projection

## Minimum runtime components

- connector adapter for GitHub
- descriptor registry client
- order orchestration client
- policy check hook
- optional execution bridge client
- retrieval/index projection layer

## First code-facing milestone

A runtime implementation is ready for its first PR when it can:
- read a GitHub source object
- emit a valid `GeneralDescriptor`
- emit a valid `OrderDescriptor`
- call the typed transport surface with stable schema/context identifiers
- persist the resulting ids and evidence refs

## Dependency chain

The runtime should start only after these PRs are merged:
- `socioprophet-standards-storage` PR #11
- `socioprophet-standards-knowledge` PR #22
- `TriTRPC` PR #19
- `agentplane` PR #11

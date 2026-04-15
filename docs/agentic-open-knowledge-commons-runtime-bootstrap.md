# Agentic Open Knowledge Commons runtime bootstrap v0.1

## Purpose

This note defines the post-foundation bootstrap path for the dedicated commons runtime.

## Current foundation state

The following foundations are already merged:
- `socioprophet-standards-storage` PR #11
- `socioprophet-standards-knowledge` PR #22
- `TriTRPC` PR #19
- `agentplane` PR #11

## Current temporary incubator

Until a dedicated commons runtime repository is created, the temporary runtime scaffold lives in:
- `socioprophet` PR #256

That incubator now includes:
- first-slice flow docs
- implementation checklist
- example descriptor and order payloads
- source normalization stub
- promotion-order builder stub
- typed transport request helpers
- execution bridge helpers
- evidence linkage helpers
- retrieval projection helper

## First post-merge extraction step

Once the umbrella PRs land, the temporary `aokc-runtime/` scaffold should be moved into a dedicated commons runtime repository and normalized into a package-friendly layout.

## Runtime target path

The first runtime slice should implement this path:
1. ingest a GitHub-backed knowledge object
2. wrap it in a valid `GeneralDescriptor`
3. register it through the descriptor service surface
4. create and validate an `OrderDescriptor` for promotion or publication when needed
5. resolve to `agentplane` only if governed execution is required
6. preserve `descriptorId` and `orderId` in resulting evidence
7. expose retrieval by descriptor id, task, content space, and PARA projection

## Constraint

The runtime must consume the merged contracts and bridge notes. It must not invent a competing descriptor, order, transport, or execution model.

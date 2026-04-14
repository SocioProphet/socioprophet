# Agentic Open Knowledge Commons runtime bootstrap

## Status

Temporary bootstrap scaffold staged in the umbrella repo until a dedicated commons runtime repository is created.

## Purpose

This directory defines the first code-facing slice for the Agentic Open Knowledge Commons runtime.

It is intentionally constrained to consume the staged contracts and bridge notes already queued in the org:
- `socioprophet-standards-storage` PR #11
- `socioprophet-standards-knowledge` PR #22
- `TriTRPC` PR #19
- `agentplane` PR #11
- `socioprophet` PR #255

## First end-to-end slice

The first runtime slice should implement one narrow path:

1. ingest a GitHub-backed source object
2. wrap it in a valid `GeneralDescriptor`
3. register the descriptor through the typed transport surface
4. create an `OrderDescriptor` when governed promotion or publication is needed
5. validate the order
6. resolve to `agentplane` only if governed execution is required
7. preserve `descriptorId` and `orderId` in resulting evidence
8. expose retrieval by descriptor id, task, and PARA projection

## Suggested module layout

- `connectors/github_ingest.py`
- `descriptors/build_general_descriptor.py`
- `orders/build_promotion_order.py`
- `transport/descriptor_client.py`
- `transport/order_client.py`
- `bridge/agentplane_bridge.py`
- `index/projection.py`
- `evidence/linkage.py`

## Constraints

- do not invent a competing descriptor model
- do not bypass TriTRPC with ad hoc payloads
- do not collapse knowledge semantics into the execution plane
- do not treat PARA as the canonical ontology

## Exit condition

This bootstrap layer should be moved into a dedicated commons runtime repository once repo creation is available and the staged contract PRs are merged.

# AOKC runtime implementation checklist v0.1

## Purpose

This checklist turns the bootstrap scaffold into a code-facing work surface.

## Contract prerequisites

Before implementation work starts, confirm that the following staged PRs are merged:
- `socioprophet-standards-storage` PR #11
- `socioprophet-standards-knowledge` PR #22
- `TriTRPC` PR #19
- `agentplane` PR #11
- `socioprophet` PR #255

## Runtime readiness checklist

### GitHub ingestion
- can read source repo/path/ref
- can compute or preserve content hash
- can extract minimal source metadata

### Descriptor construction
- can construct a valid `GeneralDescriptor`
- can populate object, relationships, policies, and provenance
- can preserve a stable candidate `descriptorId`

### Order construction
- can construct a valid `OrderDescriptor`
- can express the target content space and output type
- can preserve a stable candidate `orderId`

### Transport
- can call descriptor registration through the typed transport surface
- can call order creation and validation through the typed transport surface
- can preserve schema and context identifiers

### Execution bridge
- can determine whether governed execution is required
- can call the execution bridge without tunneling the full descriptor graph
- can preserve `descriptorId`, `orderId`, and evidence refs

### Retrieval and projection
- can retrieve by descriptor id
- can retrieve by task and content space
- can project results into PARA views without treating PARA as the ontology

## Done condition

The first runtime slice is done when one GitHub-backed source object can complete the end-to-end path from ingest to descriptor registration to order validation to optional execution bridging to evidence-linked canonical publication.

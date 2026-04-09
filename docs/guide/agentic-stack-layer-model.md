# Agentic Stack Layer Model

This page summarizes the normalized layer model for the SocioProphet agentic knowledge platform.
It is a public mirror of the canonical upstream standards package.

## The model at a glance

A complete platform design has to account for more than a model call and a retrieval index.
At minimum, the system needs the following layers.

## 1. Surfaces

These are the places where people and systems interact with the platform:
- public docs and product surfaces
- operator consoles
- terminal and shell-equivalent environments
- APIs
- support, academy, and discovery interfaces

## 2. Orchestration

This is where workflows, controller logic, review flows, state transitions, approvals,
and agent routing are defined.

## 3. Tools and integrations

This layer contains connectors, tools, notifications, collaboration integrations,
file boundaries, and sandboxed execution adapters.

## 4. Retrieval and reasoning

This layer contains the governed retrieval stack:
- lexical retrieval
- vector retrieval
- metadata filtering
- reranking
- citation assembly
- source routing

## 5. Knowledge and state

This layer contains the platform’s stored and derived state:
- artifacts
- metadata and provenance
- indexes
- graph structures
- memory and perspective state
- reusable knowledge assets

## 6. Ingestion and enrichment

This layer turns source material into governed knowledge objects through extraction,
parsing, normalization, enrichment, and permission-aware indexing.

## 7. Models and runtimes

This layer contains:
- foundation models
- embedding models
- rerankers
- classifiers
- multimodal models
- local and remote inference runtimes

## 8. Evaluation and lifecycle

This layer covers:
- offline evaluation
- online monitoring
- synthetic and human feedback
- regression gates
- promotion and rollback decisions
- drift and freshness monitoring

## 9. Governance and evidence

This layer contains the control model:
- identity and authorization
- policy enforcement
- provenance
- audit
- redaction and safeguarding
- reversibility and promotion controls

## Important distinctions

### Observability is not the same as governance

Telemetry and trace analytics are important, but they are not the same thing as policy,
authorization, safety, or evidence controls.

### Embeddings are not the whole retrieval story

A strong retrieval system also depends on reranking, metadata discipline, source routing,
and citation construction.

### Memory is broader than conversation history

Memory may include user preferences, asset reuse, procedural knowledge, local perspectives,
and signed knowledge structures.

### Extraction is broader than text parsing

The platform may need document layout, image, screen, and video pathways in addition to text extraction.

## Why this matters

This layer model makes it easier to:
- compare stacks honestly
- place artifacts in the right upstream repo
- define implementation boundaries
- keep public explanation separate from canonical standards and runtime specifics

## Related pages

- [Agentic Knowledge Platform](/guide/agentic-knowledge-platform)
- [Architecture](/guide/architecture)
- [Products Overview](/guide/products/overview)
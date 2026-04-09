# Agentic Knowledge Platform

This page is the public-safe mirror for the canonical agentic knowledge platform package.

The common "agentic RAG stack" picture is useful as a teaching shortcut, but it is too narrow for the
broader SocioProphet platform. Our architecture is not only a model + framework + vector database pipeline.
It is a governed operational system with explicit surfaces, orchestration, retrieval, knowledge/state,
ingestion, model runtime, evaluation lifecycle, and evidence boundaries.

## Why this page exists

We use this page to explain the architecture honestly at a public-safe level.

The canonical standards source lives upstream in the standards authority repository. This page is a mirror
for the public docs surface, not the normative source of truth.

## The normalized view

The platform is best understood as a set of interacting layers.

### 1. Surface and channel layer

This is where people and connected systems enter the platform:
- web surfaces
- operator consoles
- terminal / shell-equivalent surfaces
- APIs and integrations
- support and caseflow surfaces
- academy and discovery surfaces

### 2. Application and orchestration layer

This is where workflows, agent graphs, approvals, routing, and controller logic live.
It is what turns isolated tools and models into an actual operating system for work.

### 3. Tooling and integration layer

This is where connectors, tools, collaboration integrations, file systems, notifications,
and sandboxed capability boundaries are managed.

### 4. Retrieval and reasoning layer

This layer includes:
- query rewrite
- source routing
- hybrid retrieval
- metadata filtering
- reranking
- citation assembly

We do not treat retrieval quality as equivalent to embeddings alone.

### 5. Knowledge and state layer

This layer includes:
- raw artifact storage
- metadata and provenance
- lexical and vector indexes
- graph/ontology stores
- memory and perspective state
- asset reuse structures

### 6. Ingestion and enrichment layer

This is where source material is discovered, parsed, normalized, enriched, permissioned,
and made ready for governed retrieval and action.

### 7. Model and runtime layer

This includes foundation models, embedding models, rerankers, classifiers, multimodal models,
and the local or remote runtimes that serve them.

### 8. Evaluation and lifecycle layer

This includes offline evaluation, online monitoring, synthetic feedback, human review,
regression gates, promotion controls, and drift/freshness checks.

### 9. Governance, safety, and evidence layer

This is where identity, policy, authorization, audit, provenance, redaction, and promotion/rollback
controls are enforced.

## Why this is broader than conventional RAG

The additional inventory and integration work surfaced several platform concerns that are often omitted
from a simple pyramid:
- modular application backends and workflow engines
- multimodal runtime planes
- sovereign local state and perspective graphs
- support operations and case routing
- academy, matching, and discovery surfaces
- synthetic feedback and model/prompt lifecycle operations

## Public-safe reading rule

This page explains the system shape and control model.
It does not expose restricted tactical internals, privileged operator runbooks, or misuse-enabling detail.

## Related pages

- [Architecture](/guide/architecture)
- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Agent Plane and Operator Workflows](/guide/agent-plane-and-operator-workflows)
- [Products Overview](/guide/products/overview)

## Canonical upstream package

For the canonical standards package, see the standards authority repository documents:
- `100-agentic-knowledge-platform-layer-model.md`
- `101-agentic-knowledge-platform-tooling-inventory.md`
- `102-agentic-knowledge-platform-integration-patterns.md`
- `103-agentic-knowledge-platform-repo-boundaries.md`

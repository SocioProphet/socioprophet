# MeshRush

This page introduces MeshRush as a public-safe architectural surface in the SocioProphet ecosystem.

MeshRush is the graph-operating runtime for autonomous agents working over graph views derived from a richer hypergraph world model. It gives agents the bounded operational semantics they need to enter a graph view, explore, stay grounded, decide when diffusion should stop, crystallize stable local structure, and reuse that structure across sessions or workspaces.

MeshRush is not the full platform, not the workspace controller, not the execution control plane, and not the learning archive. It is the runtime layer that makes graph-native agency operational.

## 1. Why MeshRush exists

Agents that act over graph-structured or graph-derived state need more than generic traversal.

They need a runtime that can:

- begin from a grounded local context
- diffuse outward through a graph view without losing provenance
- reduce and summarize while exploring
- decide when continued diffusion is no longer worth the cost
- compile bounded local structure into reusable artifacts
- preserve evidence for replay, evaluation, and governance

MeshRush exists to provide exactly that operating layer.

## 2. Core architectural thesis

The MeshRush thesis is simple:

- the world may be represented canonically as a richer typed hypergraph
- agents still need navigable graph-operating views at runtime
- exploratory diffusion is useful, but only if it can stop
- bounded local structure is useful, but only if it remains reviewable and revisable

That means MeshRush is organized around a productive dual:

- **Omni** handles exploratory diffusion and reduction
- **Crystal** handles bounded stopping, compilation, persistence, annealing, and dissolution

Omni explores.
Crystal stops and compiles.
MeshRush is the runtime that makes both useful to agents on the graph.

## 3. Ecosystem position

MeshRush sits inside a wider SocioProphet ecosystem.

At the public architectural level:

- **SocioProphet** is the ecosystem and platform context
- **Sociosphere** is the workspace-controller and governance-gates layer
- **agentplane** is the governed execution, evidence, replay, and rollout layer
- **Alexandrian Academy** is the learning, evaluation, transfer, and experiment-memory layer
- **MeshRush** is the graph-operating runtime layer

This means MeshRush owns graph operation, diffusion, stop surfaces, compilation, artifact lifecycle, and evidence emission.
It does **not** own rollout governance, workspace orchestration, or long-horizon learning memory.

## 4. Internal layer model

MeshRush is organized into five internal layers:

### Foundation

Foundation defines the worldview and invariants:

- graph views derived from a richer world model
- provenance
- reversibility
- workspace-aware operation
- compile and dissolve lifecycle discipline

### Core

Core defines the primitive runtime loop:

- enter
- localize
- traverse
- diffuse
- score
- stop
- crystallize
- persist
- resume
- dissolve

### Omni

Omni is the exploratory diffusion and reduction layer.
It maintains frontier state, reduction surfaces, stop candidates, and exploratory evidence.

### Crystal

Crystal is the bounded compilation layer.
It evaluates candidate regions, emits compile decisions, constructs reusable artifacts, and supports anneal, merge, and dissolve behavior.

### Adapters

Adapters connect MeshRush to adjacent ecosystem systems such as Sociosphere, agentplane, and Alexandrian Academy.

## 5. Runtime doctrine

A MeshRush-enabled runtime session follows a bounded pattern:

1. acquire or derive a graph view
2. establish local grounding state
3. diffuse and explore through the graph view
4. reduce and summarize while exploring
5. surface stop candidates when diffusion ceases to be worthwhile
6. evaluate bounded candidate regions for compilation
7. compile reusable artifacts where justified
8. emit traces, evidence, and lifecycle events
9. later reuse, anneal, merge, or dissolve those artifacts as needed

This is not a chat-first runtime. It is a graph-operating runtime with explicit stop and evidence surfaces.

## 6. MeshRush and publication

MeshRush is expected to have a canonical engineering home and a public publication home.

The engineering source of truth is expected to live in a dedicated MeshRush repository under the SocioProphet organization.
That repo is expected to own:

- ADRs
- canonical specifications
- reference implementation
- experiments
- issues and releases

The public reader-facing explanation is expected to be published through the existing SocioProphet platform documentation surface, which is this site.

That split keeps MeshRush technically coherent while also keeping public documentation traffic and ecosystem framing on the main platform site.

## 7. What this page is and is not

This page is a public-safe introduction to MeshRush as an architectural surface.

It is not the canonical protocol specification.
It is not the full runtime reference.
It is not the experiment archive.

Those deeper materials should remain in the canonical MeshRush engineering home once that repo is initialized.

## 8. Reading path

If you are reading the public architecture, the suggested order is:

- [Architecture](/guide/architecture)
- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Agent Plane and Operator Workflows](/guide/agent-plane-and-operator-workflows)
- this MeshRush page
- adjacent future MeshRush pages on Omni, Crystal, and ecosystem integration

## 9. Current status

MeshRush is currently being moved from design and chartering into a dedicated protocol/reference runtime form.

The architectural boundary is already clear:

- MeshRush is the graph-operating runtime
- agentplane is the governed execution plane
- Alexandrian Academy is the learning and evaluation plane
- Sociosphere is the workspace-controller plane

The next phase is to formalize the canonical MeshRush repository and then expand this documentation surface accordingly.

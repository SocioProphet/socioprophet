# ADR-0001 — Strategic Decision Planes as the Canonical Portfolio Vocabulary

Status: draft  
Date: 2026-04-11

## Context

The public SocioProphet portfolio already expresses a coherent but previously under-normalized architecture across:
- the umbrella product and documentation surface in `socioprophet`
- cross-repo materialization and registry authority in `sociosphere`
- deterministic transport and evidence behavior in `TriTRPC`
- governed execution in `agentplane`
- policy control in `policy-fabric`
- semantic, ontology, and memory runtime work across the standards repos, `ontogenesis`, and `memory-mesh`
- identity, Digital Trust, Entity Analytics, and Human Digital Twin surfaces
- Academy, Organizations, and institutional delivery lanes

The portfolio needs a durable vocabulary that is:
- small enough to govern
- broad enough to cover the real repo set
- stable enough for registry, CI, documentation, and packaging reuse

## Decision

We adopt **seven Strategic Decision Planes** as the canonical portfolio vocabulary:

1. Governance and Human Safeguards
2. Deterministic Transport and Evidence
3. Governed Execution and Capability Routing
4. Knowledge, Context, and Semantic Systems
5. Identity, Entity, and Human API Surfaces
6. Authorized Defensive Operations
7. Learning and Institutional Delivery

These planes are not generic market categories. They are the canonical SocioProphet operating vocabulary for portfolio governance.

## Rationale

The seven-plane model remains correct after deeper repo review because it matches the actual control surfaces while allowing concrete anchors to evolve inside each plane.

The updated anchor map now makes this explicit:
- **SDP-1** is anchored by `policy-fabric`, not by generic governance prose
- **SDP-3** now includes a real cloud-edge execution seed through `cloudshell-fog`
- **SDP-4** now explicitly includes ontology governance and memory runtime through `ontogenesis` and `memory-mesh`
- **SDP-5** now treats Digital Trust as an active surface boundary, not a future-only note

## Consequences

### Positive
- Strategy, docs, and registry can share one vocabulary.
- Concrete repos can be attached to planes without renaming the planes.
- The product-surface map can be reconciled against the plane registry.
- CI and release gates can attach to planes without turning the planes into implementation detail.

### Negative / trade-offs
- The planes can become too abstract if concrete anchors are not maintained.
- Surface naming and plane naming can drift unless the umbrella docs and `config/surfaces.json` are reviewed together.
- Some repos will legitimately participate in more than one plane.

## Guardrails

- Do not casually rename plane IDs or plane names after registry adoption.
- Use planes as accountability boundaries, not as a dumping ground for local repo nuance.
- Keep concrete repo-local mechanics in anchor repos.
- Reconcile major product-surface changes against the plane registry when `config/surfaces.json` changes materially.

## Follow-on

- Narrative source remains in `socioprophet`.
- Machine-readable source remains in `sociosphere`.
- Product-surface reconciliation should use `socioprophet/config/surfaces.json` as input, not only the rendered inventory page.

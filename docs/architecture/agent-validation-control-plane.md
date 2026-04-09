# Agent Validation Control Plane

Status: draft v0.1

## Purpose

This document defines the control-plane architecture for deterministic agent validation in the SocioProphet mesh. The problem is not that agents can generate patches, plans, prompts, or commands. The problem is that most systems still treat validation as an afterthought, leaving agents with broad proposal power but weak, inconsistent, or non-repeatable pathways to trustworthy evidence.

Our position is simple:

- agents are strongest as planners, scouts, and proposers;
- skills are the deterministic hands that execute bounded work;
- the control plane is the constitution that governs admission, execution, evidence, and promotion.

The system therefore separates soft-lane activity from hard-lane activity. Soft-lane activity may search, infer, rank, summarize, draft, and propose. Hard-lane activity may only execute through typed, policy-governed, replayable, evidence-producing skills.

## Why a validation control plane exists

Most agent stacks collapse four distinct concerns into one mushy runtime surface:

1. tool invocation;
2. validation;
3. approval;
4. commitment.

We reject that collapse.

Tool use is not validation. Validation is not approval. Approval is not commitment. Commitment is not truth. Those boundaries must remain explicit if the mesh is to remain auditable, secure, and useful under real operational pressure.

The validation control plane exists to preserve those boundaries while still enabling high-throughput agentic work.

## Core model

The control plane operates around six first-class objects:

1. **MeshSkill**: a versioned, typed, policy-bound capability descriptor.
2. **Action**: an atomic executable primitive with declared side effects and evidence outputs.
3. **Plan**: an ordered or conditional composition of actions.
4. **Coordinates**: typed execution selectors such as environment, topology scope, trust class, tenant scope, frontier limits, and data sensitivity.
5. **Evidence Bundle**: the attributed result set emitted by a run.
6. **Cairn**: a deterministic checkpoint carrying cryptographic commitments before and after execution.

This replaces generic "tools" and vague "tags" with a model that is schedulable, governable, queryable, and replayable.

## Design principles

### 1. Evidence first

No run is considered useful merely because it returned `success=true`. A run is useful only when it emits evidence that can support a claim, reject a claim, or justify the next decision.

### 2. Typed coordinates, not free-form labels

Execution context must be explicit and machine-checkable. A skill admitted for `env=preview` and `frontier_hops=2` is not implicitly admitted for production or for wider topological reach.

### 3. Replayability is mandatory

Every materially important hard-lane execution must be bound to before/after cairns, trace identifiers, and an event trail sufficient for replay and forensic review.

### 4. Human authority remains explicit

High-consequence operations, irreversible side effects, and policy exceptions require human approval. The control plane does not erase accountability; it makes accountability enforceable.

### 5. Bounded side effects

A skill descriptor must state what side effects are possible. If the side-effect class is undeclared, the skill is not admitted to the hard lane.

### 6. Mesh portability

Execution should not depend on a single host or product-local runtime. Skills are transported and invoked through typed envelopes over TriTRPC so they can operate across local nodes, clusters, and federated mesh participants.

## Major components

### Skill Registry

The registry stores versioned MeshSkill descriptors, action definitions, plan references, policy bindings, evidence requirements, and publication trust state. Registry entries should be Merkle-addressable and signable so that a resolver can prove exactly what was admitted.

### Skill Planner and Resolver

The planner maps a proposed change or question into one or more required validation skills. The resolver narrows admissible execution based on policy, available coordinates, user or tenant scope, environment, and trust boundaries.

### Shadow Cell Orchestrator

A shadow cell is a topologically faithful validation cell. It may mirror a single service, a workflow slice, a cluster subsystem, or a bounded data path. The orchestrator materializes the cell, binds the plan, injects test or replay inputs, enforces frontier caps, and records the initial cairn.

### Skill Runtime Broker

The broker executes actions and plans through typed TriTRPC envelopes. It provides admission control, scheduling, idempotence, retries within policy, tracing, and artifact collection.

### Evidence Bridge

The evidence bridge normalizes outputs into structured evidence bundles, emits events to the event fabric, and maps results into the claim store and truth-maintenance lane.

### Approval Gate

The approval gate evaluates policy decisions, risk classes, environment sensitivity, and human-approval requirements before promotion or commitment occurs.

### Skill Explorer

The explorer exposes run history, evidence bundles, policy decisions, topology diffs, replayable cairns, and promotion outcomes. It is not just an activity feed. It is the operator-facing explanation layer for the hard lane.

## Trust boundaries

The architecture enforces at least five trust boundaries:

1. **proposal boundary** between soft-lane suggestion and hard-lane admission;
2. **execution boundary** between allowed coordinates and prohibited reach;
3. **data boundary** between redacted/test data and sensitive/live data;
4. **approval boundary** between policy pass and side-effect authorization;
5. **truth boundary** between observed run output and promoted claim state.

Each boundary should emit explicit events and denial reasons.

## Shadow cells

A shadow cell is not merely a temporary sandbox. It is a bounded validation environment with enough fidelity to produce operationally relevant evidence. A shadow cell may support:

- dependency pinning;
- synthetic or redacted data feeds;
- differential traffic replay;
- contract checking;
- SLO or regression comparison;
- fault injection;
- constrained write prohibitions;
- environment-specific policy overlays.

Shadow cells are a control-plane primitive because they turn validation into a governed workload rather than an improvised script.

## Evidence bundles

An evidence bundle is the minimum durable product of a skill run. Typical contents include:

- logs;
- traces;
- metrics;
- config diffs;
- dependency diffs;
- topology diffs;
- policy decisions;
- before and after cairns;
- verdicts and derived risk signals.

Evidence bundles are stored as artifacts and referenced from events and claims. They are not transient console output.

## Hard-lane lifecycle summary

1. An agent or human proposes work.
2. The planner determines required skills.
3. The resolver binds admissible coordinates.
4. Policy admission decides whether the run may start.
5. The orchestrator materializes the shadow cell.
6. The runtime executes the plan through TriTRPC actions.
7. Evidence is collected and normalized.
8. Policy evaluates promotion and approval requirements.
9. Claims are promoted, rejected, or left candidate.
10. Commit-class skills may proceed only after required approval.

The formal lifecycle is specified in `specs/control-plane/skill-execution-lifecycle-v0.1.md`.

## Relationship to existing SocioProphet concepts

### Hard lane / soft lane

Mesh skills are a hard-lane execution substrate. They exist precisely so that soft-lane output does not become de facto authority.

### CapD

A MeshSkill can be implemented as a specialized capability descriptor or a capability-descriptor profile for deterministic validation and bounded commitment.

### Cairns

Cairns are mandatory at state transition boundaries. They provide replayable checkpoints and cryptographic commitments for forensic review and divergence analysis.

### TriTRPC

TriTRPC is the transport fabric for skill invocation, evidence handoff, and planner-runtime coordination. The transport does not by itself make a skill safe; the control-plane contract does.

### Truth maintenance

Validation outputs become decision-grade only when linked into the claim store with provenance, status transitions, and dependency-aware justification.

## Example

```yaml
apiVersion: control.socioprophet.org/v1alpha1
kind: MeshSkill
metadata:
  id: sp.control.checkout-validate@e23.proc7-3.draft+l0
  merkle_root: sha256:REPLACE_ME
  signer: mesh-registry
spec:
  lane: hard
  class: verify
  coordinates:
    env: preview
    topology_scope: service.checkout
    trust_class: internal
    tenant_scope: default
    frontier_hops: 2
    data_sensitivity: redacted
  actions:
    - build_artifact
    - deploy_shadow_cell
    - replay_traffic_window
    - run_contract_checks
    - compare_slo_regressions
    - emit_evidence_bundle
  plan:
    ref: cairn://plans/checkout-validate/v3
    deterministic: true
    timeout_s: 900
    max_cost_units: 250
  inputs:
    - patch_ref
    - dependency_lock
    - traffic_window
  outputs:
    - verdict
    - evidence_bundle_ref
    - promoted_claim_refs
  policy:
    allow_autoapprove_below_risk: 30
    deny:
      - live_prod_write
      - pii_export
      - frontier_hops_gt_2
  evidence:
    require:
      - logs
      - traces
      - metrics
      - config_diff
      - dependency_diff
      - policy_decision
      - cairn_before
      - cairn_after
```

## Open issues for v0.2

- formalize signature and Merkle publication rules for the registry;
- define the plan IR and opcode model for action composition;
- specify skill caching and evidence reuse semantics;
- define promotion rules for negative evidence and retractions;
- define multi-tenant publication and federation semantics;
- define the Skill Explorer interaction model and explanation schema.

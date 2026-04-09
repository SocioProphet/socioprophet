# Skill Execution Lifecycle v0.1

Status: draft

## 1. Scope

This specification defines the end-to-end lifecycle for hard-lane MeshSkill execution in the SocioProphet control plane. It covers admission, orchestration, execution, evidence production, policy evaluation, truth-state impact, and commit gating.

The lifecycle exists so that agent-driven work remains bounded, attributable, and replayable.

## 2. Terms

- **proposal**: a candidate action, patch, investigation, or change request produced by a human or agent.
- **admission**: policy-governed authorization to start a skill run.
- **shadow cell**: a bounded validation environment with topological fidelity.
- **evidence bundle**: the durable artifact set emitted by a run.
- **promotion**: a status transition in the claim store based on policy and evidence.
- **commit**: an allowed side effect that changes external or durable state.
- **cairn**: a cryptographically committed checkpoint before or after a materially relevant transition.

## 3. Lifecycle states

A run SHOULD move through the following states:

1. `proposed`
2. `planned`
3. `resolved`
4. `admitted`
5. `materialized`
6. `running`
7. `evidence_collected`
8. `evaluated`
9. `approved` or `denied`
10. `promoted`, `rejected`, or `committed`
11. `archived`

Implementations MAY expose more granular sub-states, but they MUST preserve equivalent semantics.

## 4. End-to-end flow

### 4.1 Proposal

A run begins when a human or agent proposes work. The proposal MUST include enough context for the planner to determine required validation scope.

Minimum recommended proposal fields:

- actor identity;
- proposal class;
- target object or topology scope;
- requested coordinates;
- intended outcome;
- referenced artifacts such as patch, config, or incident window.

Event emitted:

- `skill.requested`

### 4.2 Planning

The planner maps the proposal to one or more MeshSkills. Planning MAY produce a single skill or a composed run set.

The planner MUST identify:

- required skill classes;
- candidate descriptors;
- sequence or dependency ordering;
- risk-relevant attributes;
- whether commit-class execution is even potentially in scope.

Event emitted:

- `skill.planned`

### 4.3 Resolution

The resolver binds the planned run to admissible coordinates. Resolution MUST account for:

- descriptor-declared coordinates;
- environment policy;
- tenant or project policy;
- actor authorization;
- data sensitivity;
- frontier caps;
- time or budget constraints.

If requested coordinates exceed bounds, the run MUST be denied before execution.

Event emitted:

- `skill.resolved`

### 4.4 Admission

Admission is the final policy check before orchestration starts.

Admission MUST evaluate at least:

- skill class;
- risk threshold;
- required approvals;
- prohibited side effects;
- data export restrictions;
- missing attestations;
- coordinate violations.

A denied run MUST record explicit denial reasons and SHOULD still produce a denial artifact for auditability.

Events emitted:

- `skill.admitted` or
- `policy.denied`

### 4.5 Materialization

If admission succeeds, the shadow cell orchestrator materializes the execution environment if needed. Materialization SHOULD capture:

- environment reference;
- dependency snapshot;
- topology snapshot;
- input bindings;
- `cairn_before` reference.

Event emitted:

- `skill.materialized`

### 4.6 Execution

The runtime broker executes the action list or plan through typed TriTRPC envelopes. Runtime execution MUST preserve:

- trace identifiers;
- deterministic or declared non-deterministic mode;
- idempotency metadata;
- action-level timing and status;
- per-action evidence references when available.

Events emitted:

- `skill.started`
- `action.started`
- `action.completed`
- `action.failed`

### 4.7 Evidence collection

At the end of the plan, required evidence MUST be normalized into an evidence bundle. Evidence collection is incomplete until all descriptor-required artifacts are either present or explicitly marked missing.

A run MUST NOT proceed to promotion as validated if required evidence is missing.

Event emitted:

- `evidence.attached`

### 4.8 Evaluation

The evaluation stage computes verdicts and policy outcomes from evidence. Evaluation MAY include:

- contract assertions;
- regression thresholds;
- topology drift checks;
- policy conformance;
- risk recomputation;
- confidence or anomaly annotations.

Evaluation output SHOULD include:

- verdict;
- denial reasons if any;
- promotion recommendation;
- approval requirement status;
- `cairn_after` reference where applicable.

Event emitted:

- `skill.evaluated`

### 4.9 Approval

If the class or policy requires human approval, the run MUST pause in a reviewable state. Approval MUST reference the exact evidence bundle and exact descriptor version under review.

Approval MAY be required for:

- commit-class skills;
- prod coordinates;
- regulated data scope;
- policy exceptions;
- high computed risk.

Events emitted:

- `approval.requested`
- `approval.granted`
- `approval.denied`

### 4.10 Promotion and commit

Promotion and commit are distinct.

Promotion updates claim state in the knowledge plane. Commit performs a bounded side effect. Either may occur without the other depending on class and policy.

Allowed outcomes:

- candidate claim promoted to validated;
- candidate claim rejected;
- derived claims promoted;
- prior claims retracted due to negative evidence;
- commit executed;
- commit denied.

Events emitted:

- `claim.promoted`
- `claim.rejected`
- `claim.retracted`
- `commit.approved`
- `commit.executed`
- `commit.denied`

### 4.11 Archival

Every run MUST end in an archived record containing:

- descriptor reference;
- input references;
- coordinate binding;
- event trail;
- evidence bundle reference;
- cairn references;
- promotion and approval outcomes;
- actor attribution.

Event emitted:

- `skill.archived`

## 5. Idempotence and retries

Retries MUST remain within declared policy and idempotency constraints.

- Read, replay, simulate, and verify classes MAY retry automatically within configured limits.
- Commit-class retries MUST be conservative and SHOULD require explicit idempotency proof or human review.
- A retried run MUST retain lineage to prior attempts.

## 6. Failure handling

Failure is evidence.

The lifecycle MUST preserve failures as first-class outputs rather than merely log noise. Failure categories SHOULD include:

- admission failure;
- orchestration failure;
- execution failure;
- evidence incompleteness;
- policy denial after execution;
- approval denial;
- commit failure.

Negative evidence MAY trigger claim rejection or retraction if policy permits.

## 7. Truth-maintenance integration

The knowledge plane MUST distinguish between:

- raw run outputs;
- evaluated verdicts;
- claim promotions;
- claim retractions.

A run result is not truth merely because it exists. Promotion requires provenance, evidence completeness, and satisfied policy.

## 8. Minimum artifacts per run

Every archived run MUST retain or reference:

- run identifier;
- actor identity;
- descriptor identifier and version;
- resolved coordinates;
- event trail;
- evidence bundle;
- policy decision;
- approval record if applicable;
- `cairn_before` and `cairn_after` when stateful execution occurred.

## 9. Event set

The recommended event set for v0.1 is:

- `skill.requested`
- `skill.planned`
- `skill.resolved`
- `skill.admitted`
- `skill.materialized`
- `skill.started`
- `action.started`
- `action.completed`
- `action.failed`
- `evidence.attached`
- `skill.evaluated`
- `policy.denied`
- `approval.requested`
- `approval.granted`
- `approval.denied`
- `claim.promoted`
- `claim.rejected`
- `claim.retracted`
- `commit.approved`
- `commit.executed`
- `commit.denied`
- `skill.archived`

## 10. Security invariants

1. No run may start without resolved coordinates.
2. No run may exceed descriptor-declared coordinate bounds.
3. No validated promotion may occur without required evidence.
4. No commit may occur without satisfying required approval policy.
5. Every state transition of consequence must be attributable.
6. Every materially stateful run must be replayable through cairn references and event lineage.

## 11. Deferred items

Future versions should define:

- multi-step approval quorums;
- distributed partial-order execution and compensation semantics;
- formal negative-evidence propagation across dependent claims;
- federation semantics for cross-mesh execution;
- retention and redaction policies for evidence bundles.

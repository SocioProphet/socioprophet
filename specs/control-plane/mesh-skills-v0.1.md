# MeshSkill Descriptor Specification v0.1

Status: draft

## 1. Scope

This specification defines the `MeshSkill` descriptor used by the SocioProphet validation and control plane. A MeshSkill is a typed, versioned, policy-bound capability object for hard-lane execution. It exists to make validation, simulation, replay, verification, and bounded commitment explicit, schedulable, and replayable.

This document is normative unless marked otherwise.

## 2. Goals

The descriptor MUST:

- make execution intent explicit;
- bind execution to typed coordinates;
- declare action composition or plan references;
- declare inputs, outputs, and side-effect class;
- define evidence obligations;
- support policy admission and approval gating;
- support deterministic replay and auditing.

The descriptor SHOULD:

- be signable and Merkle-addressable;
- be compatible with capability-descriptor registries;
- support cross-node and cross-cluster execution via TriTRPC;
- remain transport-neutral above the action envelope layer.

The descriptor MUST NOT:

- grant implicit authority outside declared coordinates;
- hide side effects behind untyped plugins;
- permit promotion without evidence;
- treat success/failure flags as sufficient evidence.

## 3. Object shape

A MeshSkill is a resource with `metadata` and `spec` sections.

### 3.1 Metadata

`metadata.id` is the canonical skill identifier. It SHOULD follow the braided naming model used across SocioProphet registries.

`metadata.merkle_root` is the content commitment for the descriptor and referenced in-registry normalization rules.

`metadata.signer` identifies the entity that signed or published the descriptor.

Additional metadata MAY include ownership, publication scope, lifecycle state, and lineage.

### 3.2 Spec

The `spec` section defines execution semantics.

Required fields:

- `lane`
- `class`
- `coordinates`
- `actions` or `plan`
- `inputs`
- `outputs`
- `evidence`

Optional but strongly recommended fields:

- `policy`
- `side_effects`
- `risk`
- `attestation`
- `timeouts`
- `budgets`

## 4. Lane

`spec.lane` identifies the execution lane.

Allowed values in v0.1:

- `hard`

Future values may exist for descriptive compatibility, but a MeshSkill governed by this specification is intended for hard-lane execution. Soft-lane operations are not represented as MeshSkill execution rights.

## 5. Skill classes

`spec.class` MUST be one of:

- `read`
- `replay`
- `simulate`
- `verify`
- `commit`

Semantics:

### 5.1 Read

A read skill observes state without intended mutation. It may query, inspect, summarize, or extract bounded evidence.

### 5.2 Replay

A replay skill reconstructs prior state transitions, traffic windows, event windows, or deterministic execution paths.

### 5.3 Simulate

A simulate skill executes in a shadow cell or equivalent bounded environment to explore behavior without committing external side effects.

### 5.4 Verify

A verify skill evaluates explicit invariants, contracts, regressions, or policy assertions and emits a verdict with evidence.

### 5.5 Commit

A commit skill performs bounded side effects. Commit skills MUST be subject to stricter policy and approval rules than non-commit classes.

## 6. Coordinates

`spec.coordinates` binds where and under what trust conditions a skill may execute. Coordinates MUST be machine-checkable.

Recommended fields in v0.1:

- `env`: environment identifier such as `dev`, `preview`, `staging`, `prod`
- `topology_scope`: service, workflow, cluster component, or data-path selector
- `trust_class`: trust partition such as `public`, `internal`, `restricted`, `secret`
- `tenant_scope`: tenant, project, or namespace selector
- `frontier_hops`: maximum graph or dependency expansion distance
- `data_sensitivity`: data class such as `synthetic`, `redacted`, `internal`, `pii`, `regulated`

A resolver MUST deny admission when requested coordinates exceed descriptor bounds or applicable policy overlays.

## 7. Actions and plans

A MeshSkill MUST define either:

- `spec.actions`: an ordered list of atomic actions, or
- `spec.plan`: a plan reference or embedded plan object.

A descriptor MAY define both when `actions` serve as a normalized summary and `plan` provides the authoritative execution contract.

### 7.1 Actions

Each action SHOULD correspond to a catalogued primitive with declared side effects and evidence outputs.

Examples:

- `build_artifact`
- `deploy_shadow_cell`
- `replay_traffic_window`
- `run_contract_checks`
- `compare_slo_regressions`
- `emit_evidence_bundle`

### 7.2 Plan

A plan reference MUST resolve to a deterministic plan definition or an explicitly non-deterministic plan admitted by policy.

Recommended fields:

- `ref`
- `deterministic`
- `timeout_s`
- `max_cost_units`
- `idempotency_key_strategy`

## 8. Inputs and outputs

`spec.inputs` defines required external materials or references.

Examples:

- `patch_ref`
- `dependency_lock`
- `traffic_window`
- `schema_ref`
- `incident_window`

`spec.outputs` defines the durable outputs expected from successful execution.

Examples:

- `verdict`
- `evidence_bundle_ref`
- `promoted_claim_refs`
- `shadow_cell_ref`

A runtime MUST fail the run when required outputs are missing.

## 9. Evidence obligations

`spec.evidence.require` lists evidence artifacts that MUST exist for the run to satisfy the descriptor.

Typical values:

- `logs`
- `traces`
- `metrics`
- `config_diff`
- `dependency_diff`
- `topology_diff`
- `policy_decision`
- `cairn_before`
- `cairn_after`

A run that does not meet required evidence obligations MUST NOT be promoted as validated, even if the plan returned a nominal success code.

## 10. Policy section

`spec.policy` declares local constraints and default execution rules. Platform policy overlays MAY narrow execution further but MUST NOT broaden execution beyond what the descriptor declares.

Recommended fields:

- `allow_autoapprove_below_risk`
- `deny`
- `require_human_approval_for`
- `forbid_coordinates`
- `required_attestations`

Typical deny tokens:

- `live_prod_write`
- `pii_export`
- `frontier_hops_gt_2`

## 11. Side effects

A descriptor SHOULD declare intended side-effect class explicitly.

Suggested values:

- `none`
- `ephemeral_internal`
- `artifact_write`
- `topology_mutation`
- `external_commit`

A commit-class skill with undeclared side effects SHOULD be rejected by policy.

## 12. Risk and approval

Descriptors MAY include a risk range or expected risk profile. Platform policy MAY compute final risk independently, but descriptor-declared risk is useful for routing and approval defaults.

Commit-class skills SHOULD include:

- minimum human approval requirements;
- disallowed coordinate ranges;
- higher evidence thresholds;
- stronger cairn requirements.

## 13. Invariants

The following invariants apply in v0.1:

1. A MeshSkill MUST have an identifier.
2. A MeshSkill MUST declare a class.
3. A MeshSkill MUST bind coordinates.
4. A MeshSkill MUST define actions or plan.
5. A MeshSkill MUST define inputs and outputs.
6. A MeshSkill MUST define required evidence.
7. A MeshSkill MUST be rejected if requested execution exceeds declared coordinates.
8. A MeshSkill MUST NOT promote claims without required evidence.
9. A commit-class MeshSkill MUST NOT execute without satisfying approval policy.
10. Every admitted run MUST be traceable through events and cairn references.

## 14. Publication and versioning

Descriptors SHOULD be immutable once published under a given identifier and Merkle root. Mutations SHOULD produce a new identifier state or lineage reference.

A registry SHOULD maintain:

- current publication state;
- prior lineage;
- signer identity;
- compatibility metadata;
- deprecation status.

## 15. Example

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

## 16. Relationship to schemas

The machine-readable schema for this document is provided in `schemas/control-plane/mesh-skill.schema.json`.

## 17. Deferred items

The following are deferred to a later revision:

- embedded plan IR grammar;
- multi-party quorum rules for approval;
- registry proof format and transparency log integration;
- capability federation across autonomous meshes;
- negative-evidence propagation rules for derived claim retraction.

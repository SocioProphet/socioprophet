# Professional Intelligence UI and Dashboard Integration

## Purpose

This document defines what integration means for the SocioProphet public UI, dashboarding, and integration workspace surfaces.

The Professional Intelligence OS is not integrated into the UI merely because platform, governance, policy, agent, or workspace repos reference each other. UI integration means the operating state of the program and product can be seen, navigated, measured, and corrected from the public or operator-facing surface.

## Integration definition

A capability is integrated only when it has all of the following:

1. Contract
   - A machine-readable schema, manifest entry, or API contract exists.

2. Runtime or workflow touchpoint
   - The capability can be called, simulated, validated, or represented by a workflow step.

3. Governance owner
   - DelEx or the relevant governance repo owns acceptance, readiness, and corrective action.

4. UI or dashboard visibility
   - Status, evidence, adoption, blockers, and next actions can be surfaced in the UI or dashboard layer.

5. Feedback loop
   - Runtime, adoption, validation, or delivery signals flow back into DelEx boards, repo readiness, and roadmap decisions.

6. Cybernetic control
   - The system has a sense/compare/act loop: sense telemetry, compare to target, trigger corrective action, and record the adjustment.

## Dashboard surfaces

Initial dashboard surfaces should include:

- Program completion scoreboard
- Capability map
- Repo readiness matrix
- PR and issue wave tracker
- Playbook coverage
- Demo readiness gates
- Evidence coverage
- Adoption telemetry coverage
- Policy/obligation coverage
- Agent execution readiness
- Workspace surface readiness
- Search/query/context readiness

## Feedback loops

The UI should expose feedback loops across four control planes:

### 1. Delivery loop

Signal -> Intake -> Board Item -> Work Order -> PR -> Validation -> Evidence -> Demo Acceptance -> KPI Update

Owned primarily by:
- `SocioProphet/delivery-excellence`
- `SocioProphet/delivery-excellence-automation`
- `SocioProphet/delivery-excellence-boards`
- `SocioProphet/delivery-excellence-innersource`

### 2. Runtime loop

Playbook -> Context Resolve -> Policy Check -> Agent Step -> Workroom Update -> Evidence Receipt -> Adoption Event

Owned primarily by:
- `SocioProphet/prophet-platform`
- `SocioProphet/prophet-workspace`
- `SocioProphet/agentplane`
- `SocioProphet/policy-fabric`

### 3. Governance loop

Policy/Obligation -> Decision -> Enforcement -> Evidence -> Exception -> Review -> Updated Policy

Owned primarily by:
- `SocioProphet/policy-fabric`
- `SocioProphet/contractforge`
- `SocioProphet/model-governance-ledger`
- `SocioProphet/guardrail-fabric`

### 4. Intelligence loop

Search/Memory/Graph -> Context Pack -> Agent Output -> Human Feedback -> Adoption Event -> Model/Playbook/Policy Update

Owned primarily by:
- `SocioProphet/sherlock-search`
- `SocioProphet/memory-mesh`
- `SocioProphet/prophet-core-query`
- `SocioProphet/agent-registry`
- `SocioProphet/model-router`

## Cybernetic controls

The first dashboard should implement or prepare for these controls:

| Control | Signal sensed | Target | Corrective action |
|---|---|---|---|
| Repo readiness | missing docs, schemas, CI, owner, validation | green readiness | open work order or block merge |
| Demo readiness | missing playbook, context, policy, evidence, adoption | executable demo path | create blocking issue |
| Evidence coverage | steps without evidence refs | 100% governed steps covered | fail demo acceptance |
| Adoption coverage | workflows without adoption events | every demo emits events | require telemetry fixture |
| Policy coverage | governed steps without policy decisions | no unchecked sensitive action | block runtime/demo credit |
| Agent authority | agents without tool grants or revocation | bounded authority | block agent execution |
| Model routing | hosted/local decision lacks policy or evidence | route with reason and fallback | require routing policy |
| Workroom completeness | missing context, policy, task, evidence, or adoption surface | complete workroom packet | mark workroom incomplete |

## Current status

As of this integration seed:

- Overall alignment: about 22%
- Architecture spine: about 35%
- DelEx governance: about 40%
- DelEx automation: about 25%
- Platform contracts: about 30%
- Governed execution substrate: about 22%
- UI/dashboard integration: about 5%
- Workspace/search/query surface: about 12%
- Runtime implementation: about 5%
- Demo readiness: about 10%

## Minimum UI implementation target

The first UI slice should show:

1. Overall completion percentage.
2. Workstream percentages.
3. Active PRs and issues from the DelEx control register.
4. Repo readiness state.
5. Demo gate checklist.
6. Evidence/adoption/policy coverage placeholders.
7. Links to owner repos and PRs.

## Non-goals

- Do not make the UI the canonical source of governance truth.
- Do not duplicate DelEx, Policy Fabric, ContractForge, or Agentplane contracts.
- Do not present a capability as complete because it has a design document.
- Do not count demo readiness without evidence and telemetry paths.

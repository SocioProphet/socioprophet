# Agent Plane and Operator Workflows

This page is the public manual entry point for the operator workflow layer inside SocioProphet.

The Agent Plane explains how work moves from intent to bounded capability, from bounded capability to controlled execution, and from controlled execution to evidence, review, promotion, or reversal.

The Agent Plane also participates in the platform-wide artifact canon: runtime evidence, replay records, promotion/reversal records, capability receipts, knowledge claims, and Entity Analytics proof artifacts are mapped through one shared cross-lane evidence vocabulary.

Primary cross-lane reference:

- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

## 1. Purpose

The Agent Plane exists so institutions and operators can understand:

- who is acting
- what capability is in play
- what state the workflow occupies
- what evidence the workflow emits
- what review or reversal path exists

This is the operational layer that keeps the broader system governable.

## 2. Core model

The public model is straightforward:

1. intent enters the system
2. capability is routed under policy
3. execution occurs inside an explicit boundary
4. evidence is emitted
5. the result is reviewed, promoted, or reversed

This is not a hidden automation loop. It is an explicit operational model.

## 3. Roles

The public-facing role model includes:

- requester
- reviewer
- executor
- auditor
- safeguarding or governance authority where needed

The goal is role separation, not ambient authority.

## 4. Workflow states

A workflow may move through states such as:

- proposed
- approved
- executing
- degraded
- paused
- completed
- reviewed
- reversed
- remediated

These states matter because the system is built to keep transitions attributable and bounded.

## 5. Capability routing

The Agent Plane does not treat every connected tool as globally available.

Capability routing is bounded by:

- provider eligibility
- operator role
- scope
- policy
- safeguarding constraints
- review requirements

Relevant references:

- [Auth and Connections](/guide/auth-and-connections)
- [Provider Capability Routing](/guide/provider-capability-routing)
- [Provider Safety and Capability Eligibility](/guide/provider-safety-and-capability-eligibility)
- [Auth Recovery and Connection Health](/guide/auth-recovery-and-connection-health)

## 6. Relationship to governed AI and cybernetics

The Agent Plane sits inside the broader governed operational model.

That means it inherits:

- bounded execution
- reviewable transitions
- promotion and reversal logic
- deterministic safety posture
- public versus restricted boundary management

Relevant references:

- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Deterministic AI and Mathematical Safety](/guide/deterministic-ai-and-mathematical-safety)
- [Provenance, Promotion, and Reversibility](/guide/provenance-promotion-and-reversibility)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

## 7. Relationship to Entity Analytics

The Agent Plane depends on governed identity, scope, and event structure.

It relies on Entity Analytics for:

- typed events
- scope discipline
- identity-prime structure
- merge control
- evidence trails
- proof artifacts

Relevant references:

- [Entity Analytics Reference](/guide/entity-analytics-reference)
- [Identity Prime and Event-IR](/guide/identity-prime-and-event-ir)
- [Worked Example: Michael Cross-Context](/guide/worked-example-michael-cross-context)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

## 8. Relationship to organizations

The Organizations surface is the institutional umbrella for deployment.

The Agent Plane is one governed subsystem inside that umbrella.

Relevant references:

- [Organizations Governance and Institutional Safety](/guide/organizations-governance-and-institutional-safety)
- [Authorized Cyberdefense and Simulation](/guide/authorized-cyberdefense-and-simulation)

## 9. Public-safe boundary

This page explains:

- role model
- workflow states
- capability routing
- governance relationship
- evidence relationship
- public-safe control logic

It does not publish:

- sensitive operator kits
- restricted tactical playbooks
- exploit or persistence workflows
- private thresholds
- misuse-enabling automation details

That restriction is part of the safety model.

## 10. Why this matters

Without an explicit Agent Plane, institutions get:

- disconnected tools
- hidden authority chains
- weak accountability
- unclear workflow state
- ambiguous review boundaries

The Agent Plane gives the system a real operational layer instead of a pile of loosely connected features.

## 11. Use this page

Use this page when the question is:

- How does work move through the system operationally?
- How do roles, capability routing, and workflow state fit together?
- How does the Agent Plane connect to governance, analytics, and institutional deployment?
- What does the public layer explain, and what remains restricted?

# Agent Plane and Operator Workflows

The Agent Plane is the public description of how SocioProphet organizes operator-facing execution, bounded capabilities, reviewable actions, and workflow state.

This page is intentionally public-safe. It describes orchestration, roles, and workflow boundaries without publishing sensitive security tooling or high-risk automation details.

## 1. Purpose

The Agent Plane exists so organizations can understand how work moves from:

- intent
- to approved capability
- to controlled execution
- to evidence and review

This is the operator workflow layer of the platform.

## 2. Operator model

The public-facing operator model includes:

- requester
- reviewer
- executor
- auditor
- guardian or safeguarding authority where applicable

Not every workflow uses every role, but the model assumes role separation for consequential operations.

## 3. Workflow states

A typical workflow passes through states such as:

- proposed
- approved
- executing
- degraded
- paused
- completed
- reviewed
- reversed or remediated

The important property is that the workflow state is visible and governable.

## 4. Capability routing

The Agent Plane does not assume that every connected tool must be usable in every context. Capability routing is bounded by:

- provider eligibility
- operator role
- scope
- policy
- safeguarding constraints
- review requirements

Relevant references:

- [Auth and connections](./auth-and-connections)
- [Provider capability routing](./provider-capability-routing)
- [Provider safety and capability eligibility](./provider-safety-and-capability-eligibility)

## 5. Relation to Entity Analytics

The Agent Plane consumes governed identity, scope, and proof information from Entity Analytics rather than inventing its own unsafe context model.

Relevant references:

- [Identity Prime and Event-IR](./identity-prime-and-event-ir)
- [Entity Analytics Reference](./entity-analytics-reference)
- [Worked Example: Michael Cross-Context](./worked-example-michael-cross-context)

## 6. Public-safe boundary

This page describes:

- operator roles
- workflow state
- approval and review
- evidence and replay
- governance envelope

This page does not publish:

- sensitive internal runbooks
- privileged security playbooks
- exploit logic
- adversary simulation internals
- misuse-enabling automation details

## 7. Why it matters

Without an explicit Agent Plane, institutions end up with disconnected tools, invisible authority chains, and weak accountability. The Agent Plane is the public explanation of how SocioProphet keeps operator execution bounded, reviewable, and governable.

# Boundary-Centric Cyber Hypergraph

The Boundary-Centric Cyber Hypergraph is the public-safe description of how SocioProphet models cross-boundary behavior, evidence, and explanation.

At any point, the boundary is the unit of truth.

## 1. Core model

The core chain is:

**Component → Port → Contract → BoundaryEvent**

Evidence, expectations, findings, and artifacts attach to boundary events.

This gives us a system where:

- the decision point is explicit
- evidence can be attached or found missing
- contracts can be checked
- findings can be replayed
- explanation has a stable structure

## 2. Why boundary-first matters

Most systems over-focus on internal churn and under-focus on what crossed the boundary.

Boundary-first reasoning is better for:

- forensics
- audit
- policy
- least privilege
- explainability
- negative evidence
- institutional review

## 3. Negative evidence is first-class

Missing records and broken expectations are not treated as invisible absence. They are modeled as findings.

That means the system can say:

- this must have happened, but did not
- this record must have existed, but was absent
- this contract was expected, but no valid crossing was observed

That is operationally important.

## 4. What belongs in the model

Publicly, we describe:

- components
- ports
- contracts
- boundary events
- evidence
- expectations
- findings
- artifact families
- log integrity
- supporting entities such as identity, session, service, and endpoint

## 5. Why this is useful

This model helps unify:

- identity and entity analytics
- security and resilience analysis
- operator workflows
- provenance and audit
- public-safe explanation of cross-boundary control

## 6. Public-safe boundary

We publish the model and its rationale.

We do not publish:

- sensitive collection logic
- exploit-oriented instrumentation
- tactical evasion details
- private runbooks or deployment secrets

## 7. Related references

- [Entity Analytics Reference](./entity-analytics-reference)
- [Provenance, Promotion, and Reversibility](./provenance-promotion-and-reversibility)
- [Public vs Restricted Security Boundary](./public-vs-restricted-security-boundary)

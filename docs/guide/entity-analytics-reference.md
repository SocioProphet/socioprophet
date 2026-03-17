# Entity Analytics Reference

Entity Analytics is a first-class SocioProphet surface for identity-aware, policy-constrained, proof-producing analytics.

This document is the technical reference page for the surface. It is intentionally written as a manual rather than a marketing summary.

## Problem statement

Conventional entity resolution systems optimize for linkage yield. They merge aggressively, suppress ambiguity, and often treat the person as a single ambient object.

SocioProphet does not accept that model as safe by default.

The system must support:
- typed event ingestion
- scoped identity composition
- governed candidate linkage
- policy-constrained merge and unmerge
- proof-producing export
- child-, guardian-, and institution-safe defaults

## Formal objects

### Event-IR

We model each event as a typed record:

$$
e_t = (a_t, s_t, \alpha_t, \phi_t, \tau_t, \pi_t, \epsilon_t)
$$

where:

- $a_t$ is the actor reference
- $s_t$ is the scope or domain context
- $\alpha_t$ is the action type
- $\phi_t$ is the feature-atom bundle
- $\tau_t$ is time
- $\pi_t$ is policy-relevant metadata
- $\epsilon_t$ is evidence / provenance

### Feature map

A feature extraction function maps the event into a typed vector:

$$
x_t = f(e_t) \in \mathbb{R}^d
$$

The important point is not just vectorization. It is that the vector remains attached to scope, provenance, and policy context.

### Entity state

A candidate entity state can be represented as an aggregate over scoped events:

$$
E_i = \sum_{t \in T_i} w_t x_t
$$

where $T_i$ is the event set associated with entity candidate $i$ and $w_t$ is a weighting function over recency, confidence, and scope relevance.

## Graph model

We prefer a governed graph over a monolithic profile.

Let:

$$
G = (V_E, V_C, V_P, E)
$$

where:

- $V_E$ are entity candidates
- $V_C$ are contexts or scopes
- $V_P$ are policy and proof nodes
- $E$ are typed edges such as asserted, candidate, blocked, inherited, guardian-linked, institution-linked, or revoked

A useful link is not automatically an allowed merge.

## Candidate generation

For an entity candidate $i$, a candidate set can be defined as:

$$
\mathcal{C}(i) = \operatorname{topK}\big(g(E_i, E_j, R_{ij}, C_{ij})\big)
$$

where:

- $R_{ij}$ is relationship evidence
- $C_{ij}$ is context compatibility
- $g$ is the candidate scoring function

## Policy-constrained merge rule

A merge score alone is insufficient.

Let:

$$
\sigma_{ij} = g(E_i, E_j, R_{ij}, C_{ij})
$$

and let the policy gate be:

$$
\Gamma_{ij} \in \{\mathrm{allow},\ \mathrm{review},\ \mathrm{block}\}
$$

Then merge is legal only if:

$$
M_{ij} = 1 \iff \sigma_{ij} \ge \theta \land \Gamma_{ij} = \mathrm{allow}
$$

This is the central rule.

High-confidence evidence can still be vetoed when the merge would create unacceptable cross-context leakage.

## Unmerge rule

Unmerge is a first-class operation.

If a merge is later found to be harmful, incorrect, or policy-incompatible, the system must support:

- rollback of the entity contraction
- preservation of the evidence trail
- explanation of why the merge was reversed
- regeneration of downstream proofs

In other words, the entity graph must remain **replayable**, not merely mutable.

## Cross-context leakage invariant

If two scopes are policy-incompatible, the system must not allow a merge or export path that collapses them into a shared downstream identity surface.

A simple invariant is:

$$
B(c_i, c_j) = 1 \Rightarrow M_{ij} = 0
$$

where $B$ is the policy block matrix over context classes.

## Worked example: Michael cross-context

Michael is simultaneously:

- a patient
- a parent
- a learner
- a citizen
- a digital participant

Let the scope set be:

$$
\mathcal{S} = \{\mathrm{medical},\ \mathrm{parent},\ \mathrm{academy},\ \mathrm{citizen},\ \mathrm{adtech}\}
$$

Suppose evidence suggests that several records refer to the same human being. A conventional ER system might collapse all of them into one master profile.

SocioProphet does not do that automatically.

### Allowed reasoning

The system may conclude:
- the parent and academy records are plausibly related under supervised family / education context
- the citizen and digital participant records may share public-facing continuity
- the patient context has strong evidence overlap with the same human actor

### Forbidden propagation

The system must still block operations such as:
- exporting medical context into ad-tech segmentation
- collapsing child/guardian supervision records into unrestricted self-service provider connection
- treating all scopes as equally routable to every capability backend

### Technical interpretation

Evidence can acknowledge shared human reference without permitting unsafe cross-context operational collapse.

That is the difference between:
- **identity awareness**
and
- **identity exploitation**

## Marketer-safe export

Exports are not raw identity dumps.

A marketer-safe export function can be represented as:

$$
y = h(G, \Pi_{\mathrm{export}})
$$

where $\Pi_{\mathrm{export}}$ is the export policy.

The output may include:
- coarse cohorts
- bounded topic summaries
- time-windowed signals
- proof artifacts about excluded contexts

The output must *not* silently include blocked contexts just because the system could infer them.

## Child and guardian constraints

Minor and guardian-linked actors are not treated as ordinary unrestricted accounts.

The entity layer must respect:
- guardian-linked supervision
- institution-governed participation
- capability restrictions by participant class
- stricter merge and export constraints for protected actors

In effect, policy is not downstream of analytics. Policy is part of analytics.

## Merge and unmerge state machine

A practical lifecycle is:

1. observed
2. candidate
3. review-required
4. allowed
5. merged
6. blocked
7. revoked
8. unmerged

This state machine should be externally legible to operators and internally reproducible from evidence + policy.

## Operational consequences for product surfaces

Entity Analytics is not isolated.

It directly supports:
- **Digital** through trust, visibility, and reputation continuity
- **Auth / Connections** through capability attachment and scope-aware identity routing
- **Organizations** through institution-governed roles and participant classes
- **Academy** through safeguarding, guardian rights, and protected minor participation

## Non-goals

Entity Analytics does not exist to maximize linkage for its own sake.

It exists to maximize **safe, governed, reviewable usefulness**.

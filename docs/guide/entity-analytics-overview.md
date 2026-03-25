# Entity Analytics Overview

Entity Analytics is the governed identity, event, graph, merge, and proof layer inside SocioProphet.

This page is the readable overview of the subsystem. The canonical technical manual remains the [Entity Analytics Reference](/guide/entity-analytics-reference).

## 1. What Entity Analytics is

Entity Analytics exists because identity, events, graph structure, policy, and proof cannot be treated as unrelated layers.

The subsystem brings those pieces together so the platform can:

- model people and entities without collapsing everything into one ambient profile
- preserve identity-relevant context across scopes
- link or merge only under governance
- emit proof-bearing outputs
- keep reversal and auditability first-class

This is not a generic CRM layer and not a conventional enterprise ER engine.

## 2. Why it exists

Traditional entity resolution optimizes for linkage accuracy under organizational control.

Entity Analytics optimizes for a stricter set of goals:

- preserve identity boundaries
- permit governed linkage where justified
- block unsafe merge and export paths
- keep cross-context harm visible
- attach evidence and policy to consequential transitions
- preserve reversibility when later evidence or review changes the picture

That is why the subsystem matters to the broader platform.

## 3. Core building blocks

### Typed events

Every observation enters as a typed event rather than a generic row.

The system records:

- actor
- scope
- action
- time
- features
- evidence
- identity-relevant context

This gives the platform a stronger basis for explanation and review.

### Identity-prime structure

Entity Analytics treats identity as structured composition rather than one undifferentiated blob.

The public claim is simple:

- different contexts can relate
- different contexts can remain separate
- different contexts can merge under policy
- different contexts can remain blocked from one another

That is the foundation of the identity-prime model.

### Scopes

Scope is first-class.

A scope can refer to:

- device
- process
- container
- app
- institution
- jurisdiction
- network class
- other trust-relevant boundary

Scope matters because a valid relation in one scope does not automatically become a valid merge or export in a wider one.

### Governed graph

The system prefers a governed graph rather than a monolithic profile.

The graph can preserve:

- candidate links
- asserted links
- merges
- blocked relations
- revoked relations
- unmerge lineage
- proof artifacts

This keeps the system honest about uncertainty, policy, and reversal.

### Proof artifacts

Every high-consequence transition can emit a proof artifact carrying:

- claim
- evidence
- policy context
- input hashes
- witnesses
- replay hooks
- signatures
- failure or counterexample traces where relevant

That is what turns analytics into something reviewable.

## 4. What makes it different

Entity Analytics differs from ordinary enterprise identity systems in several ways.

### It treats identity boundaries as real

The system does not assume that maximum merge is the right outcome.

### It separates evidence from admissibility

A high-confidence link does not automatically become an allowed merge.

### It separates merge from export

A valid merge still does not automatically become an allowed export.

### It keeps reversal first-class

Unmerge is not treated as embarrassment or system failure. It is part of the design.

### It preserves public-safe proof

The system can explain what happened without exposing restricted tactical internals.

## 5. Public-safe outputs

Entity Analytics can produce useful outputs without exporting the whole person.

Public-safe outputs include things such as:

- bounded cohorts
- coarse topic mixtures
- time-windowed aggregates
- suppression-aware segments
- proof-carrying summaries

Each output can be explained in terms of:

- what classes of inputs contributed
- what contexts were excluded
- what coarsening was applied
- why the output remained policy-safe

## 6. Relationship to the broader platform

Entity Analytics is one of the core governed subsystems inside SocioProphet.

It connects directly to:

- [Organizations Governance and Institutional Safety](/guide/organizations-governance-and-institutional-safety)
- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Agent Plane and Operator Workflows](/guide/agent-plane-and-operator-workflows)
- [Boundary-Centric Cyber Hypergraph](/guide/boundary-centric-cyber-hypergraph)
- [Authorized Cyberdefense and Simulation](/guide/authorized-cyberdefense-and-simulation)

That is why the subsystem matters beyond analytics alone.

## 7. Reading paths

### Read the full technical manual
- [Entity Analytics Reference](/guide/entity-analytics-reference)

### Read the worked example
- [Worked Example: Michael Cross-Context](/guide/worked-example-michael-cross-context)

### Read the narrower companion pages
- [Identity Prime and Event-IR](/guide/identity-prime-and-event-ir)
- [Entity Graph and Safe Linkage](/guide/entity-graph-and-safe-linkage)
- [Policy-Constrained Merging and Unmerge](/guide/policy-constrained-merging-and-unmerge)
- [Marketer-Safe Outputs and Segment Proofs](/guide/marketer-safe-outputs-and-segment-proofs)

## 8. Use this page

Use this page when the question is:

- What is Entity Analytics at a high level?
- Why is it different from ordinary ER or CRM logic?
- How do events, identity, scope, graph state, merge controls, and proof fit together?
- Where do I go next for the full technical model?

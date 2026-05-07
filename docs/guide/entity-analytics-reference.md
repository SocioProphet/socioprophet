# Entity Analytics Reference

Entity Analytics is the governed identity, event, graph, merge, and proof subsystem of SocioProphet.

This page is the canonical public technical manual for the system. It explains how typed events, identity-prime structure, scopes, graph state, policy gates, and proof artifacts fit together.

Entity Analytics is not a generic CRM profile layer and not a conventional enterprise entity-resolution engine. It is a governed analytics system built to preserve identity boundaries, bound cross-context reasoning, and emit evidence-bearing results.

## 1. System purpose

Classical entity resolution tries to maximize correct linkage under organizational control.

Entity Analytics optimizes for a different objective:

- preserve identity boundaries
- permit governed linkage where justified
- block unsafe merge or export paths
- attach policy and proof to consequential transitions
- keep reversal and auditability first-class

The system exists because institutional analytics, identity, policy, and safety cannot be treated as unrelated layers.

## 2. Core thesis

The core thesis is:

**Identity is prime.**

A person is not modeled as one undifferentiated ambient profile. A person is represented as a structured composition of irreducible identity-relevant contexts that may relate, remain separate, merge under policy, or remain blocked.

That leads to a stricter sequence than conventional ER systems use.

The system asks:

1. are these records evidentially related
2. may they be linked
3. may they be merged
4. may the merge be exported across scope
5. can the decision be replayed and explained later

Evidence proposes. Policy disposes. Proof preserves the result.

## 3. Core objects

Entity Analytics operates over five first-class object families:

- events
- scopes
- entities
- links
- proof artifacts

### 3.1 Events

Every observation enters as a typed event rather than a generic row.

A typed Event-IR object is:

$$
e = (\mathrm{ts}, \mathrm{actor}, \mathrm{scope}, \mathrm{action}, \mathrm{primes}, \mathrm{features}, \mathrm{evidence})
$$

where:

- $\mathrm{ts}$ is timestamp and ordering metadata
- $\mathrm{actor}$ is the tentative subject or actor handle
- $\mathrm{scope}$ is the execution or trust context
- $\mathrm{action}$ is the event kind
- $\mathrm{primes}$ is the identity-prime mixture
- $\mathrm{features}$ is a typed feature map
- $\mathrm{evidence}$ is the provenance and witness bundle

Event-IR preserves not only that something happened, but where it happened, under what trust regime, with which identity-relevant context, and with what evidence.

### 3.2 Scopes

A scope is first-class:

$$
s := (\text{device}, \text{process}, \text{container}, \text{app}, \text{institution}, \text{jurisdiction}, \text{network-class}, \dots)
$$

with partial order:

$$
s \preceq s'
$$

meaning that $s'$ is wider, less trusted, or less local than $s$.

Scope transitions are semantic transitions. They determine what kind of linkage, merge, export, and promotion is even admissible.

### 3.3 Entities and links

The system prefers a governed graph over a monolithic profile.

Nodes include:

- tentative entities
- asserted entities
- scoped personas
- devices
- identifiers
- institutions
- proof artifacts

Edges include:

- candidate-link
- asserted-link
- merged-with
- blocked-by-policy
- exported-to
- revoked-link
- unmerged-from
- witnessed-by

A relation can be useful without becoming a merge. A merge can be admissible without becoming exportable. A graph edge can be evidentially strong and still remain policy-blocked.

### 3.4 Proof artifacts

Every high-consequence operation produces or updates a proof artifact $\Pi$.

A proof artifact carries:

- claim
- input hashes
- policy and model versions
- domains used
- evidence atoms
- witnesses
- precision deltas
- decision result
- counterexample trace on failure
- replay hooks
- signatures

The artifact is how the system moves from “we think this happened” to “we can replay what happened and explain why.”

When those proof artifacts need to cross public-safe review, audit, disclosure, or replay boundaries, they can be packaged through the platform’s `ProofPack` profile rather than treated as an unrelated proof model.

Companion reference:
- [ProofPack and Entity Proof Contract](/guide/proofpack-and-entity-proof-contract)

## 4. Identity-prime basis

Fix a finite prime-topic basis

$$
\mathcal{P} = \{p_1, \dots, p_k\}.
$$

Each $p_i$ is an irreducible identity-relevant context such as patient, parent, citizen, founder, learner, creator, or worker.

A topic mixture is represented as:

$$
u = (u_1,\dots,u_k)\in\mathbb{N}^k
$$

with additive composition:

$$
u \oplus v := u + v.
$$

For policy checks we frequently use a binarized activation vector:

$$
b(u)\in\{0,1\}^k
$$

where each coordinate records whether the corresponding prime is active.

A scalar encoding may also be used:

$$
\mathrm{enc}(u) := \prod_{i=1}^{k}\ell(p_i)^{u_i}
$$

for injective prime labeling $\ell:\mathcal{P}\to\mathbb{P}$.

This gives the system a compositional identity model that remains factorizable, typed, and auditable.

## 5. Type system and evidence classes

Entity Analytics uses a typed discipline because untyped evidence collapses too easily into ambient leakage.

### 5.1 Feature atoms

Features are typed atoms such as:

- stable identifier
- soft identifier
- temporal signal
- network relation
- device handle
- consent witness
- institutional assertion
- secret-bearing token
- derived cohort label

Each feature atom carries:

- origin scope
- extraction method
- quality or confidence
- allowed uses
- forbidden downstream scopes
- retention policy

### 5.2 Evidence classes

Evidence is partitioned into classes:

- direct evidence
- relational evidence
- scope evidence
- policy evidence
- witness evidence
- contradiction evidence

Contradiction evidence does not get averaged away by raw confidence. A protected-context contradiction can veto an otherwise high-scoring merge.

### 5.3 Link states

A proposed relation can occupy states such as:

- proposed
- linked
- review-required
- merged
- blocked
- revoked
- unmerged

The system preserves transitions, not only final states.

## 6. Invariants

The following invariants govern the system.

### 6.1 Identity-prime non-collapse

No operation may silently collapse incompatible prime-bearing contexts into one ambient identity merely because evidential similarity is high.

### 6.2 Scope monotonicity for protected data

Protected evidence may not move to a wider scope unless an admissibility rule and witness authorize that move.

### 6.3 Proof-producing decisions

Every merge, block, unmerge, export, suppression, and review escalation must be reconstructible from artifact state.

### 6.4 Reversibility

Unsafe merges are not terminal. Unmerge is first-class.

### 6.5 Evidence provenance preservation

No downstream aggregate may erase the provenance chain required to explain how the result was formed.

## 7. Resolution and decision pipeline

Evidence does not go directly to merge. The pipeline is ordered.

### 7.1 Ingest

Typed events are normalized into Event-IR with scope, primes, feature atoms, and evidence provenance.

### 7.2 Candidate generation

Candidate links are generated using:

- stable identifiers
- relational evidence
- durable device links
- institutionally asserted joins
- bounded heuristics

### 7.3 Evidence scoring

For a pair $(r,r')$, comparator evidence is:

$$
\phi(r,r')\in\mathbb{R}^{d}
$$

with additive score:

$$
S(r,r')=\sum_{t=1}^{T}\alpha_t h_t(\phi(r,r')).
$$

This score is an evidence ledger, not permission to merge.

### 7.4 Policy gating

Let $\sigma_{ij}$ be the evidential score and let

$$
\Gamma_{ij}\in\{\mathrm{allow},\mathrm{review},\mathrm{block}\}
$$

be the policy gate.

Then:

$$
M_{ij}=1 \iff \sigma_{ij}\ge\theta \land \Gamma_{ij}=\mathrm{allow}.
$$

A high score with a blocked gate still yields no merge.

### 7.5 Merge materialization

A merge creates a governed graph transition and updates proof lineage. It does not erase the prior scoped distinction.

### 7.6 Export and suppression

Even after a valid merge, exports remain separately governed. A merged graph state may still yield only bounded, coarsened, or suppressed outputs.

## 8. Policy model

### 8.1 Policy polytope

For binary prime activation vector

$$
v\in\{0,1\}^{k}
$$

define allowed region:

$$
K=\{x\in\mathbb{R}^{k}\mid Ax\le b,\;0\le x\le 1\}.
$$

A discrete configuration is admissible only if

$$
v\in K\cap\{0,1\}^{k}.
$$

This gives a compact representation of allowed mixtures and forbidden co-activations.

### 8.2 Harm and review zones

Policy distinguishes:

- automatically allowed
- automatically blocked
- review-required
- witness-required
- local-only or citizen-cloud-only
- coarsened-export-only

Not all non-allowed states are equally severe. The public model still needs review zones, not only binary allow/deny.

### 8.3 Counting and risk

The Ehrhart-style count

$$
L_{K}(t)=|tK\cap\mathbb{Z}^{k}|
$$

is useful as an intuition for combinatorial optionality, profiling surface, and search complexity.

## 9. Merge, split, and unmerge semantics

### 9.1 Merge

A merge is the creation of a stronger governed relation under admissible evidence and policy.

### 9.2 Split

A split partitions an entity view into narrower scoped subviews without necessarily asserting prior harm.

### 9.3 Unmerge

An unmerge is a reversal event triggered by:

- new contradiction evidence
- policy discovery
- witness revocation
- harmful ambient leakage
- operator review outcome

Unmerge preserves:

- original evidence atoms
- prior decision artifact
- reversal reason
- affected outputs
- downstream remediation context

## 10. Congruence domains and non-escape

Handles, nonces, counters, and namespace-reserved identifiers often live in modular domains.

A congruence abstract value is represented as:

$$
x \in a\mathbb{Z}+b \pmod m.
$$

If a token or handle is typed as $\mathrm{NoEscape}(h,\mathrm{HSM})$, then no congruent representative of its reserved namespace may appear in a wider scope unless an explicit audited witness authorizes the transition.

This lets the system treat replay and namespace leakage as semantic violations rather than mere logging anomalies.

## 11. Marketer-safe outputs

Entity Analytics can emit useful outputs without exporting the whole person.

Allowed outputs may include:

- bounded cohorts
- coarse topic mixtures
- time-windowed aggregates
- suppression-aware segments
- proof-carrying summaries

Each output carries enough metadata to show:

- what classes of inputs contributed
- what contexts were excluded
- what coarsening was applied
- why the export remained policy-safe

## 12. Failure modes

Major failure modes include:

- high-confidence but policy-forbidden merges
- protected-context leakage through export
- irreversible ambient profile construction
- contradiction suppression
- review bypass
- non-replayable decisions
- namespace escape of secret-bearing handles

The system is designed so these surface as artifacts, blocked edges, or counterexample traces rather than invisible harm.

## 13. Relation to the broader platform

Entity Analytics is not isolated.

It connects directly to:

- [Organizations Governance and Institutional Safety](/guide/organizations-governance-and-institutional-safety)
- [Governed AI and Cybernetics](/guide/governed-ai-and-cybernetics)
- [Agent Plane and Operator Workflows](/guide/agent-plane-and-operator-workflows)
- [Boundary-Centric Cyber Hypergraph](/guide/boundary-centric-cyber-hypergraph)
- [Cross-Lane Artifact Canon](/guide/cross-lane-artifact-canon)

## 14. Operator checklist

Before approving a merge or export, confirm:

1. evidence sufficiency
2. scope compatibility
3. prime-mixture admissibility
4. witness presence where required
5. export safety independent of merge validity
6. replayable proof artifact generation
7. reversibility path if later contradicted

## 15. Companion pages

This page is the canonical technical reference.

Companion pages provide narrower entry points:

- [Entity Analytics Overview](/guide/entity-analytics-overview)
- [Identity Prime and Event-IR](/guide/identity-prime-and-event-ir)
- [Entity Graph and Safe Linkage](/guide/entity-graph-and-safe-linkage)
- [Policy-Constrained Merging and Unmerge](/guide/policy-constrained-merging-and-unmerge)
- [Marketer-Safe Outputs and Segment Proofs](/guide/marketer-safe-outputs-and-segment-proofs)
- [Worked Example: Michael Cross-Context](/guide/worked-example-michael-cross-context)
- [ProofPack and Entity Proof Contract](/guide/proofpack-and-entity-proof-contract)

Use the companion pages for focused reading. Use this page for the full public technical model.

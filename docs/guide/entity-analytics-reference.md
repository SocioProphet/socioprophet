# Entity Analytics Reference

Entity Analytics is SocioProphet’s identity-aware, policy-constrained, proof-producing analytics system for building governed entity graphs without collapsing a person into one unsafe ambient profile.

This document is the operator manual and technical reference for the system. It defines the model, invariants, execution order, proof artifacts, and failure semantics for safe linkage, merge, unmerge, suppression, and bounded export.

## 1. System purpose

Classical entity resolution tries to maximize correct linkage under organizational control. Entity Analytics instead optimizes for safe linkage under citizen-first control, where a linkage can be useful, reviewable, reversible, and still forbidden from becoming a merge or an export.

The governing thesis is:

> Identity is prime.

A person is not modeled as one blob. A person is represented as a structured composition of irreducible identity-relevant contexts, each of which may participate differently across devices, institutions, jurisdictions, relationships, and applications.

The system therefore answers five different questions, not one:

1. Are these records evidentially related?
2. May they be linked?
3. May they be merged?
4. May that merge be exported into another scope?
5. Can we prove afterward what was allowed, blocked, suppressed, or reversed?

## 2. Core objects

The system operates over five first-class object families:

- events
- scopes
- entities
- links
- proof artifacts

### 2.1 Events

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

Event-IR exists so that the system can preserve not just that something happened, but where it happened, under what trust regime, with what identifiers, and with what auditability.

### 2.2 Identity-prime basis

Fix a finite prime-topic basis

$$
\mathcal{P} = \{p_1, \dots, p_k\}.
$$

Each $p_i$ is an irreducible identity-relevant context such as patient, parent, citizen, founder, learner, creator, or worker. These are not marketing labels; they are policy-bearing semantic dimensions.

A topic mixture is represented as:

$$
u = (u_1,\dots,u_k)\in\mathbb{N}^k
$$

with additive composition

$$
u \oplus v := u + v.
$$

For policy checks we often use a binarized activation vector

$$
b(u)\in\{0,1\}^k
$$

where each coordinate records whether the corresponding prime is active.

A scalar encoding may also be used:

$$
\mathrm{enc}(u) := \prod_{i=1}^{k}\ell(p_i)^{u_i}
$$

for injective prime labeling $\ell:\mathcal{P}\to\mathbb{P}$.

This gives us a compositional representation that supports factor reasoning, topic activation, and irreversible-audit-friendly decomposition.

### 2.3 Scopes

A scope is first-class:

$$
s := (\text{device}, \text{process}, \text{container}, \text{app}, \text{institution}, \text{jurisdiction}, \text{network-class}, \dots)
$$

with a partial order $s \preceq s'$ meaning that $s'$ is wider, less trusted, or less local than $s$.

Scopes are not cosmetic metadata. Scope changes are semantic events because they determine what linkage, merge, export, or replay action is even admissible.

### 2.4 Entity graph

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

A link can be useful without being mergeable. A merge can be valid without being exportable. A relationship can be evidentially strong and still policy-forbidden.

### 2.5 Proof artifacts

Every high-consequence operation produces or updates a proof artifact $\Pi$ containing:

- claim
- input hashes
- model and policy versions
- domains used
- evidence atoms
- witnesses
- precision deltas
- decision result
- counterexample trace on failure
- replay hooks
- signatures

The proof artifact is how the system moves from “we think” to “we can replay and show why.”

## 3. Type system

Entity Analytics uses a typed discipline because untyped evidence becomes ambient leakage.

### 3.1 Feature atoms

Features are not one flat dictionary. They are typed atoms such as:
- stable identifier
- soft identifier
- temporal signal
- network relation
- device handle
- consent witness
- institutional assertion
- secret-bearing token
- derived cohort label

Each feature atom has:
- origin scope
- extraction method
- confidence or quality
- allowed uses
- forbidden downstream scopes
- retention policy

### 3.2 Evidence classes

Evidence is partitioned into classes:

- direct evidence
- relational evidence
- scope evidence
- policy evidence
- witness evidence
- contradiction evidence

This matters because contradiction evidence must not be averaged away by raw confidence. A single protected-context contradiction can veto an otherwise high-scoring merge.

### 3.3 Link states

A proposed relation between records or entities can be in one of the following states:

- proposed
- linked
- review-required
- merged
- blocked
- revoked
- unmerged

The system must preserve state transitions, not just final outcomes.

## 4. Invariants

The following invariants govern the system.

### 4.1 Identity-prime non-collapse

No operation may silently collapse incompatible prime-bearing contexts into one ambient profile merely because evidential similarity is high.

### 4.2 Scope monotonicity for protected data

Protected evidence may not move to a wider scope unless an explicit admissibility rule and witness authorize that move.

### 4.3 Proof-producing decisions

Every merge, block, unmerge, export, suppression, and review escalation must be reconstructible from artifact state.

### 4.4 Reversibility

Unsafe merges are not terminal. Unmerge is a first-class operation with retained evidence lineage.

### 4.5 Evidence provenance preservation

No downstream aggregate may erase the provenance chain required to explain how the result was formed.

## 5. Resolution and decision pipeline

The pipeline is ordered. Evidence does not go directly to merge.

### 5.1 Ingest

Typed events are normalized into Event-IR with scope, primes, feature atoms, and evidence provenance.

### 5.2 Candidate generation

Candidate links are generated using stable identifiers, relational evidence, durable device links, institutionally asserted joins, or bounded heuristics.

### 5.3 Evidence scoring

For a pair $(r,r')$, comparator evidence is

$$
\phi(r,r')\in\mathbb{R}^{d}
$$

with additive score

$$
S(r,r')=\sum_{t=1}^{T}\alpha_t h_t(\phi(r,r')).
$$

This score is an evidence ledger, not permission to merge.

### 5.4 Policy gating

Let $\sigma_{ij}$ be the evidential score and let

$$
\Gamma_{ij}\in\{\mathrm{allow},\mathrm{review},\mathrm{block}\}
$$

be the policy gate. Then

$$
M_{ij}=1 \iff \sigma_{ij}\ge\theta \land \Gamma_{ij}=\mathrm{allow}.
$$

Evidence proposes; policy disposes.

### 5.5 Merge materialization

A merge creates a governed graph state transition and updates artifact lineage. It does not retroactively erase prior scoped separation.

### 5.6 Export and suppression

Even after a valid merge, exports remain separately governed. A merged graph state may still produce only bounded, coarsened, or suppressed outputs.

## 6. Policy model

### 6.1 Policy polytope

For binary prime activation vector

$$
v\in\{0,1\}^{k}
$$

define allowed region

$$
K=\{x\in\mathbb{R}^{k}\mid Ax\le b,\;0\le x\le 1\}.
$$

A discrete configuration is admissible only if

$$
v\in K\cap\{0,1\}^{k}.
$$

This provides a compact representation of allowed prime mixtures and forbidden co-activations.

### 6.2 Harm and review zones

Not all non-allowed states are equally bad. Policy must distinguish:
- automatically allowed
- automatically blocked
- review-required
- allowed only with witness
- allowed only for local or citizen-cloud scopes
- allowed only as coarsened export

### 6.3 Counting and risk

The Ehrhart-style count

$$
L_{K}(t)=|tK\cap\mathbb{Z}^{k}|
$$

is useful as an intuition for combinatorial optionality, profiling surface, and search complexity. Operationally, it helps reason about how many safe identity configurations remain after policy tightening and where over-determination risk increases.

## 7. Merge, split, and unmerge semantics

### 7.1 Merge

A merge is the creation of a stronger graph relation under admissible evidence and policy.

### 7.2 Split

A split partitions an entity view into narrower scoped subviews without necessarily asserting prior harm.

### 7.3 Unmerge

An unmerge is a first-class reversal event triggered by:
- new contradiction evidence
- policy discovery
- witness revocation
- harmful ambient leakage
- operator review outcome

Unmerge must preserve:
- original evidence atoms
- prior decision artifact
- reversal reason
- affected outputs
- required downstream remediations

## 8. Congruence domains and non-escape

Handles, nonces, counters, and namespace-reserved identifiers often live in modular domains.

A congruence abstract value is represented as

$$
x \in a\mathbb{Z}+b \pmod m.
$$

If a token or handle is typed as $\mathrm{NoEscape}(h,\mathrm{HSM})$, then no congruent representative of its reserved namespace may appear in a wider scope unless an explicit audited witness authorizes the transition.

This is how the system treats replay and namespace leakage as semantic violations, not merely logging anomalies.

## 9. Marketer-safe outputs

The system may emit useful outputs without exporting the whole person.

Allowed outputs may include:
- bounded cohorts
- coarse topic mixtures
- time-windowed aggregates
- suppression-aware segments
- proof-carrying summaries

Each output must carry enough metadata to show:
- what classes of inputs contributed
- what contexts were excluded
- what coarsening was applied
- why the export remained policy-safe

## 10. Failure modes

Major failure modes include:
- high-confidence but policy-forbidden merges
- protected-context leakage through export
- irreversible ambient profile construction
- contradiction suppression
- review bypass
- non-replayable decisions
- namespace escape of secret-bearing handles

The system is designed so that these surface as artifacts, blocked edges, or counterexample traces rather than as invisible harm.

## 11. Operator checklist

Before approving a merge or export, confirm:

1. evidence sufficiency
2. scope compatibility
3. prime-mixture admissibility
4. witness presence where required
5. export safety independent of merge validity
6. replayable proof artifact generation
7. reversibility path if later contradicted

## 12. Companion documents

This manual is the canonical reference. Companion pages provide narrower entry points:
- Identity Prime and Event-IR
- Entity Graph and Safe Linkage
- Policy-Constrained Merging and Unmerge
- Marketer-Safe Outputs and Segment Proofs
- Worked Example: Michael Cross-Context

Those pages must deep-link into this manual’s sections rather than duplicate its full substance.

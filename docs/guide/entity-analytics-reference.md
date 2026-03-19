# Entity Analytics Reference

Entity Analytics is a first-class SocioProphet surface for identity-aware, policy-constrained, proof-producing analytics.

This document is a technical reference manual, not a product summary.

## 1. System thesis

We are building a personal identity, privacy, and security stack that treats a human's digital life as something to be accounted for, constrained, audited, and proven.

The core move is:

> **Identity is prime.**
> A person is not one blob. Identity is a structured composition of irreducible prime topics (roles / contexts) that must not be merged or leaked across scopes without explicit, provable authorization.

Classical enterprise ER optimizes for stable linkage under organizational control.
This system optimizes for **safe linkage with provable non-leak guarantees** under citizen-first, fog-first control.

## 2. Prime topics and identity composition

Fix a finite prime-topic basis

$$
\mathcal{P} = \{p_1, \dots, p_k\}.
$$

Each \(p_i\) is an irreducible identity-relevant context such as patient, parent, citizen, creator, or founder.

We model topic composition as a free commutative monoid over \(\mathbb{N}^k\):

$$
e = (e_1, \dots, e_k), \qquad
e \oplus e' := e + e'.
$$

A scalar prime encoding can also be used:

$$
\mathrm{enc}(e) := \prod_{i=1}^k \ell(p_i)^{e_i}
$$

for an injective labeling \(\ell : \mathcal{P} \to \mathbb{P}\), where \(\mathbb{P}\) is the set of prime numbers.

## 3. Scope, capabilities, and Event-IR

A scope is first-class:

$$
s := (\text{device}, \text{process}, \text{container}, \text{app}, \text{jurisdiction}, \text{network-class}, \dots)
$$

with a partial order \(s \preceq s'\) meaning \(s'\) is wider / less trusted.

The typed Event-IR is:

$$
e = (\mathrm{ts}, \mathrm{actor}, \mathrm{scope}, \mathrm{action}, \mathrm{primes}, \mathrm{features}, \mathrm{evidence})
$$

where:
- \(\mathrm{ts}\) is time
- \(\mathrm{actor}\) is the subject
- \(\mathrm{scope}\) is the scope
- \(\mathrm{action}\) is an event kind
- \(\mathrm{primes} \in \mathbb{N}^k\) is the prime-topic exponent vector
- \(\mathrm{features}\) is a typed feature map
- \(\mathrm{evidence}\) contains counters, nonces, handles, hashes, provenance

## 4. Entity resolution as constrained inference

Let \(R\) be the record set.
For a pair \((r,r')\), define comparator evidence:

$$
\phi(r,r') \in \mathbb{R}^d
$$

and an additive score:

$$
S(r,r') := \sum_{t=1}^{T}\alpha_t h_t(\phi(r,r')).
$$

This is not “ML magic.” It is an additive evidence ledger.

### 4.1 Policy-constrained merging

A merge is admissible iff:

1. ER evidence is sufficient
2. the merge does not violate the identity-prime policy polytope
3. the merge preserves non-escape invariants when secrets or protected contexts are involved

Formally, if \(\sigma_{ij}\) is the merge score and \(\Gamma_{ij}\in\{\mathrm{allow}, \mathrm{review}, \mathrm{block}\}\) is the policy gate, then

$$
M_{ij} = 1 \iff \sigma_{ij} \ge \theta \land \Gamma_{ij} = \mathrm{allow}.
$$

Evidence proposes; policy disposes.

## 5. Policy polytopes

For policy checks we often binarize the active topic mixture into

$$
v \in \{0,1\}^k.
$$

A convex relaxation of the allowed state region is

$$
K := \{x \in \mathbb{R}^k \mid A x \le b,\; 0 \le x \le 1\}.
$$

A discrete topic mixture is allowed iff

$$
v \in K \cap \{0,1\}^k.
$$

### 5.1 Counting / risk

For a rational polytope \(K\), the Ehrhart function is

$$
L_K(t) := |tK \cap \mathbb{Z}^k|, \qquad t \in \mathbb{N}.
$$

We use this as intuition and approximation for:
- search complexity
- identity optionality
- over-determination / profiling risk

## 6. Congruence domains and non-escape

Attackers love modular space: nonces, counters, namespaces, handles.

A congruence abstract value is

$$
x \in a\mathbb{Z} + b \pmod m.
$$

If a handle \(h\) is created in HSM scope and typed as \(\mathrm{NoEscape}(h,\mathrm{HSM})\), then no value congruent with its reserved namespace may appear in any wider scope unless an explicit audited witness authorizes the move.

## 7. Proof artifacts

A proof artifact \(\Pi\) contains:
- the claim
- input hashes and versions
- domains used
- precision deltas
- witnesses
- counterexample trace if violated
- signatures / replay hooks

The artifact must be replayable, audit-friendly, and composable.

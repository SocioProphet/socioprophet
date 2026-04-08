# Worked Example: Michael Cross-Context

This example is intentionally synthetic, but it is written as an execution trace rather than a narrative summary. Its purpose is to show how Entity Analytics handles identity-bearing events across multiple scopes without collapsing protected contexts into one unsafe ambient profile.

We follow one actor, “Michael,” across local, citizen-cloud, institutional, and commercial systems and show:

1. how typed events are formed
2. how candidate links are proposed
3. how a merge may be evidentially strong yet policy-forbidden
4. how blocked export paths are recorded
5. how a proof artifact explains both the rejection and the safe alternative

## 1. Scenario

Michael participates in several distinct contexts:

- founder / builder
- patient
- parent
- citizen
- creator

A conventional ER stack would attempt to collapse these contexts into one maximally connected profile. Entity Analytics does not do that automatically. It evaluates evidence, scope compatibility, prime-mixture admissibility, and export safety as separate questions.

## 2. Prime-topic basis

Fix the identity-prime basis

$$
\mathcal{P}=\{p_1,p_2,p_3,p_4,p_5\}
$$

with:

- $p_1$ = Founder / Builder
- $p_2$ = Patient
- $p_3$ = Parent
- $p_4$ = Citizen
- $p_5$ = Creator

A topic mixture is represented as

$$
u=(u_1,u_2,u_3,u_4,u_5)\in\mathbb{N}^5
$$

and its binarized activation vector is

$$
b(u)\in\{0,1\}^5.
$$

For this example, the important policy fact is that any event with active Patient prime $p_2$ must not be exported into ad-tech scope.

## 3. Scope model

We use the following simplified scopes:

- $s_{\mathrm{local}}$ = local device / browser
- $s_{\mathrm{cloud}}$ = citizen cloud under user control
- $s_{\mathrm{health}}$ = institutional health portal
- $s_{\mathrm{ads}}$ = third-party ad-tech network

with trust widening order

$$
s_{\mathrm{local}} \preceq s_{\mathrm{cloud}} \preceq s_{\mathrm{health}} \preceq s_{\mathrm{ads}}.
$$

This ordering is illustrative. The important point is that ad-tech is wider and less trusted than local or citizen-cloud scope for protected identity-bearing events.

## 4. Typed event trace

We define six representative events.

### 4.1 Event E1 — health portal login

$$
E_1=(\mathrm{ts}_1,\mathrm{Michael},s_{\mathrm{health}},\mathrm{HEALTH\_PORTAL\_LOGIN},u_1,F_1,W_1)
$$

with:

- $u_1=(0,1,1,0,0)$ meaning Patient + Parent
- $F_1=\{\texttt{email\_hash},\texttt{device\_class},\texttt{session\_id}\}$
- $W_1=\{\texttt{portal\_assertion},\texttt{timestamp},\texttt{issuer}\}$

Interpretation: Michael authenticates to a health portal while acting in a medical and family context.

### 4.2 Event E2 — local browser page view

$$
E_2=(\mathrm{ts}_2,\mathrm{Michael},s_{\mathrm{local}},\mathrm{BROWSER\_PAGE\_VIEW},u_2,F_2,W_2)
$$

with:

- $u_2=(0,1,0,0,0)$ meaning Patient
- $F_2=\{\texttt{first\_party\_cookie},\texttt{url\_class},\texttt{browser\_fingerprint}\}$
- $W_2=\{\texttt{local\_event\_log},\texttt{device\_nonce}\}$

Interpretation: a local page view occurs in a patient-bearing context.

### 4.3 Event E3 — third-party pixel fire attempt

$$
E_3=(\mathrm{ts}_3,\mathrm{Michael},s_{\mathrm{ads}},\mathrm{THIRD\_PARTY\_PIXEL\_FIRE},u_3,F_3,W_3)
$$

with:

- $u_3=(0,1,0,0,0)$ meaning Patient
- $F_3=\{\texttt{third\_party\_cookie},\texttt{campaign\_id},\texttt{referer\_class}\}$
- $W_3=\{\texttt{network\_request},\texttt{destination\_domain}\}$

Interpretation: an export-like event attempts to carry patient-bearing context into ad-tech scope.

### 4.4 Event E4 — citizen cloud sync

$$
E_4=(\mathrm{ts}_4,\mathrm{Michael},s_{\mathrm{cloud}},\mathrm{LOCAL\_SYNC\_TO\_CITIZEN\_CLOUD},u_4,F_4,W_4)
$$

with:

- $u_4=(1,0,0,1,1)$ meaning Founder + Citizen + Creator
- $F_4=\{\texttt{encrypted\_bundle\_id},\texttt{device\_assertion}\}$
- $W_4=\{\texttt{sync\_receipt},\texttt{key\_id}\}$

Interpretation: a non-medical local bundle is synchronized into a citizen-cloud scope.

### 4.5 Event E5 — SSO token replay attempt

$$
E_5=(\mathrm{ts}_5,\mathrm{unknown},s_{\mathrm{ads}},\mathrm{SSO\_TOKEN\_REPLAY\_ATTEMPT},u_5,F_5,W_5)
$$

with:

- $u_5=(0,0,0,0,0)$ initially unknown
- $F_5=\{\texttt{token\_fragment},\texttt{counter\_class},\texttt{handle\_namespace}\}$
- $W_5=\{\texttt{nonce\_audit},\texttt{modulus\_class},\texttt{gateway\_log}\}$

Interpretation: an attempted replay appears in a wider scope.

### 4.6 Event E6 — marketer-safe segment export

$$
E_6=(\mathrm{ts}_6,\mathrm{segment\_job},s_{\mathrm{cloud}},\mathrm{MARKETER\_SAFE\_EXPORT},u_6,F_6,W_6)
$$

with:

- $u_6=(1,0,0,1,1)$ meaning Founder + Citizen + Creator
- $F_6=\{\texttt{coarse\_cohort},\texttt{time\_window},\texttt{count\_threshold}\}$
- $W_6=\{\texttt{policy\_version},\texttt{export\_receipt}\}$

Interpretation: the system emits a bounded export from allowed, coarsened non-patient context.

## 5. Candidate link analysis

Suppose the system proposes the following candidate relations:

- $L_{12}$ between $E_1$ and $E_2$ due to stable email hash, device continuity, and session adjacency
- $L_{23}$ between $E_2$ and $E_3$ due to browser continuity and referer overlap
- $L_{14}$ between $E_1$ and $E_4$ due to shared actor evidence but weaker topic overlap
- $L_{25}$ between $E_2$ and $E_5$ due to namespace similarity and replay indicators

These are candidate links, not final merges.

Let comparator vector be $\phi(E_i,E_j)$ and additive evidential score be

$$
S(E_i,E_j)=\sum_{t=1}^{T}\alpha_t h_t(\phi(E_i,E_j)).
$$

Assume:

- $S(E_1,E_2)=0.94$
- $S(E_2,E_3)=0.91$
- $S(E_1,E_4)=0.62$
- $S(E_2,E_5)=0.73$

with threshold $\theta=0.80$ for merge eligibility before policy.

Pure evidence would propose that $(E_1,E_2)$ and $(E_2,E_3)$ are both strong enough to consider merging.

## 6. Policy gate evaluation

Let policy gate be

$$
\Gamma_{ij}\in\{\mathrm{allow},\mathrm{review},\mathrm{block}\}.
$$

The merge rule is

$$
M_{ij}=1 \iff S(E_i,E_j)\ge\theta \land \Gamma_{ij}=\mathrm{allow}.
$$

### 6.1 Pair $(E_1,E_2)$

Both events involve protected medical context, but remain within health/local scopes and do not attempt forbidden export.

Result:

$$
\Gamma_{12}=\mathrm{review}
$$

not automatic allow, because medical context is involved and operator review may be required before a stronger merge state is asserted.

### 6.2 Pair $(E_2,E_3)$

This pair is evidentially strong but policy-forbidden because a Patient-bearing context is attempting to cross into ad-tech scope.

Define a block predicate

$$
B(\mathrm{patient},s_{\mathrm{ads}})=1.
$$

Then:

$$
B(\mathrm{patient},s_{\mathrm{ads}})=1 \Rightarrow \Gamma_{23}=\mathrm{block}
$$

and therefore

$$
M_{23}=0
$$

despite the high evidence score.

This is the central point of the system: confidence is not permission.

### 6.3 Pair $(E_1,E_4)$

This pair is weaker evidentially and spans different prime mixtures. It may remain a candidate relation without merge.

Result:

$$
\Gamma_{14}=\mathrm{review}
$$

with no materialized merge.

### 6.4 Pair $(E_2,E_5)$

Replay indicators suggest namespace or token leakage. Congruence analysis is triggered before any identity join is allowed.

Result:

$$
\Gamma_{25}=\mathrm{block}
$$

pending replay investigation.

## 7. Congruence and non-escape check

For the replay attempt $E_5$, assume token fragment class lies in congruence domain

$$
x \in a\mathbb{Z}+b \pmod m.
$$

Suppose a reserved handle namespace from a narrower trusted scope is typed as

$$
\mathrm{NoEscape}(h,\mathrm{health})
$$

or more strongly as an HSM-scoped non-exportable class.

If the observed token fragment in $E_5$ is congruent with that reserved namespace, the system records a non-escape violation candidate. That violation is not “just another feature.” It acts as contradiction or block evidence and prevents ambient linkage into ad-tech scope.

## 8. Entity graph outcome

The resulting governed graph may contain:

- asserted reviewable relation between medical/local events
- blocked edge from patient-bearing local event to ad-tech pixel event
- blocked replay-associated edge for token namespace escape
- allowed citizen-cloud export edge for coarsened non-patient output

In edge-language form:

- $E_1 \leftrightarrow E_2$ as reviewable medical/local relation
- $E_2 \not\rightarrow E_3$ as blocked-by-policy
- $E_2 \not\rightarrow E_5$ as blocked-by-non-escape / replay concern
- $E_4 \rightarrow E_6$ as allowed bounded export

## 9. Proof artifact sketch

The blocked export decision must produce an artifact $\Pi_{23}$ containing at least:

- claim: “Patient-bearing local event may be merged/exported into ad-tech scope”
- result: rejected
- evidence atoms: browser continuity, referer overlap, temporal adjacency
- blocking policy: patient-to-ad-tech forbidden
- scopes involved: $s_{\mathrm{local}}, s_{\mathrm{ads}}$
- prime mixture: Patient active
- decision rule: evidential threshold met but policy gate blocked
- counterexample trace: $(E_2,E_3)$
- replay hook: artifact and policy version hashes
- safe alternative: emit only bounded non-patient cohort output

## 10. Safe alternative

The system must not stop at “no.” It must provide the safe path.

Instead of allowing $(E_2,E_3)$ to become an exportable merge, the system permits a separate bounded job represented by $E_6$ that exports only:

- coarse cohort label
- approved time window
- thresholded counts
- no patient prime activation
- no third-party cookie identifiers
- no raw event lineage beyond artifact-safe summary

This is how usefulness is preserved without turning the platform into ambient identity extraction infrastructure.

## 11. Why this example matters

A traditional ER platform sees strong evidence and asks whether two records must be collapsed.

Entity Analytics asks a stricter sequence:

1. Is the relation evidentially real?
2. In what scope is it real?
3. Is a link allowed?
4. Is a merge allowed?
5. Is an export allowed?
6. Can the system prove why?

That difference is the whole design. The same evidence that improves linkage can also become the channel by which protected identity primes leak. The purpose of the framework is to make that channel explicit, reviewable, reversible, and provable.

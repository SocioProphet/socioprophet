# Worked Example: Michael Cross-Context

This example is intentionally synthetic. It demonstrates the mechanics of the model.

We simulate a person (“Michael”) living in the fog:

- some events happen on-device (browser, apps)
- some happen in a citizen cloud (their own encrypted sync)
- some touch institutional systems (health portal)
- some touch commercial systems (ad-tech)

Our job is:

1. build an entity graph that is accurate **and** safe
2. prove that certain identity primes (for example, patient) never leak into forbidden scopes

## 1. Prime topics for Michael

We define the prime-topic basis:

- \(p_1\): Founder / Builder
- \(p_2\): Patient
- \(p_3\): Parent
- \(p_4\): Citizen
- \(p_5\): Creator

Each event carries a prime mixture

$$
e \in \mathbb{N}^5
$$

and for policy checks we often binarize to

$$
v \in \{0,1\}^5.
$$

## 2. Privacy policy as constraints

### 2.1 Hard constraints

If \(p_2\) (Patient) is active, then:

- no third-party cookie identifiers may be exported
- no ad-tech scope may receive the event
- no cross-site tracking features may be attached to the record

### 2.2 Soft / bounded constraints

Citizen + Patient co-occurrence is permitted only in civic-health contexts, and only with explicit consent witnesses.

## 3. Synthetic event trace

Representative events include:

- `HEALTH_PORTAL_LOGIN` (primes: Patient + Parent)
- `BROWSER_PAGE_VIEW` (primes: Patient)
- `THIRD_PARTY_PIXEL_FIRE` (scope: ad-tech) should be blocked or flagged
- `SSO_TOKEN_REPLAY_ATTEMPT` (modular nonce evidence) congruence catches this
- `LOCAL_SYNC_TO_CITIZEN_CLOUD` (allowed aggregate export)

## 4. Toy analyzer

From repo root:

```bash
python -m prime_er.cli analyze \
  --in examples/michael_identity_prime_trace.jsonl \
  --policy examples/policies/default_policy.json \
  --out /tmp/michael_artifact.json
```

Optional marketer-safe segment export:

```bash
python -m prime_er.cli segment \
  --in examples/michael_identity_prime_trace.jsonl \
  --policy examples/policies/default_policy.json \
  --out /tmp/michael_segment.json
```

Precomputed outputs may also exist:

- `examples/outputs/michael_artifact.json`
- `examples/outputs/michael_segment.json`

## 5. Expected result

### 5.1 ER view

The system should still resolve Michael across devices and apps when allowed by stable evidence such as device ID, email, and durable links.

### 5.2 Identity-prime view

The system should reject or flag any event trying to attach ad-tech tracking identifiers to a Patient-labeled event.

### 5.3 Proof view

The proof artifact should contain:

- the claim being checked
- the evidence atoms used
- the policy constraints triggered
- precision metadata
- a minimal counterexample trace for any violation
- a “what would have made it safe” explanation

## 6. Technical interpretation

Let the context set be

$$
\mathcal{S} = \{\mathrm{medical}, \mathrm{parent}, \mathrm{academy}, \mathrm{citizen}, \mathrm{adtech}\}.
$$

A conventional ER stack may compress all matching evidence into one profile.

SocioProphet does not do that automatically.

If we define a block policy

$$
B(\mathrm{medical}, \mathrm{adtech}) = 1
$$

then any proposed merge or export path violating that policy is forbidden:

$$
B(c_i, c_j) = 1 \Rightarrow M_{ij} = 0.
$$

That is the heart of the system.

## 7. Why this example matters

Enterprise ER optimizes for “merge the world correctly.”

Citizen ER must also optimize for:

- don’t create identity harm
- don’t silently collapse protected contexts
- don’t export sensitive context just because the system could infer it

The same identifiers that improve linkage can also become the channel by which sensitive identity primes leak.

The point of the framework is to make that channel explicit, constrained, and provable.

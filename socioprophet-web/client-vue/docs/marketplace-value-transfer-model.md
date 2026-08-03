# Marketplace Value-Transfer & Residual-Pricing Model

**Status:** draft / design spec (not code). **Companion to** [`marketplace-federation-patterns.md`](./marketplace-federation-patterns.md) — that spec defines the offering registry, the governed action model, and the contract bindings in its **§0**; this spec **reuses those bindings** (referenced as *FED §0.#N* below) and adds the **economic-value, reward, and transfer-pricing** layer on top of them.

> **Honesty bar (carried over from the federation spec).** There is **no ΔEP / residual-pricing engine, no credits/points ledger, and no live settlement rail in the repo.** ASI/MPE is a *named* settlement asset but the clearing surface is explicitly fixture-backed — `routeRegistry.ts:602`: *"No live settlement rail (ASI/MPE) wired."* Every formula and transfer rule in this document is therefore a **PROPOSED modeling framework** over three **real** substrates the estate already ships:
> - **Settlement substrate** → the triparty netting/clearing market (`src/data/marketplaceFixture.ts`): `Cell` (legs A/B/C), `Stage` lifecycle `Observed→…→Escrowed→Filled→Verified→Released→Exported`, `TruthClass`, `Admissibility`, `netAmount`, `asset: 'ASI'`.
> - **Trust/price weighting** → HolographMe reputation (`src/features/reputation/reputation.ts`): `Reputation { score 0–100, tier, hats, attestations, disputes }`, `Tier ∈ {trusted, established, emerging, unrated}`.
> - **Knowledge term** → the reasoning-chain governed scorer, precision@1 gate, and authorship/provenance model (`src/features/reasoning-chain/*`).
>
> Nothing here asserts settlement, payout, or economic guarantees the estate does not provide. The ΔEP/K algebra is a framework for reasoning about value, not an implemented pricing service.

---

## 1. Value & vocabulary model — one governed unit system

### 1.1 The residual-value (economic-profit) frame — transcribed & reconciled

@mdheller's reference material gives two forms of economic profit / residual value. Transcribed verbatim, then reconciled:

```
(reference form 1)  ΔEP = Volume × Flow × (Price − Unit Cost) − Capital × Cost of Capital
(reference form 2)  ΔEP = (P − C)·X − λ·K        [K = knowledge-reinforcement term]
```

**Symbol collision flagged & tightened.** Form 1's "Capital" and form 2's "K" are **different quantities** sharing a letter (capital vs *knowledge*). This spec disambiguates them and reconciles the sign of the knowledge term (knowledge reinforcement is *bankable value added*, not a cost, so it enters **positively**; the reference "−λ·K" is read as the residual after netting the *cost of producing* that knowledge). **Proposed reconciled form:**

```
ΔEP  =  (P − C) · X · Φ        [operating residual: margin × cleared volume]
       −  r · Kcap             [capital charge: cost-of-capital on deployed capital]
       +  λ · Kknow            [knowledge reinforcement — ONLY when governed+provenanced; see §1.2]
       −  D                    [friction/damping: disputes, refunds, reversals, review drag]
```

| Term | Meaning | **Bound to (real contract)** |
|---|---|---|
| `X` | Volume — count of executed marketplace actions | `ExecutionRow[]` count per offering (FED §0.#7) |
| `Φ` | Flow — fraction of volume that *clears* (reaches `Released`/`Exported`) | `Cell.stage` progression over `STAGES` (marketplaceFixture) |
| `P` | Price of the action/offering (in ASI) | `Cell.netAmount` / leg `value` (marketplaceFixture) |
| `C` | Unit cost to execute (compute, provider fee) | agentplane bundle resource + provider `pricing` (FED §0.#5, §B) |
| `r` | Cost of capital (rate) | *proposed constant* — no in-repo source |
| `Kcap` | Capital deployed (escrow, staked reputation, fielded compute) | `Cell` escrow value + staked `Reputation.score`; agentplane fleet compute |
| `Kknow` | **Knowledge-reinforcement value** (see §1.2) | reasoning-chain coverage × precision × provenance |
| `λ` | Knowledge-monetization coefficient | *proposed constant* |
| `D` | Damping — realized friction | `Cell` `Refunded`/`Reversed` stages + `Reputation.disputes` |

`ΔEP > 0` = the offering/action **adds** residual value (bankable); `ΔEP ≤ 0` = value-destroying → flagged for the pattern-catalog review the scorer already emits (`scoreVariants.ts` flags `score < 0.15` "for pattern-catalog review"). **PROPOSED**; `r`, `λ`, `k₀` have no in-repo calibration source (open question §6).

### 1.2 The knowledge term K — bankable only when governed + provenanced

Reference: `K = k₀ · acov(A) · φ(P) ≈ coverage · ρ(P) · provenance`. This is the load-bearing bridge to the reasoning-chain work — **knowledge value is only real when it is governed and provenance-backed** (the estate's "no fabricated provenance" rule). Bound term-by-term:

```
Kknow  =  k₀ · acov(A) · ρ(P) · φ(prov) · 𝟙[meetsMinN] · 𝟙[receipt sealed]
```

| Factor | Reference name | **Bound to** |
|---|---|---|
| `acov(A)` | capability **coverage** of action set A | `scoreVariants.ts` `coverage` = covered core concepts / requested core, normalized per primitive-hop |
| `ρ(P)` | **stability / quality** of the plan P | `precisionAt1()` (the counter-test gate) × parsimony penalty (redundant-hop damping). ρ ∈ [0,1] |
| `φ(prov)` | **provenance** weight | `kindVocabulary.ProvenanceClass` (`learned` < `human_authored` < `published`) × `keAuthorship` receipt sealed vs `"unsigned — pending KE workbench seal"` |
| `𝟙[meetsMinN]` | Goodhart gate | `scoreVariants.MIN_N` (30); `Kknow = 0` unless `meetsMinN` (GKN#9 guard) |
| `𝟙[receipt sealed]` | anti-fabrication gate | `Kknow` is **held (0)** while the authorship receipt is unsigned — you cannot bank knowledge value on unsealed provenance |

**Consequence:** a contributor cannot mint knowledge credit by flooding low-coverage actions (coverage caps it), by rubber-stamping (ρ via precision@1 caps it), or by asserting unearned provenance (φ + the sealed-receipt gate zero it). This is the economic expression of the scorer's dilution-risk fix.

### 1.3 Transfer instruments — the shared vocabulary

Three instruments carry value; all map to real objects:

| Instrument | What it is | **Bound to** | Status |
|---|---|---|---|
| **ASI (settlement asset)** | the netting-market unit of account; cleared value moves in ASI | `marketplaceFixture` `asset: 'ASI'`, `netAmount` | named, **fixture-only** (no live rail) |
| **Reputation** | the *price/trust weight* — never spent, but **weights** every transfer | `reputation.ts` `score/tier/hats/attestations/disputes` | bound (fixture) |
| **Credits / points** | archetype-earned incentive tokens (reviews, curation, participation) | **PROPOSED** — no ledger in-repo; would be minted as receipted `ExecutionRow`s | proposed |

Reputation is **not** a currency — it is the coefficient that scales price, admissibility, and credit yield (§3). Credits are the proposed reward token; until a ledger exists they are modeled as receipted actions, not balances.

---

## 2. Archetype ledger

Each archetype's **core action** is expressed as a governed executor in the `namespace:Operation(args)` form (FED §C), typed against the MeshSkill class model (`read | replay | simulate | verify | commit`) and the Action ontology (ReadAction vs ModifyAction). **Review is the `verify` class**; **publish/share is `commit`**; **experiment is `simulate`**. Role/grant/autonomy binds to Control-Plane `Seat` + `AutonomyLevel` L0–L5 (FED §0.#8); identity binds to Entity-Fabric `rights_profile` (FED §0.#9); trust binds to HolographMe.

| Archetype | Core action(s) — governed executor | MeshSkill class / ontology | Produces | Consumes | Priced by |
|---|---|---|---|---|---|
| **Developers** | `dev:ShareEnvironment` (container/VM = agentplane bundle), `dev:ReviewSubmission`, `common:PublishArtifact` | `commit` (share) / `verify` (review) — Modify/Insert, Read/Process | reusable envs, reviews, `Kknow` (env coverage) | compute, marketplace access | `(P−C)·X` for env pulls + credits per review, ×reviewer rep |
| **Researchers / Scientists** | `research:PublishDataset`, `research:ReviewSubmission`, `research:CurateCorpus`, `research:RunExperiment` | `commit` / `verify` / `simulate` | datasets, corpora, experiments, high-`Kknow` (coverage+provenance) | data access, compute, conference/grants | `λ·Kknow` (provenance-weighted) + credits; free/lower access as subsidy |
| **News Networks / Junkies** | `news:TagContent`, `news:CurateFeed`, `news:VoteAccuracy`, `news:ManageBlocklist` | `commit` (tag/vote) / `verify` (content-review) — low-sensitivity Modify | curated feeds, accuracy votes, block/whitelists | feed access, topic/region scope | credits per accepted tally, ×accuracy-weighted rep; `Kknow` from corroboration |
| **Community Curators / Moderators** | `mod:ReviewSubmission`, `mod:DefineSupportAction`, `mod:GovernSubmission` | `verify` / `commit` — governance scope | admission decisions, support status, governance | submission stream, review authority (membrane) | support-status credits + rep; gate-keeper of others' `Φ` (clearance) |
| **Providers / Vendors** | `provider:PublishOffering`, `provider:ReviewDataAccess` (+ the offering's own executors, e.g. `stripe:*`) | `commit` — external_commit | offerings, fulfilled services | listing/clearing fee, review capacity | `(P−C)·X·Φ` on fulfilled actions, ×provider `TruthClass` |
| **Individuals (cross-cut)** | any consumer executor (`*:Get*`, `*:Query*`) + occasional `verify` | mostly `read` | demand, feedback, small `Kknow` | offerings, agent labor | pays P; earns micro-credits + rep for accepted contributions |
| **Enterprise / orgs (cross-cut)** | bulk consumer + `provider:*` + fields agents | `read`/`commit` at org `tenant_scope` | demand volume, revenue share | offerings, agent fleets, compute | pays P at volume; negotiates revenue-share; higher `Kcap` (staked) |
| **Agents (first-class actors)** | *any of the above* under `actor.kind = agent` | class-gated by autonomy band | executed work, handoff receipts, `Kknow` | delegated authority, compute budget | earns *delegation margin* for its owner-seat; surplus split §3.3 |

**Production/consumption note.** Reviewers and moderators are net **producers of `Φ`** (they move others' cells toward `Verified`/`Released`); researchers/developers are net producers of **`Kknow`**; providers are net producers of **operating residual `(P−C)·X`**; individuals are net **consumers** who seed demand and marginal `Kknow` (feedback). This asymmetry is what the transfer-pricing model (§3) balances.

---

## 3. Transfer-pricing model

The **settlement substrate is the triparty netting cell** (`marketplaceFixture`). Every value transfer is a `Cell` with legs **A (producer)**, **B (consumer)**, **C (clearing verifier)**, advancing through `escrow → fill → verify → release` and gated by the `Admissibility` lattice (`evidence ⊆ admit ⊆ release ⊆ export`) — **release is disposed by policy, not confidence** (the fixture's own invariant). **Reputation weights the price and the clearing gate.**

### 3.0 The reputation-weighted transfer price (PROPOSED)

```
Pcleared = Pbase · w(repA) · g(admissibility)          [what the producer receives]
credit(actor) = base(action) · w(rep_actor) · ρ(P)      [reward token minted]

w(rep) = 0.5 + 0.5·(score/100)          # trusted≈0.9–1.0, emerging≈0.7, unrated≈0.5
g(adm) = {evidence:0.25, admit:0.5, release:1.0, export:1.15}   # clearance multiplier
```

`w(rep)` scales *both* price received and credit yield by the actor's HolographMe standing; `g(adm)` scales by how far the cell cleared. A `dispute` on `Reputation` both lowers `score` (future `w`) **and** contributes to `D` (damping) on the current ΔEP. **PROPOSED coefficients**; no in-repo calibration.

### 3.a Intra-archetype (peer ↔ peer)

Same-archetype exchange — e.g. Developer reviews Developer, Researcher curates Researcher, News-Junkie votes on News-Junkie. Modeled as a **bilateral cell (A=author, B=peer-reviewer, C=clearing verifier)** where the transferred value is **`Φ` + reputation**, not primarily ASI:

- **Mechanism:** peer runs a `verify`-class action (`dev:ReviewSubmission`, `news:VoteAccuracy`) → receipted `ExecutionRow` → author's artifact gains an `attestation` (rep ↑) and advances a stage; reviewer earns `credit = base·w(rep_reviewer)·ρ`.
- **Pricing:** near-zero ASI; value is **reputation transfer + credit minting**. `Kknow` accrues to the *author* (their artifact's coverage/provenance), while the *reviewer* is paid in credits + a small rep bump for accepted reviews.
- **Anti-collusion:** a reviewer who over-attests low-`ρ` work sees their own `disputes` rise and `w(rep)` fall (§4). Reciprocal-review rings are damped because credit ∝ ρ(P), which the ring cannot fake without clearing the precision@1 corpus.

### 3.b Inter-archetype (group ↔ group)

Cross-archetype exchange — Researcher→Developer (dataset feeds a tool), News-Junkie→Curator (submission voted/governed), Provider→User (service delivered). Modeled as the **canonical triparty cell**:

- **Mechanism:** A = producer archetype, B = consumer archetype, C = clearing verifier (often a Community-Curator/Moderator or an automated `verify` skill). Value moves `Escrowed → Filled → Verified → Released` in ASI.
- **Pricing:** `Pcleared = Pbase · w(repA) · g(adm)`. The producer's `TruthClass` sets the admissibility floor (`PROVEN`→can `export`, `REPUTED`→stuck at `evidence`), so **higher-provenance producers command higher cleared price and reach stricter gates**. A slice of `Pbase` is retained as a **clearing/listing fee** (platform, §3.c).
- **`Kknow` routing (crux):** when a Researcher's dataset is *consumed downstream* by a Developer or Agent, the knowledge term does **not** vanish at sale — a **provenance-tracked residual** (`λ·Kknow`) is credited back to the dataset's author on each downstream governed use, because `keAuthorship` retains the authoring event as a versioned, attributed provenance record. This is the estate's "learn, don't match dictionaries" turned into a royalty: bankable *only* while provenance stays sealed and `meetsMinN` holds.

### 3.c User ⇄ platform ⇄ ecosystem, and user ⇄ AGENT symbiosis

**User ⇄ platform / ecosystem.** The platform is leg C's operator and the netting host. It earns a **clearing spread** (retained fraction of `netAmount`) and pays out **subsidies** to high-`Kknow` contributors (free/lower marketplace access for Researchers/Developers, per the archetype benefits). **Revenue share** to Enterprise partners is a negotiated split of `Pcleared` on offerings they list (the `agenticOsFixture` "Pricing/Packaging" pod is the in-repo anchor for win-price/packaging logic, though no engine computes it). Ecosystem stakeholders (conference/grants, education/publishing) are **non-ASI benefit transfers** — status, speaker spots, grants — modeled as credits + reputation `hats`, not settlement.

**User ⇄ agent symbiosis — who pays / earns when an agent acts for a user.** This is the sharpest transfer-pricing question. When an **agent executes a marketplace action on a user's behalf** (FED §C: same executor, `actor.kind=agent`, autonomy-gated):

```
User pays:      P  (the offering price for the outcome)
Costs:          C  (provider fee + compute)  → accrue to provider + platform
Surplus:        S = (P − C)                   [split, PROPOSED]:
   • outcome value            → the USER (they hold the delivered result)
   • provider fee             → the PROVIDER (leg A), ×w(repA)
   • delegation margin  δ·S   → the agent's OWNER-SEAT (who fielded + is accountable for it)
   • knowledge residual λ·Kknow → the AUTHOR of the executor/dataset the agent used (§3.b)
   • clearing spread          → the PLATFORM (leg C host)
```

- **Accountability follows the seat, not the agent.** The agent has no independent wallet; it earns a **delegation margin `δ·S` for the Seat that fielded it** (Control-Plane `Seat`, FED §0.#8), and only within that seat's autonomy cap + membrane. A `commit`-class agent action still requires L3+/human approval (policy pack), so the *user or owner* remains the paying/approving principal for value-moving actions.
- **Symbiosis, not extraction:** the user gets leverage (agent does the work), the owner-seat earns delegation margin *proportional to reputation and governed quality*, the author earns a knowledge residual, and the platform earns clearing — a positive-sum split **only if `ΔEP > 0`**, which the coverage/precision/provenance gates enforce. A hallucinated or ungoverned agent action has `Kknow=0` and typically `ΔEP≤0`, so it yields no bankable surplus — the incentive points at *governed* autonomy.

---

## 4. Symbiosis & incentive-alignment — Goodhart guards

The reward/credit system is itself a metric, and "when a measure becomes a target it ceases to be a good measure." The estate's **GKN#9 Goodhart guard** (min-n ≥ 30, counter-test, no fabricated provenance) is reused directly as the anti-gaming spine. Where each gaming vector is stopped:

| Gaming vector | Guard | **Bound to** |
|---|---|---|
| Farm knowledge-credit with many trivial actions | `Kknow` caps on `coverage` (per-hop normalized) + parsimony penalty | `scoreVariants.coverageAndParsimony`, `PARSIMONY` λ |
| Rubber-stamp reviews to mint credits | credit ∝ `ρ(P)` = precision@1; `meetsMinN` gate blocks small-corpus claims | `precisionAt1()`, `MIN_N`, GKN#9 |
| Assert unearned provenance / fake attribution | `Kknow` held at 0 while receipt unsigned; provenance class weighted | `keAuthorship` (`"unsigned — pending KE workbench seal"`, `matchRule:false`, no fabricated provenance) |
| Collusion rings (reciprocal attestation) | disputes debit `w(rep)`; C-leg verifier + admissibility gate independent of the ring | `reputation.disputes`, `Cell` C leg, `Admissibility` |
| Infinite low-value volume | capital charge `r·Kcap` makes each action consume capital; `ΔEP≤0` flagged | `Cell` escrow, `scoreVariants` `score<0.15` → "pattern-catalog review" |
| High autonomy on low reputation | Control-Plane alert `autonomy-reputation` fires; commit needs approval | `controlPlane/governance.ts` `computeAlerts` Rule 1; policy pack |

### 4.1 Flywheels & the Moufang (non-associative) modeling stance

@mdheller's flywheels each carry a **baseline loop + knowledge-reinforcement (`+λ·Kknow`) + financial-reinforcement (`+(P−C)·X`) + friction/damping (`−D`)** edge, and value transfers *between* flywheels:

| Flywheel | Baseline loop | K-reinforcement | Financial reinforcement | Damping |
|---|---|---|---|---|
| **Trust** | attest → clear → attest | provenance-weighted rep | lower risk premium → higher `Pcleared` | disputes |
| **Growth / Adoption** | use → refer → use | usage `Kknow` | seat expansion | churn |
| **Dev-Platform** | share env → review → share | env coverage | env-pull fees | maintenance drag |
| **Device / Agent-Mesh** | field agent → execute → receipt | handoff `Kknow` | delegation margin | compute cost |
| **Community-Docs** | document → adopt → document | doc coverage | support-status | staleness |
| **Champion-Challenger** | propose → verify → promote | precision gate | promoted-claim value | rejected claims |
| **Packaging / Distribution** | package → list → sell | offering coverage | clearing spread | listing friction |
| **Education / Publishing** | teach → cite → teach | citation provenance | grants/speaker | attention decay |
| **Federation / Interop** | connect provider → clear cross-mesh → connect | interop `Kknow` | cross-boundary `export` premium | integration cost |

**Moufang-loop stance (conceptual, not implemented).** Value-transfer composition is treated as **non-associative and order-sensitive**: `(mᵢ * mⱼ) * mₖ ≠ (mᵢ * (mⱼ * mₖ))` in general. Concretely, the *order* in which governance, security, and adoption transfers are applied changes the outcome — `Gov∘Sec∘Adoption ≠ Gov∘(Sec∘Adoption)`: clearing before governance can leak value that governance-first would have gated. This is a **modeling stance to justify why the pipeline order in FED §E (declare → register → bind-to-scorer → policy → federate) is fixed**, not a literal loop algebra to build. Honestly flagged as conceptual: the estate implements the *ordering discipline* (admission before commit, provenance before banking), not a Moufang structure per se.

---

## 5. Worked value-transfer examples

### 5.1 Researcher dataset → agent → enterprise action (inter-archetype + agent symbiosis)

1. **Produce.** Researcher (`Ada L.`, rep 86 `trusted`) runs `research:PublishDataset` (`commit`) + it clears peer `verify` review. Authorship sealed via `keAuthorship` → provenance `published`; corpus `meetsMinN`. `Kknow` bankable.
2. **Consume via agent.** An Enterprise user's fielded **agent** (owner-seat `Linus`, L4) plans a marketplace action that binds `research:GetDataset` + a provider executor to answer a question. Governed by the reasoning-chain scorer; coverage + precision@1 gate hold.
3. **Settle.** A triparty `Cell` opens: **A** = Researcher (dataset), **B** = Enterprise user, **C** = clearing verifier. `Escrowed→Filled→Verified→Released`; `TruthClass ATTESTED→PROVEN`, admissibility reaches `release`. `netAmount` in ASI.
4. **Split (PROPOSED).** `S=(P−C)`: user holds the answer; provider fee ×`w(0.86)≈0.93`; **delegation margin `δ·S` → Linus's seat** (agent's owner); **knowledge residual `λ·Kknow` → Ada** (dataset author, provenance-tracked); clearing spread → platform. Ada earns a *royalty on downstream governed use*, not just first sale.
5. **Receipt.** Every hop is an `ExecutionRow` with `receiptHash`; the run reads as a `RunTree` (Executions Ledger, FED §0.#7). `ΔEP>0` → the transaction is bankable and rep rises for both Ada and Linus.

### 5.2 Developer shares a reviewed VM environment (intra-archetype)

1. Developer publishes a container/VM as an **agentplane bundle** via `dev:ShareEnvironment` (`commit`).
2. A peer Developer runs `dev:ReviewSubmission` (`verify`) → receipted → author gains an `attestation` (rep ↑), reviewer earns `credit = base·w(rep_reviewer)·ρ`.
3. Bilateral cell; ~zero ASI, value is **`Φ` (the env now clears for reuse) + reputation + credits**. `Kknow` (env coverage) accrues to the author. Rubber-stamping is damped: low `ρ` → low credit; bad calls → `disputes` → lower future `w`.

### 5.3 News-Junkie submission governed by a Curator (inter-archetype + governance)

1. News-Junkie runs `news:TagContent` + `news:VoteAccuracy` (`commit`, low-sensitivity) on a report.
2. Community-Curator runs `mod:GovernSubmission` / `verify` → admits or blocklists; sets `TruthClass` (corroboration → `ATTESTED`, else `REPUTED` stuck at the `evidence` floor).
3. On admit: submitter earns accuracy-weighted credits + rep; corroborating votes raise `Kknow` (multi-source coverage). The Curator produces **`Φ`** (moves the item toward `Released`) and earns support-status. Blocklisted items are damped (`D`), and a submitter gaming votes accrues `disputes`.

---

## 6. Bound-vs-proposed ledger & open questions

### Bound to existing estate contracts
- **Settlement substrate** → triparty netting market `src/data/marketplaceFixture.ts` (`Cell`, `Stage`, `TruthClass`, `Admissibility`, `netAmount`, `asset:'ASI'`).
- **Trust/price weighting** → `src/features/reputation/reputation.ts` (`Reputation`, `Tier`, `hats`, `attestations`, `disputes`), incl. its marketplace-provider rows.
- **Knowledge term K** → `src/features/reasoning-chain/{scoreVariants,examples,kindVocabulary,keAuthorship}.ts` (coverage, parsimony, `precisionAt1`/`MIN_N`, `ProvenanceClass`, sealed/unsealed receipts).
- **Roles / autonomy / accountability** → `controlPlane/governance.ts` + `data/controlPlaneFixture.ts` (`Seat`, `AutonomyLevel`, `RolePolicy`, alerts) — reused via FED §0.#8.
- **Action executors / MeshSkill classes / receipts** → reused wholesale from `marketplace-federation-patterns.md` §C–§E and its §0 bindings (#1, #2, #3, #7).
- **Identity / rights** → Entity-Fabric `rights_profile` (FED §0.#9).

### Proposed as new (no in-repo implementation)
- The **ΔEP residual-value formula** and its reconciliation (§1.1), incl. the Kcap/Kknow symbol-collision fix and the `−D` damping term.
- The **`Kknow` monetization form** and its gates (§1.2) — the *bindings* are real; treating them as a *bankable value* is proposed.
- **Credits/points** as a reward token (§1.3) — no ledger exists.
- The **reputation-weighted transfer price** `Pcleared`, `w(rep)`, `g(adm)`, credit-minting (§3.0), and the **agent-symbiosis surplus split** `δ·S + λ·Kknow` (§3.c).
- The **flywheel edge decomposition** and the **Moufang non-associative stance** (§4.1) — explicitly conceptual.

### Open questions for @mdheller
1. **Calibration source for `r`, `λ`, `k₀`, `δ`, `g(adm)`.** None exist in-repo. Is there a pricing/packaging source of truth (the `agenticOsFixture` "Pricing/Packaging" pod hints at one) these should bind to, or are they governance-set constants?
2. **Live settlement rail.** ASI/MPE is named but unwired (`routeRegistry.ts:602`). Should the credits/transfer model target the netting `Cell` as the settlement object once a rail lands, and is MPE a distinct instrument from ASI?
3. **Credits ledger home.** Should reward credits be a first-class ledger, or remain modeled as receipted `ExecutionRow`s? If a ledger, does it live beside the Executions Ledger or in the (sibling) `prophet-core-contracts`?
4. **Knowledge royalty (`λ·Kknow` on downstream use).** Is a provenance-tracked residual to the original author (§3.b) desired, and does `keAuthorship`'s versioned attribution suffice as the royalty ledger, or is that the KE-workbench's job?
5. **Agent wallet vs seat accountability.** This spec routes all agent earnings to the owner-seat (no agent wallet). Confirm agents never hold independent balances, and that `δ` (delegation margin) is capped by autonomy level.
6. **Reputation ↔ price coupling shape.** `w(rep)=0.5+0.5·(score/100)` is a placeholder linear map. Should high reputation earn a convex premium (winner-take-more) or stay linear/capped to avoid entrenchment?
7. **Enterprise revenue-share mechanics.** Where is the split negotiated/recorded — a `RolePolicy` extension, an offering field in the FED `MarketplaceOffering` envelope, or the partner-lane `Opportunity` in `agenticOsFixture`?

---

*Cross-linked to `marketplace-federation-patterns.md`; reuses its §0 contract bindings. All ΔEP/K formulas are a proposed modeling framework — no pricing, settlement, or reward engine exists in-repo, and none is claimed. No fabricated provenance or settlement guarantees.*

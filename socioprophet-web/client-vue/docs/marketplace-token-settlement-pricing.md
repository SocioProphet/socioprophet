# Marketplace — Token, Settlement & Pricing Reconciliation

**Status:** draft / design reconciliation (not code) · v0.1
**Purpose:** The first three marketplace specs modelled settlement, instruments, and pricing as *proposed* layers over in-repo shadows (a fixture netting cell, three named instruments, a hand-rolled `Pcleared`, a `Kknow`/ΔEP sketch). Four canonical sources now exist that make those layers authoritative. This doc **reconciles** the earlier specs against them — it says, section by section, what each proposed layer is now *bound to* and what remains genuinely open.

**Cross-links (reused, not re-derived):**
- **FED** — `marketplace-federation-patterns.md` (offering registry, §0 contract bindings, MeshSkill action model)
- **VT** — `marketplace-value-transfer-model.md` (archetype ledger, ΔEP/`Kknow`, transfer pricing, netting-cell settlement)
- **EAP** — `marketplace-epistemic-annealing-pricing.md` (barter network, Debater-2.0 annealing, thesis→price, the precision@1 anneal-gate)

> **Honesty stance (unchanged).** The four canonical sources below are **on-disk external specs / a reference codebase**, not in-repo implementations. In-repo bindings (marketplaceFixture, reputation.ts, reasoning-chain, controlPlane) are real code. Everything that maps an external spec onto the estate is labelled **PROPOSED**. No fabricated provenance, settlement, or economic guarantees. The banking-domain economics (EP v37) is *mapped*, not copy-pasted — that mapping is called out as real work, not a done deal.

---

## 0. The four canonical sources & what each upgrades

| # | Canonical source (on disk) | Upgrades | From (prior shadow) → To (authoritative) |
|---|---|---|---|
| 1 | **Governed Triparty Netting Fabric v11** (`governed_triparty_netting_fabric_white_paper_detailed_v11-1.pdf`) | VT §3, EAP §D | fixture "triparty cell legs A/B/C, escrow→fill→verify→release" → a **local three-party release constitution** with an admissibility lattice, canonical state machine, proof-artifact lineage, and a §15 **Causal Controller** |
| 2 | **Economic Profit Methodology v37** (`economic_profit_running_draft_v37.pdf`) | VT §1.1, VT §3.0, EAP §C.2 | hand-rolled `Pcleared`/`ΔEP` sketch → banking-grade **EP = NOPAT_adj − HurdleRate_adj × Capital_adj**, risk-capital allocation, and **FTP (Funds Transfer Pricing)** as the transfer-pricing engine |
| 3 | **Integrated Token Ecosystem Dossier** (`integrated_token_ecosystem_dossier.pdf`) | VT §1.3 | "three instruments (ASI / reputation / credits)" → an authoritative **three-tier token system** with mint rules, separation-of-functions, and feedback-loop guards |
| 4 | **Taskwarrior** (`taskwarrior-develop.zip`, reference codebase) | FED (app/agent actions), VT (Labor Network), SynapseIQ harness `Score()` | narrative "Request→Match→Fulfillment" + `Score(C,I,J,A)` → a **battle-tested task/urgency/hook/replica reference implementation** |

Nothing here introduces a new capability, policy, or receipt model — the FED §0 bindings still hold. This doc slots the external authorities *under* the existing surfaces.

---

## 1. Settlement — the Governed Triparty Netting Fabric (upgrades VT §3, EAP §D)

VT settled transfers over a **fixture** netting cell. The Netting Fabric v11 is the authoritative constitution that fixture was shadowing.

**The primitive.** Not a bridge, message bus, settlement interface, registry, or coordination standard *in isolation* — a **governed triparty netting fabric**: a *local three-party constitution* that (a) cancels common cyclic burden locally, (b) preserves proof + provenance, (c) **separates evidence from permission**, and (d) supports **release / refund / suppression / export by policy, not by confidence**. This is the exact discipline VT asserted ("release is disposed by policy, not confidence") — now with a named home.

**Normative core (§§2–12) → estate mapping:**

| Netting Fabric construct | Estate binding |
|---|---|
| **Triparty face** (A producer · B consumer · C clearing verifier) | **BOUND (shadow):** `marketplaceFixture` legs A/B/C; VT §3.a/b/c already routes every transfer as a triparty cell |
| **Admissibility lattice** `evidence ⊆ admit ⊆ release ⊆ export` | **BOUND (shadow):** the fixture's `Admissibility` + `TruthClass ∈ {PROVEN, ATTESTED, INFERRED, REPUTED}`; VT §3.0 `g(admissibility)` multiplier reads off this ladder |
| **Canonical state machine** (escrow→fill→verify→release, with **blocked/refunded/revoked/unmerged/coarsened as first-class outputs**) | **BOUND (principle):** WEDT "blocked-action-visible"; EAP §D "refusal is a first-class priced outcome" |
| **Proof-artifact & lineage rule** (every consequential transition emits a replayable proof; every reversal is lineage-preserving) | **BOUND (shape):** `keAuthorship` sealed receipts; ExecutionsLedger `receiptHash`/`RunTree` |
| **Release ≠ export** (internal release distinct from wider export) | **PROPOSED** at the offering layer — FED offerings need an explicit `export` gate above `release` |

**Standards it composes (all PROPOSED external adapters, per FED consume-not-fork):** ERC-7683 (typed cross-chain order + fill + settlement) and ERC-8001 (multi-party readiness kernel) as the **order/readiness planes**; IBC (proof-carrying delivery + explicit timeout) and LayerZero/Hyperlane/Wormhole/CCIP as **transport/proof adapters**; Verifiable Credentials / Data Integrity / **BBS** (machine-verifiable, *selectively disclosable* claims) as the **claim plane**; **vLEI** (role-bearing organizational authority) as the **authority plane** — this is where FED Seats / Control-Plane roles bind; **BODS** (immutable source-attributed relationship semantics) for provenance; **FATF** as the multi-source adequacy/accuracy/timeliness governance benchmark.

**SocioProphet's contribution, per the white paper itself:** "the missing governance grammar — **evidence, merge, export, proof, and reversibility are distinct operations**." This is the estate's actual differentiator and should be quoted in FED §A: the estate is not another bridge; it is the local constitution that composes the others safely.

**§15 Causal Controller = the abduction engine (the load-bearing tie to EAP).** The white paper's §15 ("Induction, Deduction, Abduction, and the Causal Controller") is the authoritative home for EAP's "grounded causal-abduction thesis." Reconciliation: **EAP's epistemic-annealing pipeline is the *process* that produces a thesis; the Netting Fabric §15 Causal Controller is the *settlement-side admission* of that thesis** — a thesis is only *releasable* (admissibility ladder) once the Causal Controller admits its abductive step. Bind EAP §B stage 6 ("ground state = thesis + sealed receipt") to §15 admission.

**Higher-order scaling (§16) = the netting principle, and it reconciles VT.** "Larger quinary, septary, and network-wide systems are composed from triparty faces and **optimized only on the residual imbalance and ambiguity that survive local clearing**." This *is* netting: clear locally, push only residual to the edges. It vindicates VT §3.a's claim that intra-archetype exchange moves "Φ + reputation, not primarily ASI" — most value cancels in-face; **ASI settles only the residual**. Update VT to state this explicitly.

**WEDT reconciliation.** The WEDT v2.9 "5 bounded corridors" (Treasury/Liquidity, Collateral Ops, Settlement Queue Ops, +2) and the Netting Fabric are the **same settlement family at two altitudes**: WEDT is the *bounded-action / corridor governance* view (amber band, blocked-visible, supervisory-not-executive); the Netting Fabric is the *release-constitution* view (admissibility, proof lineage). A transfer clears through a **triparty face** whose release is gated by the **corridor's authority band**. Neither introduces universal hidden autonomy.

---

## 2. Instruments — the three-tier token system (upgrades VT §1.3)

VT named three instruments (ASI / reputation / credits) and flagged them proposed. The Token Ecosystem Dossier is the authoritative version, and the mapping is 1:1.

| VT instrument | Dossier tier | Role | Mint / issuance | Estate binding |
|---|---|---|---|---|
| **ASI** (settlement asset) | **Tier 1 — Anchor / Reserve** | settlement, treasury numéraire, collateral, emergency support, **partner netting** | mint conservatively against real treasury capacity / explicit backing | **BOUND (shadow):** `marketplaceFixture asset:'ASI'`, `netAmount`; §1 netting-fabric residual settles here |
| **Credits** (incentive token) | **Tier 2 — Flow / Operating** | medium of exchange: fees, rebates, rewards, working-capital budgets | mint against operating budgets / **verified activity**; burn via fees; expiries where policy dictates | **PROPOSED** — VT's proposed credits ledger; would be minted as receipted `ExecutionRow`s |
| **Reputation** (weight, not currency) | **Tier 3 — Stewardship / Governance** | voice, reputation, long-horizon rights, selective risk absorption, budget steering | `Mint_T3 = VerifiedContribution × QualityScore × LongHorizonMultiplier × AntiSybilScore × CommunityPriorityWeight` | **BOUND (shadow):** HolographMe `reputation.ts` (`score/tier/hats/attestations/disputes`); often lock-weighted / non-transferable |

**This upgrades VT's `Kknow` weighting.** VT priced with `w(rep)`; the dossier's `Mint_T3` decomposes it: **`QualityScore` ← the annealed thesis's `Kknow`** (EAP §C.1: coverage·coherence·stability·provenance), **`VerifiedContribution` ← a sealed authorship receipt**, **`AntiSybilScore` ← identity/rights (Entity-Fabric)**. So reputation is *minted from governed, annealed contribution* — closing the loop between EAP (produce thesis), this tier (mint stewardship weight), and pricing (§3).

**Separation-of-functions is now a hard rule** (dossier "Synthesis principles"): one token must **not** be reserve asset + medium of exchange + governance right + speculative claim simultaneously. VT is compliant (three distinct instruments); enforce it as an invariant on any future credits implementation.

**Feedback loops with guards** (dossier "Core feedback loops") give the estate its runtime control laws, each mapping to an existing guard:
- **Reserve loop** (coverage ratio, redemption queue) → `ReserveGuard` declines as coverage/depth/latency deteriorate ↔ WEDT Treasury/Liquidity corridor.
- **Fairness loop** (payout concentration, grievance rate, contributor churn) → `FairnessGuard` ↔ VT §4 Goodhart guard + `dispute→D` damping.
- **Governance loop** (voter concentration, delegate performance) → cap dominance ↔ FED Control-Plane `autonomyCap`.
- **Labor loop** (task completion, burnout, queue backlog) → raise pay for hard tasks ↔ §4 Taskwarrior urgency + VT Labor Network.
- **Learning loop** (post-mortems, case reuse) → compound institutional intelligence ↔ EAP drift monitor + knowledge-studio promotion gate.

---

## 3. Pricing & transfer — Economic Profit v37 + FTP (upgrades VT §1.1, §3.0; EAP §C.2)

EAP/VT sketched `ΔEP` and hand-rolled `Pcleared`. EP Methodology v37 is the banking-grade backbone.

**The real EP identity.** `EP_t = NOPAT_adj − HurdleRate_adj × Capital_adj`; `Value = NPV(EP)`. This replaces VT's informal `(P−C)·X·Φ − r·Kcap`. The *variance decomposition* EAP §C.2 used (ΔPrice/ΔVolume/ΔCost/ΔProductivity/ΔCapital) is the legitimate operator view of this identity.

**Risk-capital allocation is a known-hard problem — inherit the honesty, not a false answer.** EP v37 cites Merton-Perold and Froot-Stein: there is **no simple way** to allocate risk capital to a business/project; any allocation is *imputed*, justified by contribution to firm-wide risk. **Reconciliation:** VT/EAP must **not** claim a clean per-thesis capital charge. The `Capital_adj` term on a knowledge/labor thesis is an *imputed* proxy (WEDT's softest layer) — carry it as such.

**FTP = the transfer-pricing engine (this is the real find).** Funds Transfer Pricing is banking's mechanism for the *internal price of liquidity* — it prices funds moving between units so each unit's EP is measured against a fair internal cost of funds. **This is exactly VT's transfer-pricing problem.** Reconciliation: **VT §3's `Pcleared` should be re-grounded as an FTP curve** — the internal price at which value/credits move between archetypes and the treasury (Tier 1), net of the netting-fabric residual (§1) and weighted by reputation (§2). This gives VT's three cases (intra-/inter-archetype, user⇄platform) a real, named mechanism instead of an invented coefficient.

**The binding constraint survives — and is now EP-native.** EAP §C.2 forbade `Kknow` reducing the external cost of capital. In EP v37 that is **structural**: `HurdleRate_adj` (the cost of capital / hurdle) is **exogenous** — set by markets and regulators (Basel III, consolidated basis), not by knowledge quality. Knowledge narrows *controllable operating spreads* (ΔPrice/ΔCost/ΔProductivity), never the hurdle rate. So "annealing lowers your cost of capital" remains **out of bounds**, now for a rigorous reason.

**Honest caveat (carried forward).** EP v37 is a **banking** methodology (bank entity, Basel III, FTP, regulatory capital). Mapping it to a knowledge/labor barter network is **real modelling work**, not a copy-paste: NOPAT→contribution surplus, Capital→imputed stake, FTP→inter-archetype transfer price. Flag every such mapping as PROPOSED until an in-repo `economic-prophet`/`profit-mpcc` engine exists (those are **sibling repos, not in this worktree**).

---

## 4. Labor network & operations — Taskwarrior as reference implementation (upgrades FED actions, VT Labor Network, SynapseIQ `Score()`)

Taskwarrior is a mature (Rust/C++, 647 files) task engine whose four subsystems are direct references for surfaces the specs described narratively.

| Taskwarrior subsystem | Reference for | Estate mapping |
|---|---|---|
| **Task status machine** (`pending → waiting → completed/deleted`, recurring) + `depends` DAG (`blocked`/`blocking`) | VT **Labor Network** (`Request→Match→Award→Contract→Milestone→Delivery→Review`) and the SynapseIQ **WorkspaceOperation** state model (`requested→validated→policy_checked→queued→running→completed`) | **PROPOSED:** adopt the status+dependency model for Request/Fulfillment objects; every mutation is a typed, replayable operation |
| **Urgency coefficient** — a *weighted linear sum* of terms (`urgency.due`, `urgency.priority`, `urgency.blocked`, `urgency.blocking`, `urgency.age`, `urgency.tags`, …) | The SynapseIQ optimization-harness **`Score(C,I,J,A)`** (also a weighted linear sum: `wV·ValuePotential + wK·KnowledgeQuality − wP·PolicyFriction − …`) | **PROPOSED:** Taskwarrior proves the *shape* — a transparent, tunable coefficient vector — works at scale; adopt its `rc.urgency.*.coefficient` config pattern so `Score()` weights are inspectable and per-deployment tunable |
| **Hooks** (`on-add`, `on-modify`, `on-launch`, `on-exit`) — scripts that can **veto** a change (fail-closed) | FED/PROPHET **governed action gates** — policy evaluated at the operation boundary, refusal first-class | **PROPOSED:** hooks are a proven fail-closed gate pattern; map to the policy-pack `deny[]` + receipt emission at each WorkspaceOperation transition |
| **TaskChampion** replica + operation-log sync | The **sovereign, local-first receipt chain** (Codex-transcript inversion: user owns state; server is stateless) | **BOUND (principle):** matches the Codex-registry analysis — an append-only local op-log with sync, not server-owned state; reference for the ExecutionsLedger/OutboxEntry substrate |

**Why "connects many surfaces."** One object model — a typed, dependency-aware, hook-gated, replica-synced operation with an urgency score — simultaneously serves: FED offering *actions*, VT *Labor Network* requests, the SynapseIQ *WorkspaceOperation* plane, and EAP *anneal-gate* steps (each CTEST cycle is a hook-gated operation). Taskwarrior is the existence proof that this converges.

---

## 5. The reconciled stack (one picture)

```
 DEMAND        Competitive-Intelligence decision-jobs (FED §E / VT / SynapseIQ Score())
                          │  "which causal-abduction thesis is worth buying?"
 REASONING     Debater 2.0 epistemic annealing  ──►  §15 Causal Controller admits the abductive step
   (EAP)         energy=LOGFALL/COGBIAS · anneal=CTEST · floor=MIN_N=30 · ground state=sealed thesis
                          │  (precision@1 gate = the one implemented anneal-gate)
 PRICING       Kknow (coverage·coherence·stability·provenance)  ──►  EP = NOPAT_adj − Hurdle·Capital_adj
   (§2,§3)        └─ mints Tier-3 stewardship weight        └─ transfer priced by FTP curve; hurdle exogenous
                          │
 INSTRUMENTS   Tier-1 ASI (reserve/settle) · Tier-2 credits (flow) · Tier-3 reputation (govern)
   (§2)                   │  most value cancels in-face; only RESIDUAL settles in ASI
 SETTLEMENT    Governed triparty face (A·B·C) · admissibility evidence⊆admit⊆release⊆export
   (§1)          proof-artifact lineage · blocked/refunded/revoked first-class · WEDT corridor authority band
 OPERATIONS    WorkspaceOperation / Request→Fulfillment (Taskwarrior: status·depends·hooks·replica)
   (§4)          typed · replayable · hook-gated (fail-closed) · sovereign local-first receipt chain
```

Ordering is deliberate and matches WEDT's ontological order: **verification (reasoning) precedes markets (pricing) precedes settlement** — pricing is the softest proxy layer, never a false certainty.

---

## 6. Reconciliation ledger

**Now bound to a canonical authority (was PROPOSED-in-isolation):**
- VT §3 settlement → Netting Fabric v11 triparty face + admissibility lattice + proof lineage.
- VT §1.3 instruments → three-tier token system (Tier1 ASI / Tier2 credits / Tier3 reputation) + mint rules + feedback guards.
- VT §1.1 / §3.0 pricing & transfer → EP v37 identity + risk-capital honesty + **FTP** as the transfer-pricing engine.
- EAP §D settlement / §C.2 constraint → Netting Fabric state machine + §15 Causal Controller; cost-of-capital bound is now EP-native (exogenous hurdle).
- Labor Network / WorkspaceOperation / `Score()` → Taskwarrior status·depends·urgency·hooks·replica reference.

**Still genuinely proposed (no in-repo implementation):** the credits ledger; the FTP-curve mapping from banking to knowledge/labor; the ΔEP/`Kknow` numeric calibration; Debater 2.0 + LOGFALL/COGBIAS/CTEST/`ruleset_semver 1.3.0`; the annealing schedule. `economic-prophet` / `profit-mpcc` / `prophet-core-*` / Debater 2.0 remain **sibling repos not in this worktree**.

**Binding constraints (WEDT + Netting Fabric + EP non-goals):** no closed-form EP; no universal hidden autonomy (amber band, supervisory-not-executive); exogenous hurdle rate (knowledge never reduces cost of capital); release ≠ export; markets are 4th in the ontological order; blocked/refused states are first-class outputs; evidence/merge/export/proof/reversibility are **distinct** operations.

---

## 7. Open questions for @mdheller

1. **One settlement surface or two?** Are the WEDT corridors and the Netting Fabric triparty faces meant to unify into one `settlement` module, or stay as governance-view vs release-view of the same clearing?
2. **FTP scope.** Is Funds Transfer Pricing the intended mechanism for *all three* VT transfer cases, or only user⇄treasury (Tier-1)? Who owns the FTP curve — a treasury seat, or the netting fabric's clearing verifier (leg C)?
3. **Credits ledger home.** Does Tier-2 credits get a real ledger (its own `ExecutionRow` type), or stay modelled as receipted actions until an `economic-prophet` engine lands?
4. **Taskwarrior: reference or dependency?** Adopt the *pattern* (status/urgency/hooks/replica) in a native estate object, or actually vendor TaskChampion as the sync substrate?
5. **§15 Causal Controller ↔ anneal-gate.** Is the production anneal-gate the reasoning-chain scorer generalized, the `atlas/autopilot promotion_controller`, or the Netting Fabric §15 controller — and how do those three relate?
6. **Reputation mint calibration.** Source for `LongHorizonMultiplier`, `AntiSybilScore`, `CommunityPriorityWeight`, and the `Score()`/urgency coefficient vector.
7. **Refusal economics (still open from EAP).** Can a *good refusal* (a correctly blocked/revoked settlement) carry positive value, and who pays for it?

---

*Reconciles FED / VT / EAP against Governed Triparty Netting Fabric v11, Economic Profit Methodology v37, the Integrated Token Ecosystem Dossier, and the Taskwarrior reference codebase. Canonical sources are on-disk specs / a reference repo, not in-repo implementations; all estate mappings are PROPOSED and every banking→barter mapping is flagged as real work. No fabricated provenance, settlement, or economic guarantees.*

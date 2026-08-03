# Marketplace as a Barter Network — Epistemic Annealing & Thesis Pricing

**Status:** draft / design spec (not code). **Third companion** to [`marketplace-federation-patterns.md`](./marketplace-federation-patterns.md) (offering registry + governed action model; its **§0** is the contract-binding table) and [`marketplace-value-transfer-model.md`](./marketplace-value-transfer-model.md) (ΔEP residual value, `Kknow`, netting settlement, reputation weighting). This spec **reuses those bindings** (cited *FED §0.#N* and *VT §N*) and adds the **reasoning layer**: how a p2p barter network prices *heterogeneous* contributions by **annealing** them — via the Debater 2.0 epistemic engine — into **grounded causal-abduction theses** that become the priceable unit.

> **Honesty bar (unchanged, and sharpened by the WEDT non-goals).** No annealing engine, no pricing engine, and no settlement rail are implemented in this worktree. Debater 2.0, `economic-prophet`, `profit-mpcc`, and `prophet-core-*` are **sibling repos in the ~144-repo estate, not present here** (confirmed against the Codex Plugin Registry transcript, 2026-06-07). Every formula is a **PROPOSED modeling framework**. The **one exception** — the part that is *real code today* — is the reasoning-chain **precision@1 counter-test gate**, which this spec shows is a working instance of Debater 2.0's small-N discipline. The World Economy Digital Twin (WEDT) whitepaper v2.9 supplies **binding constraints** that cap every pricing claim here:
> - **No closed-form EP.** WEDT §2 non-goals: *"does not claim closed-form truth for EP_R, EP_Civ, or FEQ."* Our ΔEP/price is a **governed proxy**, the *softest* layer in WEDT's metrics hierarchy (§14: strongest = queue/integrity/seal/blocked-action; softest = EP/FEQ proxy closure). It is never promoted to certainty.
> - **No universal hidden autonomy.** WEDT §9: federation is **amber/supervisory** — it *"may combine posture, not hidden execution rights."* Pricing/settling agents gain no silent cross-corridor authority.
> - **Ontological order.** WEDT §2: *provisioning → pedagogy/verification → institutional → **claims/markets (4th)** → machine-control (last).* Markets do **not** govern the whole world; **verification precedes pricing** — which is exactly why annealing (the verification layer) must run before a thesis is priced.
> - **Visible refusal is mandatory** (WEDT §13). A thesis that fails to anneal produces a **first-class, priced refusal receipt**, never silence.

---

## A. Barter-network model

The marketplace is reframed as a **peer-to-peer barter network**: a Developer's shared VM, a Researcher's dataset, a News-Junkie's corroborated tag, and a Provider's fulfilled service are all **heterogeneous contributions** with **no common intrinsic price**. A fixed price list fails here because:

1. **Incommensurability.** What is a reviewed dataset "worth" in units of container-hours? There is no market-clearing price for unlike knowledge/labor goods a priori.
2. **Context-dependence.** The same dataset is worth a great deal to an equity-research desk and nothing to a threat-intel desk — value is **demand-job-relative** (§E).
3. **Provenance-dependence.** An unsourced claim and a counter-tested, provenance-sealed one are different goods even if textually identical (VT §1.2).

**Barter is the base primitive; the exchange rate is *established*, not looked up.** Two unlike contributions exchange when an **epistemic-annealing process (§B)** has ground each down to a **stable causal-abduction thesis** whose `Kknow` (coverage × coherence × stability × provenance) is computable. The two theses' `Kknow`, reputation-weighted, set the **barter exchange rate**. **ASI/credits are an *optional* numéraire** — a convenience unit for netting multi-party barter (the netting cell's `netAmount`, VT §1.3), not the source of value. The value is the annealed thesis; money is just one way to settle it.

- **Direct p2p exchange** rides the existing triparty netting `Cell` (FED §0.#14 / VT §3): legs A (contributor), B (counterparty), C (clearing verifier), settling `escrow → fill → verify → release`.
- **Barter without numéraire** is the 2-leg degenerate case: A↔B swap theses, C attests parity; no ASI moves. **Barter with numéraire** adds ASI to net an unbalanced swap.

---

## B. The epistemic-annealing pipeline (Debater 2.0 as an anneal schedule)

**Annealing metaphor made precise.** A raw contribution is a **high-energy** claim: full of unsupported warrants, fallacies, and biases. *Energy* is the count/severity of hygiene violations. Debater 2.0 runs **iterated debate + counter-test cycles** that lower the energy — each cycle is an **anneal step** — until the claim reaches a **low-energy, drift-stable ground state**: a **grounded causal-abduction thesis**. Cooling too fast (skipping counter-tests) freezes in a biased local minimum; the small-N gate is the temperature floor that forbids premature "generalized claim" crystallization.

| Anneal stage | Debater 2.0 construct | **Estate binding (bound vs proposed)** |
|---|---|---|
| 0. Candidate claim | `evt_id`-stamped claim submission | **proposed** (Debater 2.0 sibling); shaped like an `AuthorshipEvent` (`keAuthorship.ts`) |
| 1. Argument mining | extract claim / warrant / backing | **proposed**; grounded by the reasoning-chain token-tree → concept-graph parse (`examples.ts` tokens) |
| 2. **Energy = hygiene/bias** | **LOGFALL** (logical-fallacy) + **COGBIAS** (cognitive-bias) detectors; each hit = energy; a **bias passport** records declared/uncorrected biases | **proposed** detectors; the *grounding* is the scorer's coverage/parsimony — a redundant/uncovered hop is an argument-hygiene fault (`scoreVariants.coverageAndParsimony`) |
| 3. **Anneal steps = counter-tests** | **CTEST** cycles: hold-out, counter-example, adversarial rebuttal, under `ruleset_semver 1.3.0` | **BOUND (real code):** `precisionAt1()` is a counter-test — top-1 selection checked against a declared-gold fixture set (`scoreVariants.ts` §4) |
| 4. **Temperature floor = small-N gate** | N≥30 standard inference / 10<N<30 partial pooling / N≤10 enumerate; *no generalized claim below small-N* | **BOUND:** `MIN_N = 30`; `precisionAt1().meetsMinN`; `publishable=false until real logs` (`examples.ts` gate note) — the estate's **first implemented anneal-gate** |
| 5. Drift monitor | re-run stability; detect re-heating | **proposed**; analogous to the knowledge-studio promotion gate re-check |
| 6. **Ground state = thesis** | stable causal-abduction thesis, **Merkle receipt** sealed | **BOUND (shape):** `keAuthorship` sealed receipt vs honest `"unsigned — pending KE workbench seal"`; no fabricated provenance |

**The load-bearing real anchor (make explicit).** The reasoning-chain **precision@1 counter-test gate is Debater 2.0's small-N discipline, already in code**:
- `MIN_N = 30` **==** the "N≥30 standard inference" rule; `meetsMinN` gates whether a precision@1 claim is publishable **==** "no generalized claims below small-N."
- The governed variant scorer's **coverage + parsimony** (dedup plan-equivalent variants, penalize redundant hops, tie-break by declared canonical path) **==** argument-hygiene grounding: an ungrounded or redundant argument step scores strictly lower.
- `precisionAt1().publishable = false until real logged questions land` **==** the discipline that a curated corpus cannot mint a generalized claim — the gate is honest that its fixtures are authored, not scraped (`examples.ts` provenance note; AGENTS.md "no fabricated provenance").

So **the anneal-gate exists as a working stub.** Debater 2.0 generalizes it (adds LOGFALL/COGBIAS energy, CTEST cycles, bias passports, drift) but the estate already runs the counter-test + small-N + coverage core. Bind new annealing work to `src/features/reasoning-chain/{scoreVariants,examples,keAuthorship}.ts`.

---

## C. From thesis to price

### C.1 A stabilized thesis carries `Kknow`

Extending VT §1.2, an annealed thesis's knowledge value gains two annealing-derived factors:

```
Kknow(thesis) = k₀ · coverage · coherence · stability · provenance · 𝟙[meetsMinN] · 𝟙[sealed]

  coverage    ← scoreVariants coverage (covered core concepts / requested)        [BOUND]
  coherence   ← 1 − normalized energy (LOGFALL/COGBIAS-free)                       [proposed]
  stability   ← drift-monitored persistence across CTEST re-runs                   [proposed]
  provenance  ← keAuthorship ProvenanceClass × sealed-receipt                      [BOUND shape]
```

`Kknow` is held at 0 unless the thesis clears the small-N gate **and** carries a sealed receipt — you cannot bank knowledge value on an un-annealed or unsigned claim. This is the economic expression of "verification precedes markets" (WEDT ontological order).

### C.2 Price via ΔEP variance decomposition — bounded by the WEDT non-goal

A priced thesis moves **ΔEP** (VT §1.1) through a **variance decomposition** of controllable levers:

```
ΔEP  =  ΔPrice · X  +  (−ΔCost) · X  +  ΔProductivity · (P−C)  +  ΔVolume · (P−C)  −  r · ΔCapital
        └──────────── K reduces these CONTROLLABLE spreads ────────────┘         └─ NOT reducible by K ─┘
```

- A stabilized thesis **narrows controllable spreads**: better information → tighter `ΔPrice` and `ΔProductivity`; less rework/rediscovery → lower `ΔCost`; reusable knowledge → `ΔVolume`.
- **Binding constraint:** `Kknow` **cannot reduce the external cost of capital `r·ΔCapital`.** WEDT §2/§14 forbid closed-form EP and treat capital charge as exogenous. Knowledge lowers *epistemic* spreads, not the market price of money. Any pricing claim that "annealing lowers your cost of capital" is out of bounds and must be refused.
- The whole `ΔEP`/price object is a **governed proxy** (WEDT softest layer): explicit, bounded, versioned, never a false certainty.

### C.3 Demand-side ranking — which theses are worth annealing (SynapseIQ)

Annealing is costly; not every claim earns a full CTEST budget. **SynapseIQ** ranks candidate contributions by expected demand-fit. The estate ships SynapseIQ **in-repo** as the language-intelligence surface that classifies entity types into the **KKO (Peircean) ontology** (`src/pages/NlpExtractionBench.vue`, `knowledge-studio/fixture.ts` — "future live extractor = slate/nlp + SynapseIQ"). The **`Score(C, I, J, A)`** demand-ranking is **PROPOSED** on top of it:

```
Score = f(Contribution-quality C, Importance I, Job-fit J, Actionability A)   [PROPOSED]
```
where `J` binds to the CI **decision-job** taxonomy (§E). High `Score` → allocate CTEST/anneal budget → the thesis is worth pricing. Low `Score` → hold at candidate. This keeps the anneal furnace pointed at theses buyers actually demand.

---

## D. Settlement & bounded action — over the WEDT corridors

A priced thesis settles over the **WEDT bounded corridor control mesh** (whitepaper v2.9), which is the **settlement + bounded-action layer** beneath the barter network. Five corridors, **amber federation band**, blocked-actions-visible:

| WEDT corridor | Governs | Visible blocked actions (examples from v2.9) |
|---|---|---|
| **Treasury / Liquidity** | funding resilience, balance-sheet elasticity | `term_out_funding`, `reduce_counterparty_concentration` |
| **Collateral Operations** | encumbrance, haircuts, substitution | `deconcentrate_collateral_pool` |
| **Settlement Queue Operations** | queue health, reconciliation cadence | `suspend_noncritical_batch` |
| **Margin Operations** | house-floor, discretionary relief | `tighten_house_margin_floor`, `suspend_discretionary_margin_relief` |
| **Fail-Repair Operations** | bounded repair, recovery discipline | `pause_low_priority_repair_work` |

**How thesis-settlement rides the corridor mesh:**
- The triparty netting `Cell` (FED §0.#14) advances `Escrowed → Filled → Verified → Released → Exported`, gated by `Admissibility` (`evidence ⊆ admit ⊆ release ⊆ export`) and `TruthClass` (`REPUTED < INFERRED < ATTESTED < PROVEN`). A thesis whose annealed `provenance` = `REPUTED` is stuck at the `evidence` floor; only a `PROVEN`, drift-stable thesis reaches `export`. **Admissibility is disposed by policy, not confidence** — the netting fixture's own invariant, and WEDT's.
- **Amber band = supervisory.** Settlement agents may *advise, queue, publish evidence, coordinate huddles* but **cannot cross into hidden cross-corridor execution** (WEDT §9). No thesis price grants an agent silent authority.
- **Sovereign receipt chain (Codex inversion).** Per the Codex transcript: the correct architecture is that **the user owns the receipt/evidence chain; the server is stateless inference.** Every anneal step, CTEST, seal, and settlement is a **first-class user-owned receipt** with timestamp + hash + attestation — not opaque server state. WEDT §12 makes the **seal receipt** the object that lets a third party reconstruct *what the runtime claimed to know and when.* This binds to the estate's `ExecutionRow.receiptHash` + `RunTree` (FED §0.#7) and the append-only evidence chain.
- **Refusal is a first-class priced outcome.** WEDT §13: *visible refusal is mandatory.* A contribution that fails to anneal (energy stays high, bias passport shows uncorrected COGBIAS, N < 30) settles as a **refusal receipt** — priced (often at 0, sometimes at positive value because it *prevented* a bad decision) and **visible**, echoing the Codex `feature.capability` gap fix (a clean refusal path at the boundary, not silent proceed-then-fail).

---

## E. Demand side — Competitive-Intelligence decision-jobs as thesis buyers

The estate already ships a **decision-job taxonomy**: `src/features/competitive-intelligence/marketProfessionalIntelligence.ts` catalogs professional-intelligence products, each with a `job` field naming the buyer's decision. **Each decision-job is a standing demand for a priced causal-abduction thesis.** Representative mappings (verbatim jobs from the fixture):

| CI decision-job (from fixture) | Buyer function | Thesis product they demand |
|---|---|---|
| *"equity research — quotes, filings, transcripts, live earnings calls"* | Finance / R&D | causal thesis: *"signal X raises earnings-forecast skill on issuer Y"* |
| *"CTI triage stops being manual OSINT … one queryable index"* | Threat-intel / Safety | attribution thesis: *"indicator set X ⇒ actor Y with confidence c"* |
| *"answer hundreds of questions across thousands of documents, every cell traceable to a source line"* | Legal | traceable-answer thesis with per-cell provenance |
| *"comps, precedent transactions, CIM generation, data-room diligence … emit the actual deliverable"* | Business-dev / Finance | valuation thesis emitting a governed `.xlsx/.pptx` |
| *"be FIRST to tell you something is happening … the job is latency, not depth"* | News / Innovation | low-latency event thesis (priced on speed, lower stability tolerance) |
| *"disruption detection, resilience planning"* (supply chain) | Purchasing / Ops | causal thesis on route/supplier failure propagation |

The fixture even records the **structural failure these buyers complain about** — *"Kensho Link/NERD, PitchBook methodology … all unexplained and unappealable. When the system decides two records are the same company, the analyst cannot see the decision, the confidence, or dispute it"* (line ~506). **That is precisely the gap epistemic annealing closes:** a thesis carries its CTEST history, bias passport, coverage, and seal — the buyer can *see the decision, the confidence, and dispute it.* The annealed-thesis product is the antidote to price-opaque, unappealable intelligence.

Function × decision-job coverage (purchasing, R&D, finance, legal, IT, business-dev, innovation/strategy, HR, safety) = the **catalog of what theses buyers will pay to have annealed**, and `Score(C,I,J,A)`'s `J` term (§C.3) reads directly from it.

---

## F. Semantic grounding — every claim/thesis/price is an ontology-typed object

Per the Integrated Semantic Architecture report, the estate uses a **hybrid two-tier ontology** (gist upper + standards-based domain ontologies) over a **four-stage KG lifecycle** (creation → hosting → curation → consumption). Every object in this spec is ontology-typed so it is machine-readable, auditable, and provenance-carrying:

- **Upper tier — gist.** Contribution, Contributor, Agreement (the barter/netting cell), Event (the anneal steps), Organization/Person — the minimal common backbone that lets heterogeneous contributions interoperate.
- **Observation pattern — SOSA/SSN + O&M/QUDT.** A **claim is a `sosa:Observation`**; its annealed result is an **`ObservationResult`** carrying **confidence, aggregation-state, and provenance** (the small-N discipline lives here: an `ObservationResult` below N<30 is typed as un-generalizable). Units/quantities via QUDT; spatial via GeoSPARQL.
- **Provenance — PROV-O.** Every anneal step, CTEST, override, and seal is a `prov:Activity` with `prov:wasGeneratedBy` / `prov:wasAttributedTo` — the same round-trip `keAuthorship.ts` implements (versioned, attributed, receipted; no fabricated provenance).
- **Domain overlays.** **FIBO** for financial theses (instruments, parties, obligations), **UCO/CASE** for threat-intel/law-enforcement theses (evidence lineage, actor attribution), **IOF** for supply-chain theses, **NAICS** for sector/industry classification of the buyer's decision-job. The in-repo **SynapseIQ** already classifies entity *types* into the **KKO (Peircean) ontology** (`NlpExtractionBench.vue`), the estate's realization of the upper-tier typing step.

Thus a **priced thesis** is: a `gist:Contribution` whose core is a `sosa:Observation → ObservationResult` (confidence + small-N state), typed by FIBO/UCO/IOF + NAICS overlays, provenance-chained in PROV-O, sealed by a Merkle receipt, and settled as a `gist:Agreement` (netting cell) over a WEDT corridor.

---

## G. Goodhart & honesty — annealing must not become the gamed metric

Annealing is itself a metric, so it inherits the **GKN#9 Goodhart guard** (min-n ≥ 30, counter-test, no fabricated provenance) reused throughout the estate. Anti-gaming, vector by vector:

| Gaming vector | Guard | Bound to |
|---|---|---|
| Crystallize a generalized claim on thin evidence | small-N gate (N≥30 floor; 10<N<30 partial-pool; N≤10 enumerate) | `MIN_N`, `meetsMinN` (**BOUND**) |
| Rubber-stamp CTEST to farm `Kknow` | `coherence`/`stability` ← precision@1 + drift; low ρ devalues `Kknow` | `precisionAt1`, coverage/parsimony (**BOUND**) |
| Hide a bias to inflate coherence | **bias passport** — declared/uncorrected COGBIAS is portable and visible; unresolved bias caps `coherence` | **proposed** (Debater 2.0) |
| Assert unearned provenance | `Kknow=0` while receipt unsigned; honest `"unsigned — pending seal"` | `keAuthorship` (**BOUND**) |
| Promote a proxy price to certainty | WEDT proxy-hardening: EP/FEQ are the *softest* layer, kept explicit/bounded/versioned, never closed-form | WEDT §14 non-goal (**binding constraint**) |
| Smuggle silent execution via a "priced" action | amber band; blocked actions visible; no universal hidden autonomy | WEDT §9/§13 (**binding**) |
| Server-owned opaque scoring loop (the Codex anti-pattern) | sovereign user-owned receipt chain; stateless inference; every step a first-class receipt | Codex transcript inversion; `receiptHash`/`RunTree` (**BOUND shape**) |

**Explicit proposed-vs-bound labeling is carried in every table above** and consolidated in §I.

---

## H. End-to-end worked trace

**Contribution:** a Researcher (`Ada L.`, HolographMe rep 86 `trusted`) submits the causal claim *"dataset X raises earnings-forecast skill on decision-job Y (equity-research)."*

1. **Candidate (high energy).** Claim submitted as an `evt_id`-stamped `gist:Contribution` / `sosa:Observation`. Provenance opens as `learned`, receipt `unsigned`. `Kknow = 0` (not yet bankable).
2. **Argument mining.** Warrant extracted: X → skill via mechanism M. Parsed to a concept-graph (reasoning-chain token-tree).
3. **Energy = hygiene/bias.** LOGFALL finds no fallacy; **COGBIAS flags selection bias** (X sampled from bull markets). Energy high; **bias passport** records it — *uncorrected*.
4. **Anneal steps = CTEST.** Counter-tests run: bear-market hold-out, counter-example issuers. The **precision@1 counter-test** checks the top-1 plan against declared-gold fixtures. Bias-corrected on re-sample.
5. **Temperature floor = small-N gate.** Corpus reaches **N = 34 ≥ MIN_N (30)** → `meetsMinN = true` → a *generalized* skill claim is now permissible. (Had N been 22, the thesis would be typed **partial-pooling only** — priced but not generalizable.)
6. **Coverage/parsimony.** Thesis covers requested core concepts, no redundant hops; canonical path declared.
7. **Drift monitor → ground state.** Stable across re-runs. Sealed via `keAuthorship` (provenance now `published`, Merkle receipt sealed). **`Kknow` computed** (coverage · coherence · stability · provenance).
8. **Demand ranking.** `SynapseIQ Score(C,I,J,A)` high — J binds to the CI equity-research decision-job (§E). Worth pricing.
9. **Price (ΔEP).** Thesis lowers analyst `ΔCost` (less manual OSINT rediscovery) and raises `ΔProductivity` (faster, traceable forecast) — **controllable spreads only**; the desk's **cost of capital `r` is untouched** (binding non-goal honored).
10. **Demand & settlement.** Equity-research desk (buyer B) demands it. Triparty **netting `Cell`**: A = Ada, B = desk, C = clearing verifier, routed through **Settlement Queue Operations** corridor (amber, blocked actions visible). `Escrowed → Filled → Verified → Released`; `TruthClass ATTESTED → PROVEN`; admissibility → `release`. Optional numéraire: ASI nets the barter.
11. **Reputation-weighted payout.** `Pcleared = Pbase · w(rep_Ada 0.93) · g(release 1.0)` (VT §3.0). **Sovereign receipt** sealed; the buyer owns the evidence chain and can *inspect the CTEST history, bias passport, coverage, and confidence, and dispute it* — the antidote to unappealable intelligence (§E).
12. **What refusal looks like.** Had the claim stayed high-energy — selection bias uncorrected, or N = 12 — it settles as a **first-class refusal receipt**: *"REFUSED — below small-N (12<30); selection-bias in bias passport uncorrected; not generalizable."* The buyer sees the refusal (WEDT visible-refusal mandate; Codex clean-boundary-refusal), the corridor logs a **blocked action visibly**, and `Kknow = 0`. The refusal itself has value: it prevented a bad forecast trade.

---

## I. Bound-vs-proposed ledger & open questions

### Bound to real estate code / on-disk specs
- **The anneal-gate (real code):** reasoning-chain `scoreVariants.ts` (`MIN_N=30`, `precisionAt1()`, `meetsMinN`, coverage/parsimony, declared-path tie-break), `examples.ts` (`LOGGED_QUESTIONS`, `publishable=false until real logs`), `keAuthorship.ts` (sealed vs unsigned receipt, no fabricated provenance).
- **Settlement substrate:** `src/data/marketplaceFixture.ts` (netting `Cell`, `Stage`, `TruthClass`, `Admissibility`); reputation weighting `src/features/reputation/reputation.ts`; receipts `executions-ledger/types.ts` (FED §0.#7).
- **Promotion/catalog analog:** `knowledge-studio/fixture.ts` (lifecycle → `catalog`, Deploy **blocked** by promotion gate on F1 + missing signed version receipt, `perfGateThreshold 0.8`, `atlas/autopilot promotion_controller`, `model-governance-ledger`).
- **Demand taxonomy:** `competitive-intelligence/marketProfessionalIntelligence.ts` (`job` decision-jobs, the price-opacity complaint).
- **SynapseIQ (in-repo):** KKO/Peircean entity-type classification surface (`NlpExtractionBench.vue`, `nlpFixture.ts`).
- **On-disk external specs (cited, not in this repo tree):** WEDT whitepaper v2.9 (5 corridors, amber band, blocked-actions-visible, seal receipts, non-goals, ontological order); Codex Plugin Registry transcript (sovereign receipts, stateless inference, `feature.capability` refusal gap); Integrated Semantic Architecture (gist + FIBO/UCO/IOF + PROV-O + four-stage lifecycle).

### Proposed as new (no implementation in-repo)
- **Debater 2.0 engine** and its vocabulary (`evt_id`, `ruleset_semver 1.3.0`, **LOGFALL/COGBIAS** detectors, **CTEST** cycles, **bias passports**, Merkle receipts) — a **sibling-repo** concept; only its small-N/counter-test core is realized (as precision@1).
- The **annealing schedule** (energy = hygiene/bias, anneal steps = CTEST, temperature floor = small-N).
- `Kknow = coverage·coherence·stability·provenance` (the `coherence`/`stability` factors are annealing-derived and proposed).
- The **ΔEP variance decomposition** pricing and the **barter-exchange-rate-by-annealing** mechanism.
- **SynapseIQ `Score(C,I,J,A)`** demand-ranking (the KKO surface is real; the score function is proposed).
- Sibling repos referenced but **not present** here: `economic-prophet`, `profit-mpcc`, `prophet-core-*`, `synapseiq`, Debater 2.0.

### Binding constraints these proposals must respect (from WEDT non-goals)
- No closed-form EP_R/EP_Civ/FEQ — pricing stays a governed, versioned proxy (softest metrics layer).
- No universal hidden autonomy — amber band, visible blocked actions, no silent cross-corridor execution.
- No proxy promotion to false certainty — a priced thesis is a bounded claim, not truth.
- Markets are 4th in the ontological order — verification (annealing) precedes pricing; provisioning/pedagogy precede markets.
- Visible refusal is mandatory — a failed anneal is a first-class priced, visible outcome.

### Open questions for @mdheller
1. **Debater 2.0 location & contract.** Which sibling repo hosts Debater 2.0, and is `ruleset_semver 1.3.0` a real published ruleset? To bind the anneal engine, we need its event/receipt schema (does it mirror `keAuthorship`/`skill-execution-events`?).
2. **`Score(C,I,J,A)` definition.** What are C/I/J/A precisely, and does SynapseIQ compute it or is it a separate demand-ranker? Confirm `J` reads the CI decision-job taxonomy.
3. **Corridor ↔ offering mapping.** Should each WEDT corridor map to a marketplace `moduleContract` (FED §A), so a thesis's settlement corridor is chosen by its offering type? E.g. finance theses → Treasury/Liquidity or Settlement Queue Ops.
4. **Barter numéraire policy.** Is pure barter (no ASI) a first-class settlement mode, or must every swap net through ASI? The netting `Cell` currently always carries `netAmount` in ASI.
5. **Anneal-gate operator.** Is the `atlas/autopilot promotion_controller` (the knowledge-studio Deploy gate) the intended operator of the production anneal-gate, unifying it with the precision@1 gate?
6. **Energy-weight calibration.** LOGFALL/COGBIAS severity → energy weights, and `k₀`/`λ` from VT — no in-repo calibration source. Governance-set constants, or learned from a governed log once real logged questions land (the `publishable=false` follow-up)?
7. **Refusal pricing.** Can a refusal receipt carry *positive* value (it prevented a bad decision), and if so who pays for a good refusal — the buyer who was protected, a platform safety subsidy, or no one?

---

*Cross-linked to `marketplace-federation-patterns.md` (§0 bindings) and `marketplace-value-transfer-model.md` (ΔEP/Kknow/settlement). All annealing/pricing formulas are a proposed modeling framework; the precision@1 counter-test gate is the one implemented anneal-gate. WEDT non-goals are treated as binding constraints. No fabricated provenance, settlement, or economic guarantees.*

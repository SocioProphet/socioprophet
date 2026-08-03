# Framework Grounding — Value, Attention, and the Governed Estate

**Status:** master grounding document + codification status + gap analysis · v0.1
**What this is:** the single reasoned document that grounds the framework and its motivations, indexes the whole document family and the real code, states honestly what is *functional* vs *prose*, and lists the gaps across the entire design discussion. If you read one file, read this one.

---

## 1. The thesis, grounded (motivation → axiom → mechanism → market)

**Motivation.** Value in this estate is not assumed to be money, tokens, or prices. Those are instruments. The framework asks what they are instruments *of*, and answers: human life and attention.

**Axiom** (`value-axiom-human-attention.md`). The root unit of value is **qualified human attention** — the informed, low-asymmetry, non-coerced attention of a living person operationalizing their own value judgements. *There is no value without human life.* Longer, healthier, better-educated lives produce a larger reservoir of qualified attention, which is what lets a community *insulate against error and regression* through social systems. Everything priced is a derivative claim on that reservoir.

**Mechanism.** Raw attention maximized for volume is the surveillance/engagement economy — the predatory dynamic the framework refuses. What converts *raw* attention into *value-bearing* attention is the removal of information asymmetry: evidence grounding, argument hygiene, counter-tests, small-N discipline. That conversion is measured by **`Kknow` = coverage · coherence · stability · provenance** — so telos (grow healthy, educated, un-manipulated attention) and mechanism (govern reasoning to strip asymmetry) are the *same operation*.

**Market.** Qualified attention, once produced, is exchanged in a **p2p barter network** where heterogeneous contributions are priced not by a fixed rate but by **epistemic annealing** — iterated debate + counter-test cycles that grind a raw claim into a stable, evidence-grounded **causal-abduction thesis**. That thesis carries `Kknow`, prices via a bounded **ΔEP / Funds-Transfer-Pricing** model, and settles over a **governed triparty netting fabric** / bounded corridor, weighted by reputation. Markets are *fourth* in the order (provisioning → pedagogy → institutions → markets) precisely because they are derivative of the human substrate.

**The one non-negotiable invariant.** The peg is *qualified* attention. If "qualified" degrades into "engagement," the framework becomes the attention economy with better branding — a Goodhart failure on the sacred unit. The estate's guards (no-fabricated-provenance, small-N/precision@1 discipline, fairness guard, anti-capture governance) are the *only* thing holding that line, and the framework is worth exactly as much as they are enforced.

---

## 2. The connections that make it one system (not a pile of specs)

- **The precision@1 gate IS Debater-2.0 small-N discipline, in code.** `MIN_N=30` == "N≥30 standard inference"; `meetsMinN`/`publishable` == "no generalized claim below small-N"; coverage+parsimony == argument-hygiene grounding; `keAuthorship` sealed receipt == thesis ground-state provenance. The anneal-gate already exists as a working stub.
- **`Kknow` is measured qualified attention.** Its factors (coverage, coherence, stability, provenance) are the axiom's qualifier made numeric — now computed over the twin in `valueModel.ts`.
- **The WEDT ontological order is a corollary of the axiom**, not a separate choice: markets are 4th because value roots in the human substrate.
- **Settlement is the same at two altitudes:** WEDT bounded corridors (governance view) and the Governed Triparty Netting Fabric (release-constitution view); §16 residual-only netting vindicates "most value cancels in-face; only residual settles in ASI."
- **The three token tiers = the three instruments:** Tier-1 ASI (reserve, pegged to qualified attention), Tier-2 credits (flow), Tier-3 reputation (governance); `Mint_T3` decomposes the reputation weight back into `Kknow` + sealed receipt + anti-Sybil identity.
- **FTP is the real transfer-pricing engine** behind the hand-rolled `Pcleared`; the hurdle rate is exogenous, so knowledge never buys down the cost of capital — now enforced as a test in `valueModel.test.ts`.
- **One operation object connects every surface** (Taskwarrior reference): typed, dependency-aware, hook-gated (fail-closed), replica-synced — serves offering actions, Labor-Network requests, WorkspaceOperations, and anneal-gate steps alike.

---

## 3. Document family (index)

| Doc | Grounds |
|---|---|
| **`FRAMEWORK_GROUNDING.md`** (this) | master synthesis + codification status + gap analysis |
| `value-axiom-human-attention.md` | the root axiom: qualified attention as value; the qualified-vs-captured invariant |
| `marketplace-federation-patterns.md` (FED) | offering registry; vendor/app/federation taxonomy; action model bound to 15 estate contracts |
| `marketplace-value-transfer-model.md` (VT) | archetype ledger; `Kknow`/ΔEP; transfer pricing (intra/inter/user⇄agent); netting-cell settlement |
| `marketplace-epistemic-annealing-pricing.md` (EAP) | barter network; Debater-2.0 annealing; thesis→price; the precision@1 anneal-gate |
| `marketplace-token-settlement-pricing.md` | reconciles FED/VT/EAP to canonical sources (Netting Fabric v11, EP v37, 3-tier token, Taskwarrior) |

Canonical external sources (on disk, not in-repo): World Economy Digital Twin v2.9, Governed Triparty Netting Fabric v11, Economic Profit Methodology v37, Integrated Token Ecosystem Dossier, Integrated Semantic Architecture, Debater 2.0 spec, Codex Plugin Registry transcript, SynapseIQ integrated design doc.

---

## 4. Codification status — the honest answer to "is it functional?"

**No, not as a whole.** The framework is *reasoned in full* (this family) but only *partially codified*, and the reasoned docs were, until this pass, **orphans referenced by zero code**. Status of every major concept:

| Concept | Status | Where |
|---|---|---|
| Governed variant scorer + precision@1 counter-test gate | **FUNCTIONAL (code + tests)** | `src/features/reasoning-chain/scoreVariants.ts`, `examples.ts`; `reasoningChainScorer.test.ts` (20/20) |
| Value axiom → `Kknow` / qualified-attention / EP-like signal over the twin | **FUNCTIONAL (code + tests) — first codified slice, this pass** | `src/features/valueModel.ts`; `valueModel.test.ts` (9/9) |
| Twin state-space engine (fail-closed gates) | **FUNCTIONAL (code + tests)** | `src/features/twinStateSpace.ts`; `twin.test.ts` |
| Netting/clearing market + admissibility lattice | **FIXTURE-backed surface** | `src/data/marketplaceFixture.ts` → `Marketplace.vue` |
| Labor Network (request/response/compensation) | **FIXTURE-backed surface** | `src/data/laborMarketFixture.ts` → `LaborMarket.vue` |
| Value-driver tree (ΔEP drivers) | **FIXTURE/API surface** | `vdtApi` → `ValueDriverTree.vue` |
| Reputation (trust weighting) | **FIXTURE-backed** | `src/features/reputation/reputation.ts` |
| Control-plane seats/roles/autonomy | **FIXTURE-backed** | `src/features/controlPlane/*` |
| Barter/annealing pipeline, token tiers, EP/FTP pricing, netting-fabric §15 causal controller | **PROSE ONLY** | the doc family |
| Debater 2.0 engine (LOGFALL/COGBIAS/CTEST/bias-passport) | **SIBLING REPO / EXTERNAL** | not in this worktree |
| `economic-prophet`, `profit-mpcc`, `prophet-core-*` | **SIBLING REPOS** | not in this worktree |

---

## 5. Gap analysis across the entire discussion

**G1 — The spine is prose, the surfaces are disconnected.** The functional pieces (twin engine, netting market, labor market, value-driver tree, reasoning gate, reputation) exist but are **not connected by the framework logic**. Nothing computes a thesis price, pegs a reserve to qualified attention, or routes a barter transfer end-to-end. *First stitch made this pass:* `valueModel.ts` connects the value axiom to the twin engine. *Remaining:* wire `Kknow` → value-driver tree; wire annealing → marketplace cells; wire reputation → transfer price.

**G2 — Docs were orphans.** The 6 design docs are referenced by zero code and surfaced in no UI. *Partly closed:* this master doc indexes them. *Open:* no in-app "framework" surface renders them; consider a docs route or an `About/Grounding` page.

**G3 — Economics is banking-domain, unmapped.** EP v37 / FTP are bank methodologies (Basel III, regulatory capital). The mapping to a knowledge/labor barter network (NOPAT→surplus, Capital→imputed stake, FTP→inter-archetype price) is **real modelling work, not done**. `valueModel.ts` implements only a bounded EP-*like* signal, honestly labelled a model.

**G4 — No annealing engine.** Debater 2.0 (LOGFALL/COGBIAS/CTEST/bias-passport/`ruleset_semver 1.3.0`) is the reasoning core that "anneals" value; it is **absent from this repo**. The precision@1 gate is its only implemented fragment. Gap: is Debater 2.0 a real ruleset with a bindable schema, and where does it live?

**G5 — No calibration for any coefficient.** Every weight is a placeholder: `Kknow` `k₀`, the `Score(C,I,J,A)` weight vector, `Mint_T3` factors, `HURDLE_DEFAULT`, `w(rep)`/`g(adm)`, urgency coefficients. No calibration source exists in-repo.

**G6 — No production data.** The precision@1 gate is honest that its corpus is authored, so `publishable=false` until real logged questions land. The same discipline will apply to any attention/health/education figure — none may be claimed without real data + provenance.

**G7 — The qualified-vs-captured invariant is asserted, not enforced.** The framework's central risk (§1). `valueModel.ts` enforces a fail-closed banking gate as a first mechanism, but "(1 − information_asymmetry)" is not yet operationalized, and the anti-capture / plural-trainer governance is prose only.

**G8 — Settlement duplication unresolved.** WEDT corridors vs Netting Fabric triparty faces are the same clearing family at two altitudes but are not unified into one `settlement` object; `marketplaceFixture` shadows both partially.

**G9 — Sibling-repo seams.** The framework leans on `economic-prophet`, `profit-mpcc`, `prophet-core-*`, an Agent Registry / Policy Fabric, and `execution-receipt.schema.json` — all **outside this worktree**. Nothing here can be end-to-end functional until those are integrated or stubbed.

---

## 6. Codification roadmap (prose → functional), on the twin platform

Ordered from cheapest real code to hardest, each a bounded, testable slice:

1. **[DONE]** Value axiom over the twin — `valueModel.ts` (`Kknow`, EP-like signal, exogenous-hurdle + fail-closed invariants, tested).
2. Surface `valueModel` in `TwinWorldModel.vue` / `ValueDriverTree.vue` — render a live `Kknow`/value reading off the twin state; wire `coverage`/`drift` to the annealing story.
3. A `CausalAbductionThesis` type + a minimal anneal-gate that reuses the reasoning-chain scorer (thesis = scored variant that clears `meetsMinN` + sealed receipt).
4. A `settlement` module unifying WEDT corridor + triparty face over `marketplaceFixture` (admissibility lattice → release/export gates; blocked/refunded first-class).
5. Token-tier types (ASI/credits/reputation) with `Mint_T3` computed from `Kknow` + reputation; separation-of-functions as an invariant test.
6. A `WorkspaceOperation`/Request object (Taskwarrior-referenced: status+depends+hooks+urgency==`Score()`), connecting FED actions ↔ Labor Network.
7. Calibration + real-data gates (G5/G6) — deferred until sources exist; keep everything a labelled model until then.

Items 3–7 partly depend on the sibling repos (G9); until those land, they remain honest models, not claims.

---

## 7. Consolidated open questions for @mdheller

1. Where does Debater 2.0 live, and is `ruleset_semver 1.3.0` a real, bindable ruleset (G4)?
2. Should the reasoned docs get an in-app surface (docs route / Grounding page), or stay repo docs (G2)?
3. Is the production anneal-gate the reasoning-chain scorer generalized, the `atlas/autopilot promotion_controller`, or the Netting Fabric §15 Causal Controller — and how do they relate?
4. Unify WEDT corridors and Netting Fabric faces into one `settlement` object (G8)?
5. Calibration sources for the coefficient vectors (G5)?
6. How is "(1 − information_asymmetry)" made auditable without becoming a surveillance metric (G7 — the crux)?
7. Which sibling repos (`economic-prophet`/`profit-mpcc`/`prophet-core-*`) should be integrated or stubbed first to make an end-to-end slice functional (G9)?

---

*Master grounding for the value/marketplace framework. Asserts a normative foundation and indexes real code + reasoned prose; claims no economic or attention measurement. `valueModel.ts` is a functional model, not a measurement. The framework's worth is bounded by enforcement of the qualified-vs-captured attention distinction (§1). No fabricated provenance, settlement, or economic guarantees.*

# Marketplace & Federation Patterns

**Status:** draft / design spec (not code)
**Scope:** A registry model for the SocioProphet estate's **marketplace** — vendors & services, apps, and federation providers in the "global mesh" — and how every offering's **user-facing actions** and **agentic actions/operations/roles** integrate into the estate's governed action model.
**Audience:** @mdheller and the control-plane / entity-fabric / reasoning-chain owners.

> **Design stance — consume, don't fork.** This spec deliberately does **not** invent a parallel capability, policy, or receipt model. Every offering type binds to contracts that already ship in the estate: the **MeshSkill** descriptor, the **Skill Execution Lifecycle** + events, the Rego **policy pack**, the **agentos tool registry**, the **agentplane bundle** substrate, the reasoning-chain **governed executors** (`namespace:Operation(args)`), the **Executions Ledger** run-tree, and the **Organization Control Plane** seat/role/grant model. Only the *marketplace offering envelope* that stitches these together is new, and it is labelled **PROPOSED** throughout.

---

## 0. Contracts this spec binds to

| # | Contract | Repo path | Role in the marketplace model |
|---|----------|-----------|-------------------------------|
| 1 | **MeshSkill descriptor** | `schemas/control-plane/mesh-skill.schema.json`, `specs/control-plane/mesh-skills-v0.1.md` | The typed, versioned, policy-bound **capability/action object**. An offering's declared action surface is a set of MeshSkills. |
| 2 | **Skill Execution Lifecycle + events** | `specs/control-plane/skill-execution-lifecycle-v0.1.md`, `schemas/events/skill-execution-events.schema.json` | The admission → materialize → execute → evidence → evaluate → approve → promote/commit flow and its event trail (`actor.kind`, `run.parent_run_id`, cairns). The **receipting** substrate. |
| 3 | **Default policy pack (Rego)** | `policies/skills/default-policy-pack.rego` | The **authorization layer** — `allow` / `deny[]` / autoapprove / human-approval gates. The estate's `GrantType` engine. |
| 4 | **AgentOS tool registry** | `registry/agentos-tool-registry.yaml` / `.csv` (mirrored at `agentos/registry/`) | The existing **vendor/provider catalog** (`id`, `layer`, `license_spdx`, `risk`, `adapter`, `default_context`, `zip_meta` license signals). |
| 5 | **Agentplane bundle + fleet** | `agentplane/schemas/bundle.schema.v0.1.json`, `agentplane/fleet/inventory.json`, `agentplane/docs/executors.md` | The **federation/deployment substrate** — executor selection, VM backend, policy-pack pointer, secret refs, egress allowlist. How a provider is *fielded* into the mesh. |
| 6 | **Reasoning-chain governed executors** | `socioprophet-web/client-vue/src/features/reasoning-chain/{examples,scoreVariants,kindVocabulary,keAuthorship}.ts` | The `namespace:Operation(args)` **executor-binding** vocabulary, the governed variant **scorer**, the **precision@1** gate, and the receipted **authorship** round-trip ("learn, don't match dictionaries"; no fabricated provenance). |
| 7 | **Executions Ledger** | `socioprophet-web/client-vue/src/features/executions-ledger/types.ts` | The **run-tree** receipt model (`ExecutionRow`, `RunTree`, `run.handoffFrom`, `authorityBand`, `capabilitiesHeld`/`capabilitiesUsed`, `receiptHash`). |
| 8 | **Organization Control Plane** | `socioprophet-web/client-vue/src/features/controlPlane/governance.ts`, `socioprophet-web/client-vue/src/data/controlPlaneFixture.ts` | The **role/grant model** — `Seat`, `AutonomyLevel` (L0–L5), `RolePolicy { autonomyCap, membrane[] }`, `AuditEntry`, `sealReceipt`. |
| 9 | **Entity Fabric** | `entity-fabric/contracts/OVERVIEW.md`, `entity-fabric/contracts/entity_fabric_avro.avsc` | **Provider identity / trust / rights** — `rights_profile`, `credential`, `designation_event`, statement-first provenance, rights & redistribution constraints first-class. |
| 10 | **OpenClaw provenance plugin** | `agentos/integrations/openclaw/plugins/openclaw-socioprophet-provenance/` | A concrete **federation-provider** already in the estate (a swappable provider fulfilling a provenance-emission contract). |
| 11 | **Contract-Surfaces registry** | `socioprophet-web/client-vue/src/features/contract-surfaces/{types.ts,registry.ts}` | The estate's **authority + action-affordance ontology** — `ContractSurface`, `ContractSurfaceAuthority` (evidence-only → live-execution-authorized ladder), `ContractActionAffordance { allowedActions, blockedActions }`, `admissionRequirementRefs`, `capabilityProfileRef`, `receiptRefs`. Already references an external **Agent Registry / Policy Fabric / AgentTerm + grant refs**. |
| 12 | **HolographMe reputation** | `socioprophet-web/client-vue/src/features/reputation/reputation.ts` | **Portable provider trust** — `Reputation { tier, hats, attestations, disputes }`, `Tier ∈ {trusted, established, emerging, unrated}`. Its fixture already carries **marketplace providers**. |
| 13 | **Feature Library (capability catalog)** | `socioprophet-web/client-vue/src/features/competitive-intelligence/featureLibrary.ts` | The estate's **capability registry** — `FeatureType`, `CapabilityOwner { kind: tritfabric\|tritrpc\|model\|estate, path }`, readiness/stance lenses. Each capability cites a real owning path. |
| 14 | **Netting/clearing marketplace** | `socioprophet-web/client-vue/src/data/marketplaceFixture.ts` (route `/marketplace`) | The estate's **existing `/marketplace`** — a *triparty netting/clearing market* (not a provider catalog). Source of the **trust/admissibility lattices** `TruthClass ∈ {PROVEN, ATTESTED, INFERRED, REPUTED}` and `Admissibility ∈ {evidence, admit, release, export}`. **Naming collision — see §A.0.** |
| 15 | **AgenticOS / GRL+ policy matrix** | `socioprophet-web/client-vue/src/data/agenticOsFixture.ts`; `standards/grlplus/domain_action_policy_matrix.json` | `AgentPod` / `SharedLibrary` (incl. `identity-plane`) / `Opportunity` partner-lane registry; the **domain×action policy matrix** (`closure_rule_catalog`, `escalation_rule_catalog`, per-profile `review_owner_template`). |

The user-supplied **Action/Policy ontology** (Agent, ReadAction/ModifyAction, ActionScope, GrantLevel, GrantType, AccessAlignmentState, `executedBy`/`representsAction`) is treated as a **reference vocabulary** and is *mapped onto* the real contracts above rather than introduced as new classes. The mapping table is §3.4.

> One notable existing signal: the Control Plane seat fixture already lists **`marketplace`** as a capability surface a seat may hold (`controlPlaneFixture.ts` → `SEATS[].usedSurfaces` includes `'marketplace'`). So "marketplace" is an already-named membrane surface; this spec gives it a contract.

> **⚠ Naming collision (must reconcile).** The estate **already ships a `/marketplace` route** (`marketplaceFixture.ts`, `config/routeRegistry.ts`) — but it is a **triparty netting/clearing market** for tradable assets (legs A/B/C, escrow→fill→verify→release stages), **not** a registry of vendors/apps/providers. The offering registry this document specifies is a **different object**. To avoid overloading the term, this spec calls its registry the **Offering Registry** and its surface `marketplace.offerings`; whether that lives under a renamed route, a sub-route of `/marketplace`, or elsewhere is an open question (§H.1). Where this spec *reuses* the netting market it does so only for its **trust/admissibility lattices** (`TruthClass`, `Admissibility`), which are domain-neutral.

---

## A. Marketplace taxonomy — the offering types

The marketplace is a **registry of offerings**. Every offering, whatever its type, resolves to the same underlying shape: a **stable module/capability contract** fulfilled by a **swappable, federated provider**, whose actions are declared as **MeshSkills** and authorized through the **policy pack**. The three types differ in *what contract they fulfill* and *how they federate*, not in how they are governed.

The Medusa-style intuition the estate borrows: a **core** with pluggable **modules**, each module fulfilled by an interchangeable external **provider**, driven by entry surfaces through `Entry → Workflow → Module → Store`. In the estate the substitution is:

| Medusa concept | Estate binding |
|----------------|----------------|
| Module contract | **MeshSkill class + coordinates + inputs/outputs/evidence** (contract #1) |
| Provider/vendor implementation | **Tool-registry entry + agentplane bundle** (contracts #4, #5) |
| Workflow engine | **Skill Execution Lifecycle** (contract #2) |
| HTTP / Admin / Storefront entry | Estate UI surfaces (Control Plane, Feature Library, Executions Ledger) |
| Database | Entity Fabric + claim/knowledge plane |

### A.1 Vendors & Services (Commerce-style modules)

**What it is.** An external product that fulfils a **domain module contract** — the estate analog of Medusa's *Commerce* modules (Product, Cart, Payment, Fulfillment, Inventory…). The reference-component domain (Acoustic Campaign, surfaced in `reasoning-chain/examples.ts`) is exactly this shape: an email/campaign service exposing entities (contacts, mailings, segments) and operations (`engage:GetMailingsByDates`, `engage:RankByMetric(openRate)`).

- **Module/capability contract:** a named domain module (e.g. `module.payment`, `module.fulfillment`, `module.campaign`) whose contract is the set of MeshSkill *classes* it must support (typically `read` + `commit`) and the `namespace:Operation` executors it must bind.
- **Federation:** swap the provider behind the stable executor namespace. `stripe:CreatePaymentIntent` and `odoo:CreateSalesOrder` both fulfil `module.payment.create` — the executor prefix (`stripe:`, `odoo:`) changes; the concept→executor *binding* stays governed by the reasoning-chain scorer (§C, §E).

### A.2 Apps (composed offerings / workflows)

**What it is.** A packaged **composition** over one or more modules — the estate analog of a Medusa *plugin* or an installed storefront app. An App does not necessarily bring its own vendor backend; it brings a **plan** (`MeshSkill.spec.plan.ref`) that orchestrates other offerings' executors, plus its own UI surface.

- **Module/capability contract:** declares the modules it *consumes* and the MeshSkill `plan` it *provides*. Its `side_effects` roll up from the executors it calls.
- **Federation:** an App is fielded as an **agentplane bundle** (`agentplane/schemas/bundle.schema.v0.1.json`) — it names an executor, a VM backend, a policy-pack pointer, secret refs, and an egress allowlist. Swapping an App means swapping the bundle behind the same declared plan contract.

### A.3 Federation providers (Infrastructure modules in the global mesh)

**What it is.** A provider fulfilling a cross-cutting **infrastructure module** — the estate analog of Medusa's *Analytics / Cache / Event / File / Locking / Notification / Workflow* modules. In the estate these are the **agentplane executors** and **integration providers** (e.g. the OpenClaw provenance plugin fulfilling a provenance/event contract; a Lima executor fulfilling the compute-fielding contract in `agentplane/fleet/inventory.json`).

- **Module/capability contract:** an infrastructure interface — e.g. `infra.event`, `infra.provenance`, `infra.file`, `infra.notification`, `infra.compute` — with a fixed operation set and a required-evidence obligation.
- **Federation:** these are the *most* swappable. A provider registers as a tool-registry entry with an **`adapter`** (the registry already carries `adapter: Orchestrator | ProcessSpine | Executor | GitService | …`), is fielded through a bundle/fleet executor, and is selected by the estate's **executor-selection precedence** (`agentplane/docs/executors.md`: bundle-pinned → fleet default → host fallback).

| Offering type | Fulfils | Federated as | Primary MeshSkill classes |
|---|---|---|---|
| **Vendor/Service** | domain module (`module.*`) | tool-registry entry + adapter | `read`, `commit` |
| **App** | composed plan over modules | agentplane bundle | `read`, `verify`, `commit` (rolled up) |
| **Federation provider** | infrastructure module (`infra.*`) | registry adapter + fleet executor | `read`, `replay`, `simulate`, `verify` |

---

## B. Offering catalog / registry schema — `MarketplaceOffering` **(PROPOSED)**

There is **no existing schema for a marketplace catalog entry** — the AgentOS tool registry (`registry/agentos-tool-registry.yaml`) is the closest, but it catalogs *tools/vendors* for licensing/risk, not their action surface or module contract. This spec **proposes** a thin **`MarketplaceOffering`** envelope that *references* existing objects rather than duplicating them. It is `additionalProperties: false` at the top level and every substantive field is a **ref** to a contract from §0.

```yaml
# PROPOSED — apiVersion: marketplace.socioprophet.org/v0.1alpha
apiVersion: marketplace.socioprophet.org/v0.1alpha
kind: MarketplaceOffering
metadata:
  id: sp.market.<offeringType>.<name>@<version>   # braided-naming, matches MeshSkill metadata.id style
  merkle_root: sha256:...                          # content commitment (as MeshSkill.metadata.merkle_root)
  signer: <publisher-identity>                     # who published (as MeshSkill.metadata.signer)
spec:
  # --- identity & type ---
  offeringType: vendor_service | app | federation_provider   # §A
  displayName: string
  summary: string

  # --- provider (who fulfils it) — BINDS to the tool registry (contract #4) ---
  provider:
    registryRef: registry/agentos-tool-registry.yaml#<id>     # existing vendor row
    adapter: Orchestrator | Executor | ProcessSpine | ...     # registry `adapter`
    license_spdx: string                                      # registry `license_spdx`
    risk: green | yellow | red                                # registry `risk`

  # --- module contract it fulfils (what it is) — §A ---
  moduleContract:
    module: module.payment | module.campaign | infra.event | ...
    contractVersion: string
    substitutable: true            # swappable behind the stable module contract

  # --- authority band — BINDS to Contract-Surfaces (contract #11) ---
  authority: evidence-only | request-only | admission-required
           | runtime-control-required | authority-mutation-required | live-execution-authorized

  # --- capabilities = declared action surface — BINDS to MeshSkill (#1) + Contract-Surfaces affordances (#11) ---
  capabilities:
    executorNamespace: stripe | shipstation | posthog | engage | ...   # the `namespace:` prefix
    meshSkills:                    # each = a MeshSkill descriptor (schemas/control-plane/mesh-skill.schema.json)
      - ref: control://meshskills/<offering>/<skill>@<ver>
        class: read | replay | simulate | verify | commit
        # ...coordinates / actions / inputs / outputs / evidence per MeshSkill spec
    allowedActions:                # ContractActionAffordance[] — surfaced/executable now
      - { id: stripe:GetBalance, state: available, requirementRefs: [...] }
    blockedActions:                # ContractActionAffordance[] — declared but gated (boundary stated, never hidden)
      - { id: stripe:CreatePaymentIntent, state: blocked, requirementRefs: [human-approval, agent-registry-grant] }
    admissionRequirementRefs: [...] # Agent Registry / Policy Fabric decision refs, grant refs, session ref (#11)
    capabilityProfileRef: <ref>     # agent-registry grants required for non-human participants (#11)
    receiptRefs: [...]              # execution-receipt refs once run (#7)

  # --- trust / provenance signals — BINDS to HolographMe (#12), Entity Fabric (#9),
  #     and the netting-market lattices (#14) ---
  trust:
    reputationRef: reputation#<providerId>                    # HolographMe Reputation (tier, hats, attestations, disputes)
    truthClass: PROVEN | ATTESTED | INFERRED | REPUTED        # marketplaceFixture TruthClass lattice
    admissibility: evidence | admit | release | export        # marketplaceFixture Admissibility lattice
    rightsProfileRef: entity-fabric#rights_profile/<id>       # redistribution / usage rights
    credentialRefs: [entity-fabric#credential/<id>]           # provider credentials
    designationEvents: [entity-fabric#designation_event/<id>] # sanctions/flags, if any
    provenanceClass: learned | human_authored | published     # (kindVocabulary ProvenanceClass, extended)

  # --- pricing / commercial (declared, not enforced here) ---
  pricing:
    model: free | subscription | usage | commercial_tier
    notes: string

  # --- federation (how it is fielded) — BINDS to agentplane (contract #5) ---
  federation:
    bundleRef: agentplane/bundles/<name>/bundle.json          # deployment envelope
    executorRef: agentplane/fleet/inventory.json#<executor>   # or bundle-pinned
    egressAllowlist: [dns, https, ...]                        # from bundle.vm.network

  # --- policy binding — BINDS to the policy pack (contract #3) ---
  policy:
    policyPackRef: policies/skills/default-policy-pack.rego   # or an offering-specific overlay
    membraneSurface: marketplace                              # Control Plane capability surface (RolePolicy.membrane)
```

**Field families and where each is authoritative:**

- **identity** → this envelope (`metadata.id`, `merkle_root`, `signer`) mirroring MeshSkill metadata.
- **provider** → **not re-described**; a ref into `registry/agentos-tool-registry.yaml` (id, adapter, license, risk).
- **module contract** → the offering's *type contract* (§A); the only genuinely new naming (`module.*` / `infra.*`), labelled proposed.
- **authority** → **`ContractSurfaceAuthority`** ladder (contract #11) — the coarse gate above the per-action affordances.
- **capabilities / declared action surface** → **MeshSkill descriptors** (contract #1) + **`ContractActionAffordance` allowed/blocked** lists and admission/capability/receipt refs (contract #11). This is the load-bearing field (§C). Blocked actions are **declared with their boundary, never hidden** (mirrors `contract-surfaces` `boundaryNotice`).
- **trust / provenance** → **HolographMe `Reputation`/`Tier`** (contract #12) as the primary provider-trust signal, the netting-market **`TruthClass`/`Admissibility`** lattices (contract #14), and **Entity Fabric** rights/credentials (contract #9) + the reasoning-chain `ProvenanceClass`.
- **pricing** → declared free-text/enum; not authorization-relevant.
- **federation** → **agentplane bundle + fleet** (contract #5).
- **policy** → **policy pack** pointer + Control Plane **membrane surface** (contract #8).

---

## C. Action & operation model

Every offering declares its actions as **MeshSkills** (contract #1) whose atomic operations use the reasoning-chain **`namespace:Operation(args)`** executor form (contract #6). This is the same form the scorer already governs — `engage:GetMailingsByDates(rollup:descendants)`, `common:ShowDataMessage`, `data:FillConditionIn` in `examples.ts`. Marketplace executors simply add new provider namespaces (`stripe:`, `shipstation:`, `posthog:`).

### C.1 The two action populations

For each offering, the declared action surface splits into:

1. **User-executable actions** — invoked by a human seat through an entry surface. Framed as governed executors:
   - `stripe:CreatePaymentIntent`, `stripe:RefundCharge`, `stripe:GetBalance`
   - `shipstation:CreateShipment`, `shipstation:GetRates`, `shipstation:VoidLabel`
   - `posthog:QueryEvents`, `posthog:GetFunnel`, `posthog:CaptureEvent`
2. **Agentic actions/operations** — invoked *by an autonomous agent* against/through the offering (via the reasoning-chain planner → scorer → executor path). Same executors, but reached through a **plan** the scorer selects, and gated by the agent's **authority band** (§D). An agent may only reach an executor that a MeshSkill binds *and* its role's membrane admits.

The distinction is **not** in the executor — it is in the **actor.kind** (`human` vs `agent`, contract #2) and the **authority band** required. The *same* `stripe:CreatePaymentIntent` executor is a user action when a seat clicks it and an agentic action when an agent plans it; the policy pack evaluates both identically against the MeshSkill's `class` + `coordinates`.

### C.2 Ontology typing of each action

Each declared executor is typed against the reference Action ontology **by mapping to real MeshSkill fields**, so authorization is explicit:

| Reference-ontology concept | Estate-contract carrier | Example |
|---|---|---|
| **ReadAction** | `MeshSkill.spec.class ∈ {read, replay, simulate, verify}` + `side_effects ∈ {none, ephemeral_internal}` | `posthog:QueryEvents` → class `read`, side_effects `none` |
| **ModifyAction** | `MeshSkill.spec.class = commit` + `side_effects ∈ {artifact_write, topology_mutation, external_commit}` | `stripe:CreatePaymentIntent` → class `commit`, side_effects `external_commit` |
| **ActionScope** (View / Process / Insert / Update / Delete) | `side_effects` + `class` (View↔read/none; Process↔simulate|verify/ephemeral_internal; Insert/Update/Delete↔commit/external_commit) | `shipstation:VoidLabel` → Delete-scope ↔ commit / external_commit |
| **required GrantLevel** (Database / Table / Row / Column) | `MeshSkill.spec.coordinates`: `tenant_scope` (Database), `topology_scope` (Table), `data_sensitivity` + `trust_class` (Row/Column sensitivity), `frontier_hops` (blast bound) | `stripe:*` bound to `tenant_scope: <merchant>`, `data_sensitivity: regulated` |

So a marketplace action row is fully specified as, e.g.:

```
executor:      stripe:CreatePaymentIntent
meshSkillClass: commit
ontologyType:  ModifyAction / Insert-scope
sideEffects:   external_commit
coordinates:   { env: prod, tenant_scope: <merchant>, trust_class: restricted,
                 data_sensitivity: regulated, frontier_hops: 0 }
evidence.require: [logs, policy_decision, cairn_before, cairn_after]
```

Because the executor is a bound MeshSkill, it is **not free-form**: the reasoning-chain scorer will only select a plan whose hops bind to declared executors (a hop with no binding surfaces as `DECLARED_UNRESOLVED` in `kindVocabulary.ts` — the "gap" is declared, never silently dropped), and the precision@1 gate (§E) guards the selection.

---

## D. Roles & agentic operations

### D.1 Roles and grants — the estate model

The estate already ships a role/grant model in the **Organization Control Plane** (`controlPlaneFixture.ts`):

- **`Seat`** — a human or agent principal with a `role`, a `dept`, and an **`autonomy` level** on the **L0–L5 ladder** (`AUTONOMY_LEVELS`): L0 Observe → L1 Suggest → L2 Draft → L3 Act·review → L4 Act·notify → L5 Autonomous.
- **`RolePolicy { role, autonomyCap, membrane[] }`** — per-role **autonomy cap** and **capability membrane** (the allow-list of surfaces the role may touch; `'marketplace'` is one such surface).
- **`AuditEntry` + `sealReceipt(...)`** — every governance decision (`admitted | rejected | held-for-review | executed`) is content-sealed into a deterministic receipt.

The Control Plane is the **operator console** view of grants. The **authorization decision** itself is contracted out to an external **Agent Registry + Policy Fabric** (referenced by `contract-surfaces/registry.ts` as `admissionRequirementRefs: ['Agent Registry ref', 'grant refs', 'session ref', 'Policy Fabric decision refs']` and `capabilityProfileRef: 'agent-registry grants required for non-human participants'`). A marketplace offering's `admissionRequirementRefs` / `capabilityProfileRef` (§B) therefore point at **that** registry — the estate does not re-implement grant issuance here. This is the estate's realization of the reference **Policy → GrantLevel/GrantType** layer:

| Reference concept | Estate carrier |
|---|---|
| **Agent** (human/agent) | `event.actor.kind ∈ {human, agent, service, scheduler}` (contract #2); `Seat` |
| **Policy** | `RolePolicy` + `policies/skills/default-policy-pack.rego` |
| **GrantType: Permission** | policy pack `allow` (no `deny`) + `RolePolicy.membrane` includes the surface |
| **GrantType: Prohibit** | policy pack `deny[msg]` rule / `MeshSkill.spec.policy.deny` token (e.g. `live_prod_write`, `pii_export`) |
| **GrantType: Conditional** | `require_human_approval_for` + `allow_autoapprove_below_risk`; the L2/L3 "human approves each" rungs |
| **GrantLevel** (Database/Table/Row/Column) | `MeshSkill.spec.coordinates` (see §C.2) |
| **AccessAlignmentState: Aligned** | admission emits `skill.admitted`; ledger `decision.verdict = allow` |
| **AccessAlignmentState: Violated** | admission emits `policy.denied`; ledger `decision.verdict = block | require_approval` |
| **`executedBy` / `representsAction`** | `ExecutionRow.agent` + `ExecutionRow.decision` + `receiptHash` |

### D.2 How an agent assumes a role & what handoffs are permitted

An agent invoking a marketplace offering acts under a **seat** with an **autonomy band** (`ExecutionRow.decision.authorityBand` — the *ScopedCapability ladder*, distinct from the `epistemicLevel` proof axis). Permission to reach a marketplace executor requires **all** of:

1. the executor is bound by a declared **MeshSkill** in the offering's `capabilities.meshSkills`;
2. the offering's `policy.membraneSurface` (e.g. `marketplace`) is in the seat's **role membrane**;
3. the MeshSkill `class` is within the seat's **autonomy cap** — a `commit`-class marketplace action requires L3+ *and* satisfies the policy pack's "human approval required for commit class" / "non-read production execution requires human approval" rules;
4. requested `coordinates` do **not** exceed the MeshSkill's declared bounds (the resolver denies otherwise — `frontier_hops`, `tenant_scope`, `data_sensitivity`).

**Handoffs** between agents (PM → frontend → {backend, tester}) are first-class: the Executions Ledger reconstructs a **`RunTree`** from `ExecutionRow.run { runId, step, handoffFrom }`, where `handoffFrom` is the parent's `executionReceiptId` (mirroring `skill-execution-events` `refs.parent_run_id`). Each hop in a multi-agent marketplace operation is its own receipted `ExecutionRow`; the run's verdict is a worst-case roll-up (`denied ≻ pending ≻ verified`). A handoff that would cross into a `commit`-class marketplace executor beyond the child agent's authority band is denied at that hop, not at the root.

### D.3 Receipting — no fabricated provenance

Every marketplace action execution is receipted through the **lifecycle event set** (contract #2) and surfaces as an **`ExecutionRow`** (contract #7) carrying `receiptHash` (`^sha256:`), `capabilitiesHeld` vs `capabilitiesUsed` (least-privilege / Access-Advisor pruning), `proofReplayable`, and cairn refs (`cairn_before` / `cairn_after`).

The **honesty rule** from `keAuthorship.ts` and AGENTS.md carries over verbatim: when a marketplace offering is onboarded or an authorship/registration event is emitted, the receipt is **honestly unsigned** (`"unsigned — pending KE workbench seal"`) until a real signer/promotion gate seals it. A marketplace entry **must not** claim a `merkle_root` signature, a credential, or a provenance class it cannot substantiate — `provenanceClass: published` requires a real `signer` + `credential` in the Entity Fabric; otherwise it stays `learned`/`human_authored` and unsigned. Integrations that don't exist are not asserted.

---

## E. Integration path — onboarding a new offering

A new marketplace offering is onboarded through five governed stages. This is deliberately the **same pipeline** a MeshSkill and a reasoning-chain plan already travel, so marketplace actions are governed, not bolted on.

1. **Declare the module contract.** Choose/declare the `module.*` or `infra.*` contract (§A) and the MeshSkill *classes* it must support. State `side_effects` and required `evidence` obligations up front. — *binds MeshSkill spec §5, §9.*
2. **Register capabilities (the action surface).** Author one **MeshSkill descriptor per operation**, each with `class`, `coordinates`, `actions`/`plan`, `inputs`, `outputs`, `evidence`. Assign the provider **executor namespace** (`stripe:`, `posthog:`…). — *binds `schemas/control-plane/mesh-skill.schema.json`.*
3. **Bind action executors into the governed vocabulary + scorer.** Add each `namespace:Operation(args)` executor to the reasoning-chain executor vocabulary so the planner can bind concepts to it. Concept→executor bindings must be **learned/declared, not match-dictionary'd** (`kindVocabulary.ts`, `keAuthorship.ts`). Provide a **`canonicalExecutor`** default per concept and a **`declaredCanonicalPath`** so the governed scorer (`scoreVariants.ts`) can collapse plan-equivalent variants and resolve ties by the declared path — never by scorer float noise. Then **seed the precision@1 corpus** (`examples.ts` `LOGGED_QUESTIONS`) with gold-key fixtures for the new executors. The `precisionAt1()` counter-test gate must clear `MIN_N ≥ 30` (`meetsMinN`) before a governed-selection claim is publishable (GKN#9 Goodhart guard). Onboarding a provider therefore *adds fixtures*, not just executors. — *binds contract #6.*
4. **Policy / scope authorization.** Point the offering at a policy pack (`policies/skills/default-policy-pack.rego` or an overlay) and set its `membraneSurface`. Verify the Rego evaluates the offering's MeshSkills: `commit`-class denied without human approval; `frontier_hops`/`data_sensitivity`/`env=prod` bounds enforced; `deny` tokens (`live_prod_write`, `pii_export`) honored. Map the offering into `RolePolicy.membrane` for the roles allowed to use it and set autonomy caps. — *binds contracts #3, #8.*
5. **Federate into the mesh.** Field the provider as an **agentplane bundle** (`bundle.schema.v0.1.json`): executor ref (bundle-pinned → fleet default → host fallback), VM backend, secret **refs** (never inline), egress allowlist, policy-pack pointer + hash. Register the vendor row in `registry/agentos-tool-registry.yaml` (adapter, license, risk). Executions then flow through the lifecycle (contract #2) and surface as receipted `ExecutionRow`s in the Executions Ledger. — *binds contracts #4, #5, #7.*

**Why this keeps marketplace actions governed, not free-form:** step 3 forces every marketplace operation to become a **bound executor** the scorer recognizes; an operation with no binding renders as `DECLARED_UNRESOLVED` (a declared gap) and cannot be silently planned. Step 4 forces every operation through the **admission** policy. Step 5 forces every execution to be **receipted and replayable**. A marketplace action that skips any stage is, by construction, unadmittable.

---

## F. Worked examples

Three offerings — one **vendor/service (commerce)**, one **federation provider (infrastructure)**, one **app/agent-service** — carried through B–E. Executors below are illustrative bindings in the governed `namespace:Operation(args)` form; where a real estate object exists it is cited, and where a field is proposed it is marked.

### F.1 Stripe — vendor/service, `module.payment` (commerce)

**B · Registry entry (PROPOSED envelope):**
```yaml
metadata: { id: sp.market.vendor_service.stripe@v1, merkle_root: sha256:…, signer: platform-registry }
spec:
  offeringType: vendor_service
  displayName: Stripe
  provider: { registryRef: registry/agentos-tool-registry.yaml#stripe, adapter: PaymentService, license_spdx: proprietary, risk: yellow }
  moduleContract: { module: module.payment, contractVersion: v1, substitutable: true }   # odoo:*, adyen:* can also fulfil
  capabilities: { executorNamespace: stripe, meshSkills: [ …see C… ] }
  trust: { rightsProfileRef: entity-fabric#rights_profile/stripe, provenanceClass: published }
  pricing: { model: usage }
  federation: { bundleRef: agentplane/bundles/stripe/bundle.json, egressAllowlist: [dns, https] }
  policy: { policyPackRef: policies/skills/default-policy-pack.rego, membraneSurface: marketplace }
```

**C · Actions typed against the ontology:**

| Executor | User/Agentic | MeshSkill class | Ontology type / scope | side_effects | Key coordinates |
|---|---|---|---|---|---|
| `stripe:GetBalance` | both | `read` | ReadAction / View | none | tenant_scope: merchant |
| `stripe:CreatePaymentIntent` | both | `commit` | ModifyAction / Insert | external_commit | env: prod, data_sensitivity: regulated, frontier_hops: 0 |
| `stripe:RefundCharge` | both | `commit` | ModifyAction / Update | external_commit | env: prod, data_sensitivity: regulated |

**D · Roles:** `stripe:GetBalance` admitted at L0+ within the `marketplace` membrane. `stripe:CreatePaymentIntent`/`RefundCharge` are `commit`-class → require **L3+ and human approval** (policy pack: "human approval required for commit class"; "non-read production execution requires human approval"). An agent handoff that reaches a refund executor beyond its authority band is denied at that hop; the attempt is still receipted (failure is evidence).

**E · Integration:** authored as `commit`-class MeshSkills with `evidence.require: [logs, policy_decision, cairn_before, cairn_after]`; `stripe:` executors added to the reasoning-chain vocabulary with a `canonicalExecutor` mapping (`:CreatePayment → stripe:CreatePaymentIntent`) and ≥ enough precision@1 fixtures to keep `meetsMinN`; fielded via a Stripe agentplane bundle with `egressAllowlist: [dns, https]` and a `STRIPE_KEY_FILE` secret **ref**.

### F.2 PostHog — federation provider, `infra.analytics` (infrastructure)

**B · Registry entry (PROPOSED):** `offeringType: federation_provider`, `moduleContract: { module: infra.analytics, substitutable: true }` (interchangeable with `amplitude:*`, `mixpanel:*`); `provider.adapter: AnalyticsService`; `federation.executorRef: agentplane/fleet/inventory.json#lima-nixbuilder`.

**C · Actions:**

| Executor | MeshSkill class | Ontology type / scope | side_effects |
|---|---|---|---|
| `posthog:QueryEvents` | `read` | ReadAction / View | none |
| `posthog:GetFunnel` | `read` | ReadAction / Process | none |
| `posthog:CaptureEvent` | `commit` | ModifyAction / Insert | external_commit (ephemeral if buffered) |

**D · Roles:** analytics reads are the low-risk floor — admitted at L1+ within the membrane, autoapprovable below the risk threshold (`allow_autoapprove_below_risk`, policy pack `risk_threshold := 30`). `posthog:CaptureEvent` is `commit` but low-sensitivity; still receipted.

**E · Integration:** as an **infrastructure module**, PostHog slots behind the stable `infra.analytics` contract and is selected by executor precedence (`agentplane/docs/executors.md`). Swapping to `amplitude:` changes only the executor namespace and the bundle; the `infra.analytics` MeshSkill contract, the scorer bindings' *concept* targets, and the policy stay put — the canonical illustration of "stable module contract + interchangeable federated provider."

### F.3 A campaign-analyst App — app / agent-service

**B · Registry entry (PROPOSED):** `offeringType: app`; `moduleContract` consumes `module.campaign` (the `engage:*` domain already in `examples.ts`) + `infra.analytics`; **provides** a MeshSkill `plan` (`plan.ref: cairn://plans/campaign-analyst/v1`, `deterministic: false` → policy-admitted). Fielded as an agentplane bundle with `humanGateRequired` set per its `commit` reach.

**C · Actions (composed):** its plan orchestrates existing governed executors —
`engage:GetMailingsByDates(rollup:descendants)` (read), `engage:RankByMetric(openRate)` (read/verify), `posthog:GetFunnel` (read), and, if it acts, `engage:ScheduleMailing` (commit). Because these are the **same bound executors** the reasoning-chain scorer already governs (examples B and C in `examples.ts`), the App inherits their ontology typing and the precision@1 gate for free — it adds *plan-level* fixtures, not new executor bindings.

**D · Roles & handoff:** as an agent-service, the App runs under a seat with an authority band. A read-only briefing runs at L1–L2 (autoapprovable). If it proposes a schedule/commit, that hop pauses for approval (`approval.requested`) and the whole operation surfaces as a **`RunTree`** in the Executions Ledger: planner → `engage:` reads → `posthog:` read → `engage:ScheduleMailing` (held). Each node is a receipted `ExecutionRow` linked by `run.handoffFrom`; verdict rolls up worst-case.

**E · Integration:** the App onboards purely at the **plan + policy** layers — no new vendor backend, no new executor namespace — demonstrating that Apps compose §E rather than re-declaring it. Its `side_effects` and required approvals are the roll-up of the executors its plan reaches.

---

## G. What is bound vs proposed

**Bound to existing estate contracts (no new model):**
- Capability/action object → **MeshSkill** (`schemas/control-plane/mesh-skill.schema.json`, `specs/control-plane/mesh-skills-v0.1.md`).
- Execution/receipt/run-tree → **Skill Execution Lifecycle + events** (`specs/control-plane/skill-execution-lifecycle-v0.1.md`, `schemas/events/skill-execution-events.schema.json`) and **Executions Ledger** (`.../executions-ledger/types.ts`).
- Authorization → **policy pack** (`policies/skills/default-policy-pack.rego`) + **GRL+ domain×action matrix** (`standards/grlplus/domain_action_policy_matrix.json`) + **Control Plane** roles/grants (`.../controlPlane/governance.ts`, `.../data/controlPlaneFixture.ts`), with grant issuance delegated to the external **Agent Registry / Policy Fabric** referenced by `contract-surfaces/registry.ts`.
- Authority band + per-action affordances → **Contract-Surfaces** (`.../contract-surfaces/{types.ts,registry.ts}`).
- Vendor catalog → **AgentOS tool registry** (`registry/agentos-tool-registry.yaml`); capability catalog → **Feature Library** (`.../competitive-intelligence/featureLibrary.ts`).
- Federation/deployment → **agentplane bundle + fleet** (`agentplane/schemas/bundle.schema.v0.1.json`, `agentplane/fleet/inventory.json`).
- Governed executors, scorer, precision@1 gate, authorship receipts → **reasoning-chain** feature (`.../reasoning-chain/*`).
- Provider trust → **HolographMe reputation** (`.../reputation/reputation.ts`) + netting-market **`TruthClass`/`Admissibility`** lattices (`.../data/marketplaceFixture.ts`); identity/rights → **Entity Fabric** (`entity-fabric/contracts/OVERVIEW.md`).

**Proposed as new (labelled throughout, follow-up owed):**
- The **`MarketplaceOffering`** envelope (§B) — a thin, ref-only composition object; `apiVersion: marketplace.socioprophet.org/v0.1alpha`. It introduces **no** new capability/policy/receipt semantics.
- The **`module.*` / `infra.*` module-contract naming** (§A) — the only genuinely new vocabulary; should be reconciled with any canonical module taxonomy the control-plane owners prefer.
- The **ontology→contract mapping tables** (§C.2, §D.1) — a documentation artifact, not a schema; if the estate wants the reference Action ontology (ReadAction/ModifyAction/GrantLevel/…) as *first-class* classes, that is a separate schema decision.

---

## H. Open questions for @mdheller

1. **Naming + canonical home.** The term `/marketplace` is **already taken** by the triparty netting/clearing market (`marketplaceFixture.ts`). Should the offering registry be named separately (this doc proposes **Offering Registry** / surface `marketplace.offerings`), and should its schema live under `schemas/control-plane/offering.schema.json` (next to `mesh-skill.schema.json`) or a new `schemas/marketplace/`? This doc lives under `socioprophet-web/client-vue/docs/` per the task; the schema itself likely belongs at repo-root `schemas/`.
2. **External Agent Registry / Policy Fabric.** `contract-surfaces/registry.ts` references an external **Agent Registry + Policy Fabric + AgentTerm** as the grant/admission authority, but those contracts are not in this worktree. Onboarding step E.4 and §D.1 point offerings' `admissionRequirementRefs` / `capabilityProfileRef` at them — confirm that is the intended authorization source of truth (vs. the in-repo Rego pack) and where those schemas live.
3. **Module taxonomy authority.** Is there an existing/preferred enumeration of `module.*` / `infra.*` contracts (the Medusa-style Commerce/Infrastructure split)? I proposed a minimal set; it should not fork whatever the mesh already names — reconcile with `agenticOsFixture.ts` `SharedLibrary` names (e.g. `identity-plane`).
4. **Executor-namespace governance.** Who owns the provider **executor namespace** allocation (`stripe:`, `posthog:`…) and its registration into the reasoning-chain vocabulary? Onboarding step E.3 assumes a governed place to add executors + `canonicalExecutor` defaults + precision@1 fixtures — is that the KE workbench, and is a real (non-curated) logged-question source planned so marketplace fixtures aren't authored-only?
5. **`execution-receipt.schema.json`.** `executions-ledger/types.ts` cites `prophet-core-contracts/schemas/execution-receipt.schema.json` as the governed envelope it mirrors, but that file is **not present in this worktree**. Is it in a sibling repo? The marketplace receipt binding (§D.3) should target that schema directly once located.
6. **Trust signals depth.** What is the required floor: a HolographMe `Tier`, an Entity-Fabric `credential`, a `TruthClass`, or some combination — before a `commit`-class commerce provider may declare `provenanceClass: published`? §D.3 proposes a credential + signer; confirm the bar and which of the three trust systems (reputation / entity-fabric / truth-lattice) is authoritative when they disagree.
7. **Membrane surface granularity.** The Control Plane lists `marketplace` as a seat capability surface — is that the intended membrane key for offering authorization, or should offerings map to finer-grained surfaces per `moduleContract` (e.g. `module.payment`)?

---

*Sources are cited inline with repo-relative paths. Where this spec proposes new structure it is labelled PROPOSED; no integrations, signatures, or provenance are claimed that the estate does not already provide.*

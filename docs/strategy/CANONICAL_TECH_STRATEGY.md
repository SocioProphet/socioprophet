# SocioProphet Canonical Technology Strategy v2

Status: review-v0.2  
Scope: public repo + public docs + live open PR sample reviewed on 2026-04-11  
Audience: platform leadership, repo stewards, product stewards, governance stewards, institutional packaging

---

## 1. Executive update

The prior seven-plane model was directionally right, but it was too abstract.

The updated public sample now forces a sharper conclusion:

> **SocioProphet is not only a governed operational intelligence platform. It is already forming a governed control fabric whose concrete anchors include policy control, cloud-edge execution, memory runtime, ontology governance, and active digital-trust surfaces.**

That means the strategy should not be rebuilt from scratch. It should be **re-anchored** around the concrete repositories and live product-surface source that the public sample now exposes.

---

## 2. What changed from v1

Five concrete corrections materially changed the model:

1. **Policy Fabric is now a first-class governance/control anchor.** It is not a side repo. It is a policy control repository with contracts, examples, governance under `.policy-fabric/`, AgentPlane scaffolding under `.agentplane/`, and release/validation/replay artifacts.
2. **Cloud Suite is no longer just a placeholder category.** `cloudshell-fog` is already a real fog-optimised cloud shell gateway with OIDC auth, placement, policy, audit, OpenTelemetry, and GitOps deployment.
3. **The semantic stack includes a real memory runtime.** `memory-mesh` is a canonical upstream baseline for memory runtime and deployment, including `memoryd`, Qdrant retrieval, LiteLLM callback integration, and an OpenClaw plugin.
4. **Ontology governance is already concrete.** `ontogenesis` is an auditable, policy-gated, supply-chain-traceable repository for RDF/OWL/JSON-LD assets with SHACL promotion gates and a machine-readable catalog.
5. **Digital Trust is an active surface, not just deferred branding.** The live docs define it as trusted digital presence tied to identity, capability, and recovery, and the surface inventory still treats it as a named surface whose next action is packaging, not invention.

Those corrections do not break the plane model. They make it less generic and more faithful.

---

## 3. The source-of-truth correction we missed

The product-surface inventory is generated from `config/surfaces.json`, and the build script explicitly reads that file and regenerates the rendered docs page plus graph assets.

That means the current governance pack should **not** treat the rendered Surface Inventory page as the only product-surface reference. It should treat:

- `SocioProphet/socioprophet:config/surfaces.json` as the source file for surface state,
- `scripts/build_surface_inventory.py` as the generation logic,
- `docs/guide/surface-inventory.md` as the rendered output.

This matters because Digital / Trust, Investor, Entity Analytics, and the status of AI, Developer, Cloud, Live, Medical, Law, Wiki, and Blog are encoded in that JSON source, not only in prose.

---

## 4. Revised Strategic Decision Planes

The seven planes remain useful, but several anchors change.

### SDP-1 — Governance and Human Safeguards

Keep the plane name. Change the operational center of gravity.

This plane should now be anchored primarily in `policy-fabric`, with `socioprophet` as the public narrative layer and HDT plus governance docs as the trust-and-human layer.

What this plane now explicitly includes:
- policy bundles
- authored policy contracts
- compiled execution plans
- validation, replay, and release-pack artifacts
- approval logic
- human safeguards
- public-safe governance packaging

**Correction:** governance is no longer just “docs plus principles.” It has an operational control repository.

### SDP-2 — Deterministic Transport and Evidence

No structural change. `TriTRPC` remains the normative transport spine.

The correction is narrower: we should keep transport focused on transport and evidence, not let it absorb policy or execution concerns just because those repos also emit artifacts.

### SDP-3 — Governed Execution and Capability Routing

This plane remains anchored in `agentplane`, but it now needs a concrete cloud-edge execution lane through `cloudshell-fog`.

That means the execution story is not only:
- bundle
- validate
- place
- run
- evidence
- replay

It is also:
- auth
- placement
- policy
- session lifecycle
- runtime connector
- audit and telemetry
- GitOps deployment

**Correction:** Cloud/edge is no longer a future packaging layer only. It already has a runtime seed that belongs in the execution plane.

### SDP-4 — Knowledge, Context, and Semantic Systems

This plane needs the largest correction.

The updated authority chain is now closer to:

- `socioprophet-standards-storage` for benchmark and storage authority
- `socioprophet-standards-knowledge` for executable knowledge artifacts
- `ontogenesis` for ontology governance and SHACL gates
- `memory-mesh` for memory runtime and adapter baseline
- `semantic-serdes` for event/context/surface contract seams
- `slash-topics` for governed scope membranes

**Correction:** the semantic stack is no longer just standards + eval + topic scoping. It also includes ontology governance and a runtime memory system.

### SDP-5 — Identity, Entity, and Human API Surfaces

The major correction here is **Digital Trust**.

`human-digital-twin` still provides the strongest protocol-like anchor. Entity Analytics still provides the public identity/entity packaging. But Digital Trust is now clearly an active surface boundary because the docs define it as identity + capability + recovery routing, and `config/surfaces.json` still marks it as a named trust surface.

**Correction:** Digital Trust should no longer be modeled as a future packaging target. It is an active surface with incomplete packaging.

### SDP-6 — Authorized Defensive Operations

This plane stays where it is, but now needs stronger linkage to Policy Fabric so that authorization and evidence rules are not described only as doctrine but also expressed as policy-control artifacts.

**Correction:** the defense plane has a public boundary and a runtime/evidence path, but it still needs stronger policy-control binding.

### SDP-7 — Learning and Institutional Delivery

No structural correction. The important change is sequencing discipline. Academy remains the flagship Commons surface, Organizations remains the institutional entry, and the surface-source JSON plus public docs still say Organizations needs to be raised to Academy-level first-class quality.

**Correction:** delivery remains central, but its packaging and surface sequencing need to stay explicit.

---

## 5. Revised anchor map

The revised concrete anchor map is:

- **Policy/control fabric:** `policy-fabric`
- **Deterministic transport:** `TriTRPC`
- **Execution/control plane:** `agentplane`
- **Cross-repo release and topology:** `sociosphere`
- **Runtime/deployment reference:** `prophet-platform`
- **Cloud-edge gateway:** `cloudshell-fog`
- **Standards and benchmark authority:** `socioprophet-standards-storage`
- **Executable knowledge contracts:** `socioprophet-standards-knowledge`
- **Ontology governance:** `ontogenesis`
- **Memory runtime:** `memory-mesh`
- **Trust protocol and human API:** `human-digital-twin`
- **Learning and institutional delivery:** `alexandrian-academy` + DelEx
- **Public packaging / surface source:** `socioprophet` + `config/surfaces.json`

This is materially better than the earlier “clean” map because it reflects actual repo reality.

---

## 6. Integration-aware merge review

The central question was whether the revised pack collides with current live PR motion.

### `SocioProphet/sociosphere`

Current open PRs sampled:
- PR #70 only stages a note file (`patches/workspace-manifest-cleanup-2026-04-09.md`)
- PR #71 changes `manifest/workspace.toml`

That means the revised decision-plane registry pack still has **low direct path collision risk** if it lands under:
- `registry/decision-planes.yaml`
- `schema/decision-planes.schema.json`
- `scripts/validate_decision_planes.py`
- `governance/adr/`
- `.github/workflows/`

But it has **medium semantic coupling risk** to manifest and workspace naming decisions, because SDP-3 and release-source assumptions still depend on canonical workspace naming.

### `SocioProphet/socioprophet`

Current open PRs sampled:
- PR #259 adds trust-center style docs pages under `docs/guide/`
- PR #261 adds governance and visual-review workflows under `.github/` and `scripts/`
- PR #272 hardens the embedded `agentplane/` control-plane subtree
- PR #275 adds `semantic/repo.jsonld`

This means a strategy PR under `docs/strategy/` still has **low direct file-path collision risk**, but **moderate semantic overlap** with:
- public trust packaging,
- governance/release controls,
- embedded agentplane positioning,
- repo identity descriptors.

So the strategy PR should be framed as a **portfolio authority clarification** PR, not as the owner of implementation details already in those lanes.

---

## 7. What the revised strategy should now do

The next version of the governance pack should do four things explicitly:

1. keep the seven planes, but bind each to the corrected concrete anchors;
2. treat `config/surfaces.json` as the product-surface source input that future registry checks must reconcile against;
3. treat Policy Fabric, Memory Mesh, Ontogenesis, and cloudshell-fog as portfolio-significant anchors rather than side references;
4. treat Digital Trust as an active surface needing packaging, not as a hypothetical future surface.

---

## 8. Revised merge posture

The earlier pack should now be considered **v0.1 staging**.

The revised pack produced in this pass is **v0.2 review-ready**.

That is better because:
- it uses the live surface source file,
- it verifies the omitted repos directly,
- it samples the active PR queue for path-collision and semantic-overlap risk,
- and it recuts the anchor model instead of only criticizing it.

It is still not the final authority layer for every internal branch or every private repo, but it is now honest about that limit.

---

## 9. Immediate portfolio decisions

The most important decisions now are:

1. **Policy Fabric must be named in the canonical portfolio story.**
2. **Cloud Suite should be anchored to cloudshell-fog in the near-term product narrative.**
3. **SDP-4 must explicitly include ontology governance and memory runtime.**
4. **Digital Trust must be treated as active surface packaging work.**
5. **Future registry automation should reconcile against `config/surfaces.json`, not only hand-maintained YAML and CSV.**

---

## 10. Recommended next action after this revision

Do not merge the old repo-drop pack unchanged.

Instead:
- update the registry and ownership matrix first,
- add the integration review note,
- then regenerate the repo-drop pack from the corrected v0.2 artifacts.

That is the cleanest way to avoid baking the earlier omissions into the PR layer.

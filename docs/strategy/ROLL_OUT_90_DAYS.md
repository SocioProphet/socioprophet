# SocioProphet Strategic Decision Planes — 90-Day Rollout Plan v0.2

Status: draft-v0.2.0  
Date: 2026-04-11  
Scope: corrected rollout plan using the current public repo sample and `config/surfaces.json`

## 1. Why this revision exists

The prior rollout plan was directionally right but under-modeled four concrete anchors:
- `policy-fabric`
- `cloudshell-fog`
- `memory-mesh`
- `ontogenesis`

It also reasoned from the rendered Surface Inventory rather than the underlying product-surface source file.

This revision keeps the seven-plane model but updates the concrete adoption work.

## 2. Canonical placement

### Umbrella narrative
Repo: `SocioProphet/socioprophet`  
Path: `docs/strategy/CANONICAL_TECH_STRATEGY.md`

### Machine-readable governance registry
Repo: `SocioProphet/sociosphere`  
Paths:
- `registry/decision-planes.yaml`
- `registry/decision-plane-ownership-matrix.csv`
- `schema/decision-planes.schema.json`
- `scripts/validate_decision_planes.py`
- `.github/workflows/decision-planes.yml`

### Product-surface reconciliation input
Repo: `SocioProphet/socioprophet`  
Path: `config/surfaces.json`

## 3. 0–30 days

Goals:
- lock the v0.2 plane wording
- publish the revised strategy and ADRs
- place the revised registry/matrix/dashboard in `sociosphere`
- preserve the source-of-truth split
- record the product-surface reconciliation rule

Exit criteria:
- v0.2 narrative and registry are both merged
- validator is green on the corrected registry/matrix
- at least one governance note explicitly names `config/surfaces.json` as the surface reconciliation input

## 4. 31–60 days

Priority implementation work:
- **SDP-1:** make `policy-fabric` visibly canonical in the governance story
- **SDP-3:** bind `cloudshell-fog` into Cloud Suite and execution-plane packaging
- **SDP-4:** unify standards, ontology, and memory runtime authority
- **SDP-5:** make Digital Trust packaging coherent with HDT and Entity Analytics

Exit criteria:
- `policy-fabric`, `cloudshell-fog`, `memory-mesh`, and `ontogenesis` are all explicitly represented in central docs and registry-linked planning
- semantic evaluation and memory-runtime validation both have CI-facing paths

## 5. 61–90 days

Required decisions:
1. Is `policy-fabric` permanently cross-plane or a later named control-fabric layer?
2. How should Cloud Suite describe `cloudshell-fog` relative to broader managed or hosted scope?
3. Does `semantic-serdes` stay as a peer authority or narrow into event/context surface contracts?
4. What is the exact packaging boundary between Digital Trust, HDT, and Entity Analytics?

Exit criteria:
- one explicit decision recorded for each of the four questions above
- surface-to-plane reconciliation is documented as an operating rule
- the repo-drop pack is regenerated from the corrected v0.2 inputs and no longer trails the registry

## 6. Immediate next steps

1. Regenerate the repo-drop pack, commit sequence, installer, and PR bodies from the v0.2 artifacts.
2. Do one final exact-path integration review against live target repos before upstream merge.

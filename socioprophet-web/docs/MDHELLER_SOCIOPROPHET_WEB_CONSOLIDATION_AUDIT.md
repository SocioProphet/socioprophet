# mdheller/socioprophet-web Consolidation Audit

Status: Tranche 0 transfer ledger  
Date: 2026-05-29  
Canonical target: `SocioProphet/socioprophet/socioprophet-web/client-vue`  
Source staging repository: `mdheller/socioprophet-web`  
Org baseline inspected: `SocioProphet/socioprophet@b31f1c2db16b505466bc169635cc2b15bdfe5ea9`  
Source baseline inspected: `mdheller/socioprophet-web@67cff37b3da44395757c9095e1cbc081ca73333b`

## Purpose

This audit prevents loss, duplication, or destructive overwrite while retiring `mdheller/socioprophet-web` as an active staging repository.

The migration direction is React to Vue. The Vue app shell in the org repository is the canonical product-shell target. The personal repository is now treated as staging/source material to be replayed selectively into the canonical org repo, not as a repository to merge wholesale.

## Retirement definition

`mdheller/socioprophet-web` can be retired only when all useful work is either:

1. already promoted into `SocioProphet/socioprophet`;
2. replayed into `socioprophet-web/client-vue`;
3. explicitly marked reference-only;
4. explicitly marked superseded by newer org work; or
5. explicitly marked do-not-transfer with rationale.

Retirement does not mean deleting historical work. Retirement means no new product-shell work should originate in the personal repo, and the repo should point operators to the canonical org surface.

## Canonical placement rule

Use this placement rule until superseded by a later decision record:

| Work type | Placement |
| --- | --- |
| Vue product shell routes and app/workbench UI | `socioprophet-web/client-vue` |
| Marketing/docs/static public surface | existing marketing/docs surfaces, not `client-vue` |
| Old React implementation | legacy/reference only until removed or relocated |
| Backend/runtime contracts | owning subsystem repo unless this repo is only rendering evidence/state |
| UI design inventory and migration rationale | `socioprophet-web/docs/` or `socioprophet-web/client-vue/docs/` |
| Mock fixtures for UI-only dashboard slices | colocated under `client-vue` feature/page structure when tests need them |

## Current org state

The org repo already contains a promoted Vue product shell under:

```text
socioprophet-web/client-vue
```

The existing React client remains under:

```text
socioprophet-web/client
```

Do not overwrite `client-vue` from the personal repo. The org copy is already newer in several areas, especially the GAIA map runtime-adapter and layer-catalog posture.

## Transfer ledger

### Already promoted / preserve in org

| Source item | Current org target | Status | Action |
| --- | --- | --- | --- |
| Vite/Vue shell foundation | `socioprophet-web/client-vue` | already promoted | preserve |
| `/map` GAIA/OpenStreetMap workbench | `socioprophet-web/client-vue/src/pages/MapPage.vue` | already promoted and further advanced in org | do not overwrite from source |
| GAIA OSM API client/types | `socioprophet-web/client-vue/src/api/gaiaMap.ts`, `src/types/gaiaMap.ts` | already promoted | reconcile only if source has unique later material |
| Domain route taxonomy for app/workbench routes | `socioprophet-web/client-vue/src/config/domainRoutes.ts` | already promoted | extend carefully, do not replace blindly |
| Product-build workflow | `.github/workflows/client-vue-product-build.yml` | already promoted and includes tests | preserve scoped workflow |
| Client Vue deployment split decision | `socioprophet-web/docs/CLIENT_VUE_DEPLOYMENT_SPLIT.md` | already promoted | preserve as deployment boundary |
| GAIA map promotion plan | `socioprophet-web/docs/GAIA_MAP_VUE_SHELL_PROMOTION_PLAN.md` | already promoted | supersede with this audit only where broader retirement is concerned |

### Replay needed into org

| Source item | Source path / source signal | Target placement | Priority | Notes |
| --- | --- | --- | --- | --- |
| Professional Intelligence dashboard | `src/pages/ProfessionalIntelligence.vue` | `socioprophet-web/client-vue/src/pages/ProfessionalIntelligence.vue` | P1 | Replay as read-only/product-control dashboard. Do not claim live state unless fixture/generated. |
| Professional Intelligence state module | `src/data/professionalIntelligenceControlState.ts` | `client-vue/src/data/` or feature-local state | P1 | Hard-coded timestamp and PR status should be treated as fixture state. Prefer generated fixture seam. |
| Professional Intelligence state generator | `scripts/generate-pi-dashboard-state.mjs` | `client-vue/scripts/` or `socioprophet-web/scripts/` with README | P1 | Keep as fixture-generation bridge from Prophet Platform dashboard-control JSON. |
| SourceOS lifecycle control-plane page | `src/pages/ControlPlaneLifecycle.vue` and issue #19 | `client-vue/src/pages/ControlPlaneLifecycle.vue` | P1 | Read-only view only. No enrollment-token issuance, host mutation, boot action, or release-management authority. |
| NLBoot evidence dashboard | `src/pages/NLBootEvidence.vue` | `client-vue/src/pages/NLBootEvidence.vue` | P1 | Evidence display only. Must preserve explicit non-goals around boot/device actions. |
| Feed Intelligence reader shell | open PR #25 | `client-vue/src/features/feed-intelligence/*`, `client-vue/src/pages/Reader.vue` | P1/P2 | Replay into org instead of treating mdheller PR as final. Validate no live feed/memory/graph writeback claims. |
| TriRPC mock adapter seam | `src/services/triRpc.ts` | `client-vue/src/services/` or runtime-adapter bridge | P2 | Promote only as mock-boundary seam. Real TriRPC wiring remains follow-up. |
| Journal page | `src/pages/Journal.vue` | `client-vue/src/pages/Journal.vue` | P2 | Keep as stream/mock demo unless real runtime event source is explicitly wired later. |
| Code Search page | `src/pages/CodeSearch.vue` | `client-vue/src/pages/CodeSearch.vue` | P2 | Mock search seam only; no claim of live Sourcegraph/GitHub integration. |
| Portal screen map / annotated wireframes | `docs/wireframes/portal-screen-map-and-wireframes.md` | `socioprophet-web/docs/` or `client-vue/docs/` | P2 | Transfer as design/reference. Do not present wireframes as implemented surfaces. |
| Vue-shell agent operating instructions | `AGENTS.md`, `.github/copilot-instructions.md` | `socioprophet-web/client-vue/AGENTS.md` or scoped docs | P2 | Scope to app shell. Do not override broader org repo governance. |

### Superseded by org / do not copy over org version

| Source item | Reason | Action |
| --- | --- | --- |
| Source `MapPage.vue` | Org `client-vue` contains later runtime-adapter, layer-catalog, and tile-manifest controls. | Do not overwrite; inspect only for unique deltas. |
| Source root `package.json` | Org `client-vue/package.json` already includes tests and current product verification. | Do not replace org package. Add dependencies only if required by replayed code. |
| Source product-build assumptions without tests | Org workflow runs install, typecheck, tests, and build. | Preserve org CI posture. |
| Storybook wiring | Existing promotion decisions exclude Storybook from product build. | Reference-only unless a dedicated Storybook PR is opened later. |

### Reference-only / archive candidate

| Source item | Rationale | Action |
| --- | --- | --- |
| Historical Storybook config/work | Not part of current product build. | Keep as historical reference only. |
| Early workbench backlog scaffolding | Superseded by current migration audit and app-shell plan. | Reference only unless unique requirements are found. |
| Old issue/PR discussions after replay | Useful for provenance, not active execution. | Close with pointer after replay completion. |

### Do-not-transfer unless separately justified

| Source item | Rationale |
| --- | --- |
| Dependabot PR #11 in mdheller repo | Dependency movement should happen in org repo directly, not in retiring source repo. |
| Any node_modules, local env files, private config, tokens, generated local artifacts | Must not be transferred. |
| Any UI that implies real device control, production tile serving, live OSM ingestion, MemoryMesh writeback, MeshRush traversal, or backend authority without a real contract and owning repo integration | Violates current product-boundary discipline. |

## Open source-repo items to resolve before retirement

| Source item | Current status | Retirement action |
| --- | --- | --- |
| mdheller issue #13: UI inventory / migration plan | open | This audit partially supersedes it. Close only after org audit lands and any unique inventory file from the issue is captured or declared unnecessary. |
| mdheller issue #14: GAIA map usability controls | open | Likely superseded by org `client-vue` map advances; verify before closure. |
| mdheller issue #19: SourceOS/Prophet control-plane dashboard plan | open | Replay SourceOS control-plane dashboard into org or close with replacement org issue/PR. |
| mdheller PR #25: Feed Intelligence reader shell | open | Replay into org `client-vue`; then close source PR with canonical pointer. |
| mdheller PR #11: dependency bump | open | Do not merge in mdheller. Let org dependency management handle current app shell. |

## Proposed execution order after this audit

1. Update org `socioprophet-web` docs to declare `client-vue` as migration target and React as legacy/reference.
2. Replay Professional Intelligence dashboard and fixture/generator seam.
3. Replay SourceOS lifecycle and NLBoot evidence dashboards.
4. Replay Feed Intelligence reader shell from source PR #25.
5. Replay TriRPC/Journal/Code Search only as mock-boundary adapter surfaces.
6. Transfer portal wireframes and scoped app-shell agent instructions.
7. Retire React presentation in org: mark legacy, then move/delete only after parity review.
8. Retire mdheller repo: README pointer, close superseded issues/PRs, archive/read-only if desired.

## Acceptance criteria for mdheller retirement

The personal repo is eligible for retirement only when:

- org `client-vue` has all accepted product-shell surfaces replayed or explicitly declined;
- org docs identify `client-vue` as canonical app shell;
- React is not presented as the future app shell;
- source mdheller open issues/PRs are closed, transferred, or explicitly superseded;
- mdheller README points to `SocioProphet/socioprophet/socioprophet-web/client-vue`;
- no source-only artifact remains without a ledger status.

## Non-goals for this tranche

This tranche does not migrate source code. It does not retire React. It does not archive the personal repo. It creates the transfer ledger that controls those later changes.

# Feed Intelligence Reader

Status: fixture-backed UI, contract replay, and completed default-disabled resolver-gate sequence  
Source: `mdheller/socioprophet-web` PR #25  
Target: `socioprophet-web/client-vue`

## Purpose

This feature captures the first Feed Intelligence reader shell in the canonical Vue app shell.

It models the reader as a replayable knowledge refinery:

1. ticker proof of life;
2. feed/source subscription;
3. item normalization;
4. membrane evaluation;
5. scoped memory posture;
6. graph-view preparation;
7. derived publication views.

## Boundary

This feature is UI-first and contract-first.

It does not implement:

- live feed fetching;
- ActivityPub federation;
- MemoryMesh writeback;
- MeshRush traversal;
- BearBrowser native event bridging;
- public publication authority.

Those belong in follow-on PRs in their owning repositories after the product surface and contracts are accepted.

The owning repository contract index for this feature is `INTEGRATION_LEDGER.md`. Future live integration work must also satisfy `LIVE_ADAPTER_GATE.md` when adapters, authority boundaries, tests, or rollback behavior change.

## Files

| Path | Purpose |
| --- | --- |
| `types.ts` | Contract types for sources, items, events, integrations, storage posture, and membrane decisions. |
| `state.ts` | Fixture-backed state used by the current reader UI. |
| `adapters.ts` | Disabled live-adapter seams and forbidden side-effect declarations. |
| `bearbrowserHandoff.ts` | Local-only BearBrowser handoff fixture mapper plus default-disabled read-only local-event resolver status. |
| `slashTopicsScope.ts` | SlashTopics fixture scope resolver plus default-disabled read-only scope resolver status. |
| `newHopeMembrane.ts` | New Hope fixture membrane resolver plus default-disabled read-only membrane resolver status. |
| `memoryMeshPosture.ts` | MemoryMesh fixture posture resolver plus default-disabled read-only/display-only posture resolver status. |
| `meshRushGraphView.ts` | MeshRush fixture graph-view resolver plus default-disabled read-only/advisory-only graph-view resolver status. |
| `INTEGRATION_LEDGER.md` | Owning-repo contract ledger for BearBrowser, SlashTopics, New Hope, MemoryMesh, and MeshRush. |
| `LIVE_ADAPTER_GATE.md` | Promotion gate required before fixture or read-only resolver seams can become live behavior. |
| `../../__tests__/FeedIntelligenceFixtureChain.test.ts` | Aggregate fixture-chain coverage across scope, membrane, memory posture, and graph-view fixtures. |
| `../../pages/Reader.vue` | Product shell page rendering fixture state, adapter boundary, resolver status panels, and the selected-item fixture chain. |

## Completed resolver-gate sequence

The default-disabled resolver-gate sequence is complete for the five owning surfaces.

| Surface | Current status | Live behavior status |
| --- | --- | --- |
| BearBrowser | Local-event handoff resolver status is visible and disabled by default. | No native browser bridge, network fetch, or publication. |
| SlashTopics | Read-only scope resolver status is visible and disabled by default. | No scope mutation and no feed fetching. |
| New Hope | Read-only membrane resolver status is visible and disabled by default. | No live policy mutation and no promotion from guarded states. |
| MemoryMesh | Read-only/display-only posture resolver status is visible and disabled by default. | No live recall, durable writeback, raw payload storage, or memory promotion. |
| MeshRush | Read-only/advisory-only graph-view resolver status is visible and disabled by default. | No traversal, persistence, runtime execution, publication, or durable graph mutation. |

## Fixture adapter posture

The fixture adapter modules are local validation seams. They prove shape, coherence, and disabled-state behavior before live adapters exist. They must not perform live network calls, mutate scopes, make policy decisions, write durable memory, execute graph traversal, persist graph state, federate, or publish.

The read-only resolver status seams added after the fixture tranche are also non-live. They expose disabled/default resolver state and failure-safe resolver outcomes. They do not authorize any adapter side effect.

## Acceptance posture

The page is acceptable only while it visibly remains fixture-backed and avoids claiming live backend behavior. Any future live integration must pass `LIVE_ADAPTER_GATE.md`, add owning-repo contracts, tests, authority boundaries, disabled-state behavior, and rollback handling before enabling real fetch, memory, graph, browser, or publication actions.

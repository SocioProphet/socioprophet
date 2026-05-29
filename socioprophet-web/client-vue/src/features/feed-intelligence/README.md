# Feed Intelligence Reader

Status: fixture-backed UI and contract replay  
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

## Files

| Path | Purpose |
| --- | --- |
| `types.ts` | Contract types for sources, items, events, integrations, storage posture, and membrane decisions. |
| `state.ts` | Fixture-backed state used by the current reader UI. |
| `../../pages/Reader.vue` | Product shell page rendering the fixture state. |

## Acceptance posture

The page is acceptable only while it visibly remains fixture-backed and avoids claiming live backend behavior. Any future live integration must add owning-repo contracts, tests, and authority boundaries before enabling real fetch, memory, graph, or publication actions.

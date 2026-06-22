# Feed Intelligence live-adapter gate

Status: required promotion gate  
Scope: `socioprophet-web/client-vue/src/features/feed-intelligence`  
Current posture: fixture-backed reader with disabled live adapters and completed default-disabled resolver status sequence

## Purpose

This gate prevents fixture resolver modules and read-only resolver seams from being silently promoted into live behavior. The Feed Intelligence reader currently renders fixture-backed state, fixture-chain status, disabled adapter boundaries, and default-disabled resolver status for BearBrowser, SlashTopics, New Hope, MemoryMesh, and MeshRush. That is intentional. Live behavior must be introduced adapter by adapter and only after the owning boundary, authority model, tests, disabled state, and rollback path are present.

## Gate rule

No fixture adapter or read-only resolver seam may become live unless the PR satisfies all checks below.

## Required checks

| Check | Required evidence |
| --- | --- |
| Owning artifact | `INTEGRATION_LEDGER.md` points to the owning repo contract or adapter artifact. |
| Adapter boundary | A named adapter boundary exists in client-vue and can be disabled independently. |
| Authority boundary | The PR states who or what is allowed to invoke the adapter and under what policy. |
| Disabled state | UI and tests show a clear disabled, unavailable, or failed-safe state. |
| Validation | Unit, smoke, or fixture-chain tests cover normal, disabled, and failure cases. |
| Side-effect review | The PR states whether the adapter can fetch, mutate, publish, persist, federate, write memory, or execute graph traversal. |
| Rollback | The PR documents how to disable or revert the adapter without breaking the reader. |

## Completed default-disabled resolver status sequence

The resolver-gate sequence is complete as read-only/default-disabled UI and test coverage. This does not enable live adapter behavior.

| Surface | Completed status | Still impossible by default |
| --- | --- | --- |
| BearBrowser | Local-event handoff resolver status exists and is disabled by default. | Native bridge activation, network fetch, publication, federation, memory writeback, graph traversal, persistence. |
| SlashTopics | Read-only scope resolver status exists and is disabled by default. | Scope mutation, feed fetching, publication, federation, memory writeback, graph traversal, persistence. |
| New Hope | Read-only membrane resolver status exists and is disabled by default. | Live policy mutation, publication, federation, memory writeback, graph traversal, persistence, promotion from guarded states. |
| MemoryMesh | Read-only/display-only posture resolver status exists and is disabled by default. | Live recall, durable writeback, raw payload storage, memory promotion, graph traversal, persistence. |
| MeshRush | Read-only/advisory-only graph-view resolver status exists and is disabled by default. | Live traversal, graph persistence, runtime execution, publication, federation, durable graph mutation. |

## Adapter-specific promotion requirements

### BearBrowser handoff

A live BearBrowser handoff adapter requires:

- a concrete handoff payload source;
- a browser/session authority check;
- local-only default handling;
- explicit capture-is-not-publication behavior;
- tests proving handoff failure does not break the reader.

### SlashTopics scope resolver

A live SlashTopics resolver requires:

- an owning topic-pack or resolver contract;
- read-only scope resolution before any mutation path exists;
- receipt handling for resolved scopes;
- tests proving failed scope resolution leaves the item visible but unpromoted.

### New Hope membrane

A live New Hope membrane adapter requires:

- an owning membrane event contract;
- explicit admit, hold, quarantine, reject handling;
- UI rendering for guarded and blocked states;
- tests proving blocked items cannot publish, write memory, or expand graph views.

### MemoryMesh posture

A live MemoryMesh adapter requires:

- a memory profile contract;
- display-only recall posture before any durable writeback path;
- raw payload storage restrictions;
- tests proving writeback remains disabled unless separately enabled by policy.

### MeshRush graph view

A live MeshRush adapter requires:

- a graph-view adapter contract;
- advisory display before traversal execution;
- explicit traversal and persistence switches;
- tests proving graph failure does not block reader use.

## Non-negotiable defaults

- Live adapters default to disabled.
- Fixture state must remain usable without any live adapter.
- Resolver status display does not imply adapter enablement.
- Browser capture does not imply publication.
- Scope resolution does not imply feed fetching.
- Membrane admission does not imply memory writeback.
- Memory posture display does not imply durable storage.
- Graph view display does not imply traversal or persistence.
- Derived publication requires a separate explicit decision.

## Required PR language

Any PR that enables live behavior must include a section titled `Live-adapter gate` and answer:

1. Which adapter is being enabled?
2. What owning artifact authorizes the adapter boundary?
3. What side effects are possible?
4. What side effects remain impossible?
5. How is the adapter disabled?
6. What tests prove disabled and failure behavior?
7. What rollback path preserves fixture-backed reader use?

## Current locked state

The current reader passes the gate only as a fixture-backed, default-disabled surface. It has fixture modules, read-only resolver status seams, UI panels, unit tests, smoke tests, and aggregate chain coverage. No live adapter is enabled.

Before any live adapter work begins, parent issue #354 must receive an explicit acceptance reconciliation stating which single adapter is next, which owning artifact authorizes it, and which side effects remain disallowed for that adapter tranche.

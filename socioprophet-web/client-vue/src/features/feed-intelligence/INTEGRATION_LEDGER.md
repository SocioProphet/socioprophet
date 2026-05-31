# Feed Intelligence integration ledger

Status: contract ledger for the fixture-backed reader surface  
Scope: `socioprophet-web/client-vue/src/features/feed-intelligence`  
Runtime posture: fixture-backed UI only

## Purpose

The Feed Intelligence reader is the canonical Vue shell surface for the feed/memex/federation design line. It renders a fixture-backed reader, ticker, source list, canonical item detail, memex side panel, event chain, and integration cards.

This ledger records the owning repository contracts that bound the reader. The reader may display those relationships, but it does not own their runtime behavior.

## Owning contracts

| Concern | Owning repo | Contract artifact | Reader posture |
| --- | --- | --- | --- |
| Browser capture and provenance | `SourceOS-Linux/BearBrowser` | `docs/reader-bridge.md` | Display/accept handoff shape only; no native bridge active. |
| Public query and governance scope | `SocioProphet/slash-topics` | `examples/feed-intelligence/scope.example.md` | Render scope labels and fixture lane mapping only. |
| Membrane admission | `SocioProphet/new-hope` | `examples/feed-intelligence/membrane-event.example.md` | Render decision labels only: admit, hold, quarantine, reject. |
| Scoped memory posture | `SocioProphet/memory-mesh` | `examples/feed-intelligence/memory-profile.example.md` | Render storage/recall/writeback posture only; no live writeback. |
| Graph-view structure | `SocioProphet/meshrush` | `fixtures/graph-views/feed-intelligence-reader-graph-view.sample.v1.json` | Render graph-view concept only; no live traversal. |

## Boundary rules

- The reader is not a feed fetcher.
- The reader is not an ActivityPub server.
- The reader is not a MemoryMesh writeback surface.
- The reader is not a MeshRush runtime executor.
- The reader is not BearBrowser.
- The reader may graduate from fixture-backed to live only after the owning repo contract, adapter, validator or test, and authority boundary are present.

## Acceptance posture

This ledger is current when each integration card in the reader has a corresponding owning artifact in the table above, and when the UI remains explicit that the current state is fixture-backed.

A future live integration PR must update this ledger and include:

1. owning repo artifact reference;
2. adapter or API boundary;
3. authority decision boundary;
4. tests or validation path;
5. rollback or disabled-state behavior.

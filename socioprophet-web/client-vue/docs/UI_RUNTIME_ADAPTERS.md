# UI Runtime Adapters

Status: scaffolded
Control issue: https://github.com/SocioProphet/socioprophet/issues/323
SocioSphere protocol: https://github.com/SocioProphet/sociosphere/tree/main/protocol/ui-runtime-adapter/v0

## Purpose

The runtime adapter layer prevents rescued or newly promoted UI surfaces from silently presenting mock data as live platform behavior.

Every product surface that renders platform state must declare:

- owning service repository;
- typed adapter name;
- runtime state: `mock`, `fixture`, `live`, `degraded`, `unavailable`, or `retired`;
- evidence level: `E0` through `E4`;
- mock boundary;
- fixture reference;
- live contract reference;
- authorization/capability profile;
- integration-test reference.

## Current implementation

The active Vue shell lives under:

```text
socioprophet-web/client-vue
```

Runtime adapter scaffold:

```text
src/runtime-adapters/types.ts
src/runtime-adapters/baseAdapter.ts
src/runtime-adapters/rescuedPlatformFeatures.ts
src/runtime-adapters/index.ts
src/runtime-adapters/rescuedPlatformFeatures.test.ts
src/components/RuntimeAdapterStatusBadge.vue
```

## Claim discipline

A UI surface may not be called live, working, or fully functional below `E3`.

A UI surface may not be called production-ready below `E4`.

Mock and fixture-backed surfaces must render their runtime state visibly when shown in review or demo contexts.

## Initial feature registry

The initial registry captures rescued-platform features from SocioSphere issue 333:

- Graph Universe Explorer
- Domain Ontology Workbench
- Agent Configuration Workbench
- Life Mirror Telemetry Panel
- Browser Capture Status and Clip Inbox
- Educational Dialogue Workbench
- Lattice Runtime / Execution Placement Surface

## Next implementation steps

1. Wire `RuntimeAdapterStatusBadge.vue` into each rescued feature panel as panels are promoted.
2. Replace local mock objects with adapters imported from `src/runtime-adapters`.
3. Upgrade a feature from `E0` or `E1` only after its owning service exposes fixtures and a live contract.
4. Add integration tests when downstream services land their contracts.

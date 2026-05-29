# Contract Surface Workroom Plan

## Purpose

The Vue shell is the interface to the shared SocioProphet substrate. It is not the substrate by itself and it is not the authority plane.

`ContractSurface` is the UI object model that makes NLBoot contracts, agent contracts, run contracts, workstation contracts, browser boundaries, model-carry boundaries, feed contracts, and workspace contracts legible in one workroom vocabulary.

## Product posture

The workroom should show:

- contract kind and owning repo;
- runtime state;
- evidence level;
- authority boundary;
- admissible actions;
- blocked actions;
- admission requirements;
- receipt refs;
- audience: internal workroom, professional workroom, or client-visible.

This keeps the UI from implying that fixture data, mock adapters, or evidence records are live executable substrate.

## Boundary rule

```text
contract surface = UI/read/admission object
owning repo = schema and source-of-truth owner
runtime adapter = live or fixture integration boundary
AgentPlane / Guardrail / Agent Registry / Ledger = execution, control, authority, and evidence planes
```

The Vue shell can render, validate, and request. It does not directly mutate host state, boot state, agent authority, credential state, browser runtime state, or model lifecycle state.

## Workroom modes

### Workroom

Internal shared substrate view. It may show lower-maturity fixtures, mock seams, internal boundary records, and operator-only requirements.

### Professional Workroom

Client/project-safe substrate view. It may show only surfaces whose audience is `professional-workroom` or `client-visible`. These surfaces must be redacted, auditable, and clear about blocked or request-only actions.

## Initial surfaces

The first registry tranche includes:

- NLBoot Evidence Contract Surface;
- Agent Pre-Dispatch Contract Surface;
- Browser Runtime Boundary Surface;
- Model Carry Authorization Boundary.

None of the initial surfaces is execution-authorized. This is intentional. The first tranche is substrate legibility, not live action.

## Next route work

Recommended next routes:

- `/workroom` for internal substrate overview;
- `/professional-workroom` for client/project-safe view;
- route-level panels that import `contractSurfacesForRoute(route)` and render boundary/admission cards.

## Non-goals

This tranche does not wire live backend calls, create new contract schemas in the UI repo, dispatch agents, submit NLBoot actions, access credentials, execute browser automation, download models, or mutate workstation state.

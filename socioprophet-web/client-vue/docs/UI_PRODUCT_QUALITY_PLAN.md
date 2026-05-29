# UI Product Quality Plan

Status: governing plan for the SocioProphet Vue product shell  
Scope: `socioprophet-web/client-vue`  
Date: 2026-05-29

## Purpose

The Vue shell now contains several replayed product surfaces from `mdheller/socioprophet-web`. Many of those surfaces are intentionally fixture-backed or mock-only. They are useful as product intent and interface inventory, but they are not automatically good product.

This plan prevents the shell from becoming a pile of disconnected mock screens.

The rule is simple: a route is not product-ready because it renders. It is product-ready only when its information architecture, state model, runtime boundary, accessibility, validation, and acceptance criteria are explicit and tested.

## Current posture

`client-vue` is the canonical app/workbench shell. It currently contains three kinds of routes:

| Class | Meaning | Examples | Product posture |
| --- | --- | --- | --- |
| Live-capable workbench | Can call a real service when configured and has fallback mode | `/map` | Highest maturity today |
| Evidence/fixture surface | Renders structured control/evidence state but does not perform actions | `/professional-intelligence`, `/control-plane`, `/nlboot`, `/reader` | Useful but not product-ready without IA and state hardening |
| Mock adapter seam | Demonstrates adapter shape only and must fail closed outside mock/test mode | `/journal`, `/code` | Contract sketch, not product feature |
| Mock domain taxonomy | Placeholder domain pages backed by route taxonomy | `/news`, `/law/*`, `/people/*`, etc. | Navigation scaffold only |

## Product-quality gates

A route cannot graduate unless it passes all gates below.

### Gate 0 — Inventory and ownership

Every route must declare:

- route path;
- user job-to-be-done;
- owner plane or owning repo;
- source of truth for data;
- fixture/live/backend status;
- explicit non-goals;
- acceptance tests.

No orphan routes. No mystery screens.

### Gate 1 — Information architecture

Every route must answer:

- Where am I?
- What problem does this solve?
- What state am I looking at?
- What can I safely do here?
- What is blocked, pending, or mock-only?
- Where do I go next?

Required UI elements:

- stable title and route breadcrumb;
- primary object or lane label;
- mode/status badge: live, fallback, fixture, mock, evidence-only, or blocked;
- next-action or next-review affordance;
- clear empty/error/loading state.

### Gate 2 — State model

Every route must use one of these state patterns:

1. static design reference;
2. typed fixture state;
3. typed fixture plus adapter function;
4. live adapter with deterministic fallback;
5. live adapter only, with explicit error state.

State must not be hidden inside untyped component-local arrays once the route is more than a sketch. For replayed pages, the next step is to extract static arrays into typed `src/features/<feature>/state.ts` or `fixtures/<feature>/*.json`.

### Gate 3 — Runtime and authority boundary

Every runtime-adjacent feature must declare its boundary in the UI and tests.

Examples:

- `/map`: live API versus demo fallback.
- `/nlboot`: evidence only; no boot commands, disk writes, EFI mutations, reboot, or host hardware access.
- `/reader`: no live feed fetching, ActivityPub federation, MemoryMesh writeback, MeshRush traversal, or BearBrowser native bridge.
- `/journal` and `/code`: mock-only TriRPC seams; fail closed outside mock/test mode.

A page that appears to perform an action but only mutates mock state is a defect unless it is clearly labelled as a disabled or mock affordance.

### Gate 4 — Navigation coherence

The shell must stop accreting random links.

Navigation model:

- Top nav = domain/product areas.
- Tab bar = local workspace lanes for the active product area.
- Left rail = persistent operator shortcuts.
- Breadcrumb = exact route context.

Any new route must update only the navigation layer it actually belongs to. Do not add a top-level nav link for every experimental screen.

### Gate 5 — Accessibility and usability baseline

Every route must meet the baseline before graduation:

- one `h1` or equivalent labelled page title;
- landmark or section labels where layout is complex;
- keyboard-operable controls;
- visible focus state through existing browser/CSS behavior or explicit style;
- readable contrast in both dark and light sections;
- no information conveyed only by color;
- responsive behavior down to narrow laptop/mobile widths;
- no horizontal overflow except intentional tables/carousels.

The working review matrix is:

```text
docs/VISUAL_ACCESSIBILITY_REVIEW.md
```

That matrix is not a claim of completed browser QA. It is the checklist and route-by-route control surface for the next review pass.

### Gate 6 — Test coverage

Every route needs at least smoke coverage.

Minimum tests:

- component mounts without throwing;
- title renders;
- mode/boundary badge renders;
- key evidence or state rows render;
- blocked/mock/live boundary language renders;
- primary interaction does not blank the page.

Live-capable adapters need additional tests:

- live success;
- fallback success;
- API failure;
- malformed response;
- loading and empty state.

### Gate 7 — Visual review

Before product graduation, route must have a visual review note in PR body or docs:

- screenshot or textual visual summary;
- layout risks;
- density concerns;
- mobile/narrow behavior;
- whether visual language matches the rest of the shell.

No more “it builds, ship it” for complex UI.

### Gate 8 — Performance and data-density discipline

Routes should not dump every possible datum onto one page.

Rules:

- max one primary object per screen;
- tables need sorting/filtering plan before becoming large;
- dense evidence pages need progressive disclosure;
- repeated status badges must map to a controlled vocabulary;
- mock state should be small, representative, and named as fixture.

## Route maturity levels

| Level | Name | Definition | Allowed in nav? |
| --- | --- | --- | --- |
| L0 | Design reference | Documented only; no route | No |
| L1 | Sketch route | Renders static content; explicit mock/design label | Left rail only if useful |
| L2 | Fixture route | Typed fixture state and smoke test | Yes, but labelled |
| L3 | Adapter route | Runtime adapter seam with fail-closed behavior and tests | Yes |
| L4 | Live/fallback route | Live adapter with deterministic fallback and full error states | Yes |
| L5 | Product route | UX review, accessibility baseline, acceptance criteria, CI, and owner confirmed | Yes |

Current estimated maturity:

| Route | Current level | Required next step |
| --- | --- | --- |
| `/map` | L4 | Product visual review and route-level owner record |
| `/professional-intelligence` | L2 | Extract state generation/fixtures into durable feature module; define live source contract |
| `/control-plane` | L2 | Extract lifecycle state to fixture; add disabled action affordances and owner contract refs |
| `/nlboot` | L2 | Extract evidence records to fixture; align object names to NLBoot contract docs |
| `/reader` | L2 | Define feed-intelligence adapter contract and route-level IA review |
| `/journal` | L3 mock | Replace with real TriRPC contract or keep hidden from primary nav |
| `/code` | L3 mock | Replace with real search adapter contract or keep hidden from primary nav |
| Domain taxonomy routes | L1 | Decide which are actual product routes versus placeholders |

## Anti-garbage rules

These rules are hard constraints for future PRs.

1. Do not add new routes without a maturity level.
2. Do not add action buttons that imply live execution unless the backend authority exists.
3. Do not add top-nav links for experimental screens by default.
4. Do not bury stale PR numbers or timestamps as live truth.
5. Do not copy old source pages wholesale without adapting to current `client-vue` patterns.
6. Do not mix marketing pages and product-shell routes.
7. Do not treat successful render as successful product.
8. Do not graduate a mock page without boundary tests.
9. Do not allow fixture data to impersonate telemetry.
10. Do not put backend schemas in this repo when another repo owns the contract.

## Sequencing plan

### Phase 1 — Stabilize shell coherence

Goal: make the existing shell understandable before adding more screens.

Work items:

- create route registry with maturity levels;
- normalize nav semantics across top nav, tab bar, left rail, breadcrumbs;
- make mode/status badges consistent;
- hide or demote sketch routes from primary navigation if they confuse product review;
- ensure every route has a smoke test.

Exit criteria:

- one route inventory exists;
- every visible route has a maturity label;
- tests cover all visible route classes;
- no mock route appears live.

### Phase 2 — Feature modules and fixtures

Goal: stop embedding product state directly inside `.vue` files.

Work items:

- extract Professional Intelligence state into feature fixture/generator module;
- extract SourceOS lifecycle state to `features/sourceos-lifecycle`;
- extract NLBoot evidence state to `features/nlboot-evidence`;
- keep Feed Intelligence as the reference pattern and harden it;
- add fixture provenance comments or source refs.

Exit criteria:

- major replayed pages import typed state modules;
- fixture provenance is explicit;
- smoke tests validate boundary labels and state rendering.

### Phase 3 — Interaction quality

Goal: move from static dashboards to useful operator workflows without fake authority.

Work items:

- add filtering/search within evidence tables;
- add disabled/gated action affordances with explicit requirements;
- add empty/loading/error states;
- add per-route “next review” panels;
- add keyboard/focus review.

Exit criteria:

- every route handles empty/error/loading where relevant;
- every action is either real, disabled with reason, or mock-labelled;
- UI does not blank on failed interactions.

### Phase 4 — Live adapter contracts

Goal: wire live behavior only where owning contracts exist.

Candidate order:

1. `/map` remains live/fallback exemplar.
2. `/reader` gets a feed-intelligence adapter only after BearBrowser/SlashTopics/New Hope/MemoryMesh/MeshRush contract boundaries are opened in their repos.
3. `/journal` gets real TriRPC only after backend event-stream contract is accepted.
4. `/code` gets real search only after adapter ownership and authz are settled.
5. `/control-plane` and `/nlboot` remain evidence-only until SourceOS/NLBoot control contracts explicitly permit UI action.

Exit criteria:

- live adapters have contract refs;
- live/fallback/error tests exist;
- no route exceeds its authority plane.

### Phase 5 — Product review and deployment readiness

Goal: identify what is actually shippable.

Work items:

- run visual review for each route;
- run accessibility checklist;
- confirm deployment surface split;
- define release candidate route set;
- document routes intentionally excluded from release.

Exit criteria:

- route release matrix exists;
- every included route is L4 or L5;
- every excluded route has a reason.

## Required PR template additions for UI work

Every UI PR should answer:

```text
Route(s):
Maturity level before:
Maturity level after:
State mode: design | fixture | mock adapter | live/fallback | live-only
Authority boundary:
User job:
Primary object:
Navigation touched:
Tests added/updated:
Visual review summary:
Known gaps:
```

## Immediate next PRs

Recommended order:

1. Add route registry and maturity labels.
2. Normalize navigation so experimental routes do not dominate the top nav.
3. Extract SourceOS/NLBoot static arrays into typed feature fixtures.
4. Extract Professional Intelligence generation/fixture boundary into a feature module.
5. Add a shared `ModeBadge` / `BoundaryNotice` component.
6. Add route-level empty/error/loading state conventions.
7. Run visual/accessibility review pass.

## Definition of done

The UI is not considered coherent until:

- route registry exists;
- all visible routes have maturity labels;
- route boundaries are visible in UI;
- every visible route has smoke tests;
- static data is typed and fixture-backed;
- no route implies authority it does not have;
- navigation is intentionally structured;
- release matrix identifies shippable versus reference-only surfaces.

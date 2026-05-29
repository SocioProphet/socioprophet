# Release Route Matrix

Status: initial release-control matrix, not a shipment approval  
Scope: `socioprophet-web/client-vue`  
Date: 2026-05-29

## Purpose

This matrix separates routes that may be shown in a controlled review/demo from routes that are product candidates, mock/reference surfaces, or explicitly excluded from release.

A route is not shippable because it renders. Release inclusion requires maturity, boundary clarity, route-state coverage, tests, and visual/accessibility review.

## Release posture definitions

| Posture | Meaning |
| --- | --- |
| Include candidate | May be included in a controlled internal/demo build after validation and visual/accessibility review. |
| Review only | Useful for operator/product review but not shippable as product. |
| Reference only | Kept as contract/design/reference; not a release route. |
| Excluded | Should not appear in the first release route set. |

## Current route matrix

| Route | Current level | State mode | Release posture | Why | Required before release |
| --- | --- | --- | --- | --- | --- |
| `/map` | L4 | live/fallback | Include candidate | Best current candidate: live/fallback map API posture, existing tests, clear GAIA/OSM workbench role. | Browser visual/accessibility review; route owner record; release note for fallback limits. |
| `/professional-intelligence` | L2 | fixture | Review only | Useful operating dashboard, but fixture-backed and dense. Actions are gated/disabled. | Live source contract, visual density pass, route-state review, source freshness model. |
| `/control-plane` | L2 | fixture/evidence | Review only | Useful SourceOS lifecycle evidence view, but no real assignment/enrollment authority. | SourceOS/NLBoot owner contract refs, progressive disclosure, no-action release wording. |
| `/nlboot` | L2 | fixture/evidence | Review only | Useful evidence inventory, but boot/hardware authority is intentionally absent. | Align object names to NLBoot contracts, digest overflow review, evidence fixture provenance. |
| `/reader` | L2 | fixture | Review only | Good Feed Intelligence concept surface, but no live feed/memory/graph/browser/publication adapters. | Feed-intelligence adapter contract, mobile IA pass, live/fallback decision. |
| `/journal` | L3 mock | mock adapter | Reference only | Mock TriRPC event-shape seam. Not a product feature without backend event-stream contract. | Real TriRPC stream contract and authz model, or keep hidden/reference. |
| `/code` | L3 mock | mock adapter | Reference only | Mock search seam. Not a real code-search product. | Search adapter ownership, authorization, indexing contract, or keep hidden/reference. |
| `/news` | L1 | taxonomy scaffold | Excluded | Scaffold route can confuse review as real news product. | Explicit scaffold-state page or real product slice. |
| `/law/*` | L1 | taxonomy scaffold | Excluded | Taxonomy shell only; no live legal intelligence feature. | Product slice, data/source contract, and state model. |
| `/people/*` | L1 | taxonomy scaffold | Excluded | Taxonomy shell only; no live people feature. | Product slice, privacy model, data/source contract. |
| `/economy/*` | L1 | taxonomy scaffold | Excluded | Taxonomy shell only; no live economic intelligence feature. | Product slice, data/source contract, route tests. |
| `/markets/*` | L1 | taxonomy scaffold | Excluded | Taxonomy shell only; could be mistaken for live market data. | Live-data/fallback contract and market-data disclaimers. |
| `/weather/*` | L1 | taxonomy scaffold | Excluded | Taxonomy shell only; could be mistaken for live forecast. | Weather adapter contract and safety limits. |
| `/analytics` | L1 | taxonomy scaffold | Excluded | Scaffold route only. | Real analytics object model and tests. |

## First controlled route set

The first controlled internal/demo route set should include:

1. `/map`
2. `/professional-intelligence`
3. `/control-plane`
4. `/nlboot`
5. `/reader`

The first public/product release candidate should include only:

1. `/map`

Even `/map` remains conditional on visual/accessibility review and explicit fallback-mode wording.

## Routes to hide or demote before public review

Before any public review, remove or demote these from top-level navigation unless they are promoted by a bounded PR:

- taxonomy scaffold routes;
- `/journal`;
- `/code`.

These may remain accessible for internal operator review, but they should not look like finished product.

## Required release checks

Before a route can be release-included:

- route registry entry exists;
- maturity level is L4 or L5 for product release, or explicitly marked review-only;
- route-state panel exists where fixture/mock/error/empty conditions apply;
- boundary notice exists where authority is limited;
- smoke tests cover route title, boundary/state, and key content;
- visual/accessibility review is documented;
- owner plane and source-of-truth are named;
- release note states any fallback/mock/fixture limits.

## Current decision

Do not ship the full Vue shell as product yet.

The shell is now far more disciplined than the imported staging source, but most routes are still review/control surfaces rather than product routes. The correct first release posture is:

- internal/demo: controlled route set above;
- product candidate: `/map` only after visual/accessibility review;
- public route set: defer until release review passes.

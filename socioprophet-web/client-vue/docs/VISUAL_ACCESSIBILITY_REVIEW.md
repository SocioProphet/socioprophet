# Visual and Accessibility Review Matrix

Status: initial review matrix, not a completed visual QA pass  
Scope: `socioprophet-web/client-vue`  
Date: 2026-05-29

## Purpose

This document makes the UI review work auditable. It records what must be visually and accessibly checked before any route graduates from fixture/mock/demo status into product-ready status.

This is not a claim that the routes have been visually verified in-browser. It is a control artifact for the next review pass.

## Review baseline

Every visible route needs:

- one clear page title;
- visible route mode: live, fallback, fixture, mock, evidence-only, idle, loading, empty, error, ready, or blocked;
- readable boundary language where authority is limited;
- keyboard-operable controls;
- no fake enabled action buttons;
- no horizontal overflow except intentional scrollable tables;
- usable narrow-width layout;
- no information conveyed by color alone;
- error and empty states where data can be absent;
- visual density appropriate to the route maturity level.

## Route review matrix

| Route | Current level | Current state posture | Visual risk | Accessibility risk | Required next action |
| --- | --- | --- | --- | --- | --- |
| `/map` | L4 | live/fallback | Dense map panels may overwhelm review; map canvas needs panel hierarchy review. | Map controls and layer panels need keyboard/focus review. | In-browser visual pass with live and fallback modes. |
| `/professional-intelligence` | L2 | fixture | Dense dashboard with many tables/cards; risk of control overload. | Gated actions disabled correctly, but heading hierarchy and card navigation need review. | Add route-state panel and review mobile density. |
| `/control-plane` | L2 | fixture/evidence | Lifecycle timeline and tables are dense; risk of too much on one screen. | Table semantics mostly OK; timeline needs screen-reader order review. | Add route-state panel and progressive disclosure plan. |
| `/nlboot` | L2 | fixture/evidence | Hash/digest rows can overflow; card stack may be long. | Long digests require wrapping; status chips need text labels. | Add empty/error fixture states and digest wrapping review. |
| `/reader` | L2 | fixture | Four-column layout likely too wide; mobile collapse is high risk. | Ticker buttons and item cards need focus/active-state review. | Apply route-state panel and mobile IA pass. |
| `/journal` | L3 mock | mock/loading/error/empty | Current state panel now makes mock mode visible. | Event body `<pre>` needs overflow and screen-reader review. | Verify tests and visual pass after CI. |
| `/code` | L3 mock | idle/loading/error/empty/ready | Search result cards are simple; acceptable for mock. | Input/button keyboard flow is simple; needs focus-state review. | Verify tests and visual pass after CI. |
| taxonomy routes | L1 | scaffold | Risk of appearing like real product despite placeholder state. | Unknown until scaffold is reviewed. | Add explicit scaffold state panel or demote from primary route set. |

## Route-state coverage

| Route | Current explicit states | Missing states |
| --- | --- | --- |
| `/journal` | loading, error, empty, mock | none for current mock scope |
| `/code` | idle, loading, error, empty, ready | none for current mock scope |
| `/professional-intelligence` | fixture boundary, gated actions | explicit route-state panel |
| `/control-plane` | fixture boundary | explicit route-state panel |
| `/nlboot` | fixture boundary | explicit route-state panel |
| `/reader` | fixture boundary | explicit route-state panel |
| `/map` | live/fallback/error behavior already tested | visual review artifact for live/fallback panel behavior |

## Visual review checklist

Use this checklist in PR bodies once a route is visually reviewed:

```text
Route:
Viewport(s): desktop / narrow / mobile
Mode(s): live / fallback / fixture / mock / error / empty
Primary visual risk:
Density result:
Navigation result:
Keyboard/focus result:
Overflow result:
Color-only status result:
Screenshots or textual summary:
Decision: keep / revise / hide / graduate
```

## Immediate follow-ons

1. Apply `RouteStatePanel` to `/professional-intelligence`, `/control-plane`, `/nlboot`, and `/reader`.
2. Add explicit scaffold state to taxonomy routes or hide lower-confidence scaffold routes from top-level product review.
3. Run in-browser review for `/map`, `/reader`, `/professional-intelligence`, `/control-plane`, and `/nlboot`.
4. Add mobile/narrow layout review findings.
5. Create a release matrix that identifies which routes are included in the first shippable route set.

## Release candidate posture

No route should be considered L5 product-ready yet.

The closest candidate is `/map`, because it has live/fallback behavior and smoke coverage. It still needs visual/accessibility review and a release decision record before being treated as product-ready.

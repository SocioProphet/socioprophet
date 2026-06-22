# `/map` Browser QA Runbook

Status: execution runbook; browser QA not yet completed  
Scope: `socioprophet-web/client-vue`  
Target route: `/map`  
Date: 2026-05-29

## Purpose

This runbook defines exactly how to execute the browser visual/accessibility review that currently blocks `/map` from public/product release.

It is not evidence by itself. Evidence is produced only when a reviewer executes the steps below and attaches screenshots or textual browser observations.

## Preconditions

Run from a local checkout of `SocioProphet/socioprophet`.

```bash
cd socioprophet-web/client-vue
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Default local URL:

```text
http://localhost:5174/map
```

The review may use demo fallback mode. Live API mode is preferred when `prophet-platform` OSM Map API is available.

## Evidence package

Create an evidence folder outside the repo or in a PR attachment bundle:

```text
map-browser-qa-YYYYMMDD/
  desktop-1440x900.png
  narrow-1024x768.png
  mobile-390x844.png
  keyboard-traversal-notes.md
  focus-review-notes.md
  overflow-review-notes.md
  release-decision.md
```

Do not commit screenshots unless the repo policy explicitly allows binary review artifacts.

## Viewports

Review the route at these minimum viewport sizes:

| Viewport | Purpose |
| --- | --- |
| `1440x900` | Primary desktop operator view. |
| `1024x768` | Narrow laptop / small desktop. |
| `390x844` | Mobile/narrow responsive stress test. |

## Required screenshot checks

For each viewport, capture the full visible page and record:

```text
Viewport:
Mode: live API / demo fallback
Screenshot file:
Immediate visual blockers:
Density result: pass / revise / fail
Overflow result: pass / revise / fail
Boundary visibility: pass / revise / fail
Decision: keep / revise / hide / graduate
```

## Desktop review checklist

At `1440x900`, verify:

- title `OpenStreetMap × GAIA world model` is visible;
- live/fallback status tags are visible;
- advisory routing and non-production tile tags are visible;
- loading/fallback/warning states appear above the workbench when active;
- left panel controls are legible;
- map canvas occupies the central stage without collapsing;
- map overlay text is readable;
- right panel evidence/governance/runtime sections are readable;
- placeholder tile metadata warning is visible where relevant;
- long digests/source refs wrap or scroll intentionally;
- page does not require excessive horizontal scrolling.

## Narrow and mobile review checklist

At `1024x768` and `390x844`, verify:

- page remains navigable;
- header does not obscure status labels;
- panels stack or scroll without data loss;
- map canvas remains usable or route is explicitly marked desktop-first;
- controls remain reachable with touch and keyboard;
- no critical status text is hidden off-screen;
- digest/source-ref overflow is controlled;
- the route does not look product-ready if it is actually fallback/demo.

If mobile is unusable but desktop is acceptable, record a desktop-only release constraint rather than failing silently.

## Keyboard traversal checklist

Using only keyboard:

1. Load `/map`.
2. Press `Tab` through top-level controls.
3. Confirm focus reaches:
   - refresh snapshot;
   - runtime button;
   - feature button;
   - evidence button;
   - governance button;
   - layer catalog button;
   - legacy layer buttons;
   - GAIA layer catalog buttons;
   - H3 input;
   - H3 inspect button;
   - MapLibre controls, if exposed by the rendered map widget.
4. Confirm visible focus state is present for each reachable control.
5. Confirm `Enter`/`Space` activation does not blank the page.
6. Confirm focus is not trapped in the map canvas or side panels.

Record failures in `keyboard-traversal-notes.md`.

## Screen-reader/order checklist

Use browser accessibility tree or screen-reader inspection where available.

Verify:

- one clear page title is announced;
- map canvas is labelled as `GAIA map canvas`;
- left panel, map stage, and right panel are ordered sensibly;
- status tags include text and are not color-only;
- evidence and governance lists are readable;
- key-value detail grids are understandable or flagged for `dl` conversion;
- warning/error cards are announced before detailed panels where possible.

Record failures in `focus-review-notes.md` or a dedicated accessibility note.

## Functional browser checks

In browser, execute:

- refresh snapshot;
- click runtime/feature/evidence/governance/layer-catalog jump buttons;
- select a legacy map layer;
- select a GAIA catalog layer;
- inspect the default H3 cell;
- enter an invalid H3 cell if the UI permits and verify the page does not blank;
- confirm placeholder tile metadata is not presented as production tile serving.

## Pass/fail criteria

`/map` may remain a product candidate only if:

- desktop screenshot review passes or has minor revisions only;
- keyboard traversal has no blocker;
- fallback mode is visibly disclosed;
- non-production tile boundary is visible;
- no critical horizontal overflow occurs at desktop;
- browser interactions do not blank the page.

`/map` may be public-release eligible only if, in addition:

- narrow/mobile behavior is acceptable or a desktop-only constraint is explicitly recorded;
- focus states are visible;
- fallback-mode wording is clear enough for non-operator users;
- release notes identify live/fallback limitations;
- remaining visual issues are low severity.

## Release-decision template

```text
Route: /map
Reviewer:
Date:
Commit SHA:
Browser(s):
Viewport(s):
Data mode(s): live API / demo fallback
Desktop result: pass / revise / fail
Narrow result: pass / revise / fail
Mobile result: pass / revise / fail / desktop-only
Keyboard result: pass / revise / fail
Screen-reader/order result: pass / revise / fail
Overflow result: pass / revise / fail
Fallback wording result: pass / revise / fail
Decision: keep candidate / revise before candidate / remove from release set / approve public release
Blocking issues:
Non-blocking issues:
Evidence files:
```

## Current expected result

Based on static review, `/map` is expected to remain a product candidate but not public-release eligible until browser evidence is attached and fallback wording is reviewed.

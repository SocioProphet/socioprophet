# `/map` Static Visual and Accessibility Review

Status: static/code-based review complete; browser screenshot QA pending  
Scope: `socioprophet-web/client-vue/src/pages/MapPage.vue`  
Date: 2026-05-29

## Review boundary

This review is based on source inspection and existing smoke tests. It is not a browser screenshot review and it is not a keyboard traversal recording.

Do not treat this document as L5/product-ready approval.

## Reviewed sources

- `src/pages/MapPage.vue`
- `src/__tests__/MapPage.smoke.test.ts`
- `src/api/gaiaMap.ts` indirectly through existing smoke coverage
- `src/runtime-adapters/routeRuntimeFeatures.ts` indirectly through route runtime badges

## Static review result

`/map` remains the strongest current product candidate, but it is not approved for public release yet.

Static/code review passes these checks:

| Area | Result | Evidence |
| --- | --- | --- |
| Page identity | Pass | Page has explicit title: `OpenStreetMap × GAIA world model`. |
| Route purpose | Pass | Subtitle states read-only map workbench and advisory/non-production posture. |
| Mode disclosure | Pass | Header exposes live API/demo fallback and live/demo catalog labels. |
| Boundary disclosure | Pass | Header includes advisory routing and non-production tile tags. Warning cards disclose product-demo/fallback mode. |
| Loading state | Pass | `loading` renders `Loading GAIA map state…`. |
| Error state | Pass | Initial fatal error renders `.state-card.error` when no snapshot exists. |
| Fallback state | Pass | Fallback warning is visible when API is unavailable. |
| Non-blank behavior | Pass | Existing smoke tests assert H3 success/failure does not blank the map grid. |
| Map canvas label | Pass | Canvas element has `aria-label="GAIA map canvas"`. |
| Keyboard-operable controls | Partial pass | Main controls are native buttons/inputs. Full keyboard traversal still needs browser review. |
| Evidence/governance panels | Pass | Evidence, governance, runtime, feature, layer catalog, and tile manifest panels are rendered. |
| Tile safety | Pass | Placeholder tile guard states placeholder metadata only and non-production tile behavior. |
| Attribution/provenance | Pass | OSM attribution, source refs, digest refs, and receipt/provenance fields are rendered. |
| Test coverage | Pass for static smoke | Smoke tests cover mount, canvas, fallback, live mode, H3 path, panels, status labels, catalog, and manifest. |

## Browser review still required

The following are pending because they require a running browser or screenshots:

- desktop screenshot at normal viewport;
- narrow/mobile screenshot;
- keyboard tab order through top controls, left panel, map stage, and right panel;
- visible focus review for buttons, inputs, and layer cards;
- screen-reader order check for the two side panels and central map canvas;
- actual visual density review after map tiles render;
- overflow review for the right-panel detail grids and long provenance/digest strings;
- confirmation that warning/error cards remain visible above the fold where needed.

## Visual risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Dense two-panel layout may overwhelm first-time reviewers | Medium | Left controls + map + right inspector is appropriate for an operator workbench, but not for public landing/product intro. |
| Runtime/evidence/governance panels may be too deep for first release | Medium | Consider collapsible sections or progressive disclosure before public release. |
| MapLibre controls require browser focus review | Medium | Source uses native MapLibre control; accessibility depends partly on rendered control internals. |
| Long hashes/source refs can overflow | Medium | Code uses detail grids and evidence lists; needs browser overflow review. |
| Live/fallback labels may not be prominent enough for public users | Low/Medium | Existing labels are present; product copy may need stronger fallback-mode wording. |

## Accessibility risks

| Risk | Severity | Notes |
| --- | --- | --- |
| `map-canvas` is labelled, but map interaction semantics remain limited | Medium | Canvas/map widgets are inherently difficult; add adjacent textual feature summary for screen-reader users if public release is planned. |
| Scroll-jump buttons use panel labels but not expanded descriptions | Low | Native buttons are acceptable; text is short but clear. |
| Color-coded tags need text labels | Low | Current tags include text; not color-only. |
| Tables/detail grids are visual pairs, not semantic tables | Medium | Review whether key-value pairs should use `dl` for screen-reader clarity. |

## Release decision for `/map`

Current decision: keep `/map` as the only public/product candidate route, but do not approve it for public release until browser review evidence is added.

Recommended release posture:

- internal/demo: include;
- product candidate: yes;
- public release: pending browser visual/accessibility review and fallback-mode copy update.

## Required follow-up PRs

1. Run browser visual review for `/map` and attach screenshots or textual summaries.
2. Add or confirm focus-visible behavior for panel buttons and layer cards.
3. Review narrow/mobile layout and decide whether `/map` should be desktop-only for the first demo.
4. Add a short public-facing fallback-mode disclaimer if `/map` is exposed outside internal review.
5. Consider converting key-value detail grids to `dl` semantics where appropriate.

# GAIA Map Vue Shell Promotion Plan

Status: active promotion plan
Source implementation: `mdheller/socioprophet-web` main after PR #10
Target canonical surface: `SocioProphet/socioprophet/socioprophet-web`

## Purpose

Move the cleaned Vue shell and GAIA-backed `/map` workbench out of the disconnected personal repository and into the canonical SocioProphet web surface without losing the old React shell as the behavioral reference.

## Ground truth

The old React shell in `SocioProphet/socioprophet/socioprophet-web/client` remains the visual and behavioral reference for:

- dark top domain navigation;
- secondary tab row;
- left icon rail;
- breadcrumb work stage;
- light content canvas;
- bottom search / command / agent shell affordance.

The Vue shell in `mdheller/socioprophet-web` is the implementation target.

The parked UI contract work in `wip/ui-foundations/2026-04-13` remains the screen/action inventory source, especially:

- `component.shell.app`;
- `component.nav.top_domains`;
- `component.nav.left_rail`;
- `component.maps_analytics.widget`;
- `action.maps.open_map`;
- `action.maps.open_analysis`.

## Promotion shape

Target structure inside this repo:

```text
socioprophet-web/
  README.md
  package.json
  package-lock.json
  tsconfig.json
  vite.config.ts
  src/
    App.vue
    main.ts
    styles.css
    api/gaiaMap.ts
    config/domainRoutes.ts
    pages/MapPage.vue
    pages/DomainSurfacePage.vue
    types/gaiaMap.ts
  .github/workflows/product-build.yml
```

If preserving the old React implementation is needed, move or document it as:

```text
socioprophet-web/legacy/react-shell/
```

Do not delete the old React shell until the Vue shell is visually reviewed and accepted.

## Product build posture

Storybook is salvage/reference only. It must not be wired into product build or CI for this promotion.

Required product verification:

```bash
npm install
npm run typecheck
npm run build
```

The `product-build` workflow should verify only:

- dependency installation;
- Vue/TypeScript typecheck;
- Vite product build.

## `/map` route semantics

The public/user route is `/map`, not `/gaia`.

Internal naming can use GAIA because GAIA is the implementation/world-model concept, but the user-facing semantic route remains maps.

The first `/map` implementation is fixture/API-backed and consumes the Prophet Platform OSM Map API:

- `/map-layers`;
- `/features/by-osm/{osm_type}/{osm_id}`;
- `/features/by-h3/{h3_cell}`;
- `/route-graphs/osm`;
- `/runtime-boundaries/osm`;
- `/governance/osm`;
- `/search/osm-demo`.

## Deployment posture

The marketing site and the app shell should be treated as different deployable surfaces with connected identity later.

Do not assume the Vue shell deploys with the marketing/static site by default.

Candidate deployment split:

- marketing/public site: public static marketing/docs/intake;
- `socioprophet-web` Vue shell: authenticated app/product shell;
- Prophet Platform OSM Map API: backend service surface;
- shared login/session boundary: future identity integration.

## Acceptance criteria

1. Vue shell code is promoted from `mdheller/socioprophet-web` into `SocioProphet/socioprophet/socioprophet-web`.
2. Old React shell remains available as reference/archive during transition.
3. `/map` route renders in the Vue shell.
4. Product build verifies with npm install, typecheck, and Vite build only.
5. Storybook is not part of product verification.
6. GAIA OSM Map API contract wiring remains isolated in `src/api/gaiaMap.ts` and `src/types/gaiaMap.ts`.
7. UI contracts from `wip/ui-foundations/2026-04-13` are reflected in route/domain taxonomy.

## Open decisions

- Exact hosting target for the Vue shell: Firebase Hosting site, subdomain, Cloud Run/static bucket, or other app host.
- Whether old React shell is physically moved to `legacy/react-shell` or left in place until a second cleanup PR.
- Whether `package-lock.json` becomes canonical for `socioprophet-web` or the org repo stays Yarn-based.
- Whether Carbon Vue components are adopted directly or Carbon tokens/styles remain the first-stage design system layer.

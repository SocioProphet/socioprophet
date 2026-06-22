# SocioProphet Vue App Shell

Status: canonical app/workbench shell; quality-gated product surface

## Purpose

`client-vue` is the Vue product shell for SocioProphet app/workbench routes.

It is separate from public marketing/docs surfaces. Marketing pages may link into this shell, but app routes are owned here.

## UI quality governance

All future UI work in this shell is governed by:

```text
docs/UI_PRODUCT_QUALITY_PLAN.md
```

A route is not product-ready because it renders. It is product-ready only when its information architecture, state model, runtime boundary, accessibility, validation, and acceptance criteria are explicit and tested.

Future UI PRs must identify:

- route(s) touched;
- maturity level before and after;
- state mode: design, fixture, mock adapter, live/fallback, or live-only;
- authority boundary;
- navigation touched;
- tests added or updated;
- visual review summary;
- known gaps.

Current route maturity is tracked in the quality plan.

## Current route classes

| Class | Examples | Posture |
| --- | --- | --- |
| Live-capable workbench | `/map` | Can call live API when configured; deterministic fallback otherwise. |
| Evidence/fixture surface | `/professional-intelligence`, `/control-plane`, `/nlboot`, `/reader` | Useful product intent; not product-ready until quality gates pass. |
| Mock adapter seam | `/journal`, `/code` | Contract sketch only; mock/test mode and fail-closed behavior. |
| Domain taxonomy scaffold | `/news`, `/law/*`, `/people/*`, `/economy/*`, `/markets/*`, `/weather/*`, `/analytics/*` | Placeholder/scaffold unless promoted by a bounded PR. |

Current live-capable product route:

- `/map` — GAIA / OpenStreetMap workbench with live API mode and deterministic demo fallback mode.

Current mocked taxonomy routes are driven by `src/config/domainRoutes.ts`.

## Product build posture

This shell is verified as a Vite/Vue app only.

Storybook is not part of the product build and must not be wired into this verification path.

Required verification:

```bash
npm install
npm run typecheck
npm test
npm run build
```

The repo workflow for this surface is:

```text
client-vue-product-build
```

## Testing

### Unit and smoke tests

Run the full test suite (offline, no browser required):

```bash
cd socioprophet-web/client-vue
npm install
npm test
```

Watch mode for local development:

```bash
npm run test:watch
```

The tests use [Vitest](https://vitest.dev/) with `happy-dom` and `@vue/test-utils`.
MapLibre-GL is stubbed so tests run without WebGL.

### What the smoke tests cover

| Criterion | Test file |
|-----------|-----------|
| `/map` route loads, canvas renders, fallback/live modes, H3 failure handling, evidence panels | `MapPage.smoke.test.ts`, `gaiaMap.test.ts` |
| Professional Intelligence fixture and boundary | `ProfessionalIntelligence.smoke.test.ts` |
| SourceOS and NLBoot evidence boundaries | `SourceOSNlbootEvidence.smoke.test.ts` |
| Feed Intelligence fixture boundary | `FeedIntelligence.smoke.test.ts` |
| Mock Journal and Code Search boundaries | `MockAdapterSeams.smoke.test.ts` |

Local dev:

```bash
cd socioprophet-web/client-vue
cp .env.example .env.local
npm install
npm run dev
```

Default local app URL:

```text
http://localhost:5174
```

## API modes

The `/map` workbench supports two data modes:

1. Live API mode — calls the Prophet Platform OSM Map API.
2. Demo fallback mode — deterministic in-browser fallback when the API is unavailable.

Fallback mode keeps the screen usable for product review, but it is not a production data plane.

Fallback mode does not authorize:

- safety-critical navigation;
- dispatch authority;
- live route guidance;
- production tile serving;
- Lattice RuntimeAsset admission.

## Connecting to the OSM Map API

### Option A: Vite proxy

Use the default `.env.example` value:

```text
VITE_GAIA_MAP_API_BASE=/api
```

`vite.config.ts` proxies `/api` to `VITE_API_BASE` or `http://localhost:8088` by default.

Run the API separately from `SocioProphet/prophet-platform`:

```bash
cd apps/osm-map-api
export GAIA_FIXTURE_ROOT="$HOME/dev/gaia-world-model"
export SHERLOCK_FIXTURE_ROOT="$HOME/dev/sherlock-search"
export SOCIOSPHERE_FIXTURE_ROOT="$HOME/dev/sociosphere"
export OSM_MAP_API_HOST=127.0.0.1
export OSM_MAP_API_PORT=8088
python3 -m osm_map_api
```

### Option B: direct API URL

Use:

```text
VITE_GAIA_MAP_API_BASE=http://127.0.0.1:8088
```

The OSM Map API must allow the app origin:

```bash
export OSM_MAP_API_CORS_ALLOWED_ORIGINS="http://localhost:5174"
```

## Route ownership

The Vue shell owns app/workbench routes including:

- `/map`
- `/professional-intelligence`
- `/control-plane`
- `/nlboot`
- `/reader`
- `/journal`
- `/code`
- `/news`
- `/law/*`
- `/people/*`
- `/economy/*`
- `/markets/*`
- `/weather/*`
- `/analytics/*`

The user-facing map route is `/map`; GAIA remains the internal world-model implementation name.

## Deployment posture

This shell should deploy independently from the marketing/docs surface unless a later decision explicitly changes that.

See:

```text
socioprophet-web/docs/CLIENT_VUE_DEPLOYMENT_SPLIT.md
```

# SocioProphet Vue App Shell

Status: promoted app-shell candidate

## Purpose

`client-vue` is the Vue product shell for SocioProphet app/workbench routes.

It is separate from public marketing/docs surfaces. Marketing pages may link into this shell, but app routes are owned here.

Current live product route:

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
| 1. `/map` route loads | `MapPage.smoke.test.ts` |
| 2. Map canvas renders | `MapPage.smoke.test.ts` |
| 3. Fallback mode when API unavailable | `MapPage.smoke.test.ts`, `gaiaMap.test.ts` |
| 4. Live API mode when API available | `MapPage.smoke.test.ts`, `gaiaMap.test.ts` |
| 5. H3 lookup does not blank the page | `MapPage.smoke.test.ts`, `gaiaMap.test.ts` |
| 6. Evidence / governance / runtime panels | `MapPage.smoke.test.ts` |
| 7. Backend status displayed clearly | `MapPage.smoke.test.ts` |

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

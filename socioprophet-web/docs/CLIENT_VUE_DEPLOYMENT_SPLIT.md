# Client Vue Deployment Split

Status: v0 decision record
Scope: `socioprophet-web/client-vue`, public marketing/docs surfaces, and the GAIA `/map` workbench

## Decision

The Vue app shell and the public marketing/docs surface are separate deployable surfaces.

The Vue shell is the product/app surface. The marketing/docs surface remains the public website surface. The two surfaces may share branding and future identity/session handoff, but they should not be coupled into one build, one route owner, or one deployment unit by default.

## Rationale

The `/map` workbench is not a marketing page. It is a product surface backed by GAIA, OpenStreetMap-derived contracts, Sherlock evidence, Prophet Platform APIs, governance state, runtime-boundary state, and future authenticated workflows.

Keeping the app shell separate prevents:

- accidental product dependencies in marketing builds;
- accidental Storybook or salvage-screen coupling;
- marketing-site deploy failures caused by app/API changes;
- product app route ownership being hidden inside static docs configuration;
- premature identity and backend coupling.

## Surface ownership

### Public marketing/docs surface

Purpose:

- public landing pages;
- docs;
- project narrative;
- public onboarding and intake;
- static content.

Expected properties:

- public by default;
- minimal backend dependency;
- no requirement that GAIA OSM API is online;
- no product shell route ownership unless explicitly added later.

### Vue app shell

Canonical path:

```text
socioprophet-web/client-vue
```

Purpose:

- product workspace shell;
- `/map` GAIA/OpenStreetMap workbench;
- domain routes such as `/news`, `/law`, `/people`, `/economy`, `/markets`, `/weather`, and `/analytics` as app/workbench surfaces;
- future authenticated or semi-authenticated workflows;
- future CloudFog / agent shell integration.

Expected properties:

- product build is Vite/Vue only;
- Storybook is not part of product verification;
- GAIA `/map` can use live API mode or deterministic demo fallback mode;
- deployment is independently testable from marketing/docs;
- route ownership belongs to the app shell.

## Route ownership

The Vue shell owns app routes:

- `/map`
- `/news`
- `/law/*`
- `/people/*`
- `/economy/*`
- `/markets/*`
- `/weather/*`
- `/analytics/*`

The public marketing/docs surface may link to those routes, but should not own their implementation.

The user-facing map route is `/map`. GAIA remains the internal world-model implementation name, not the public route name.

## Backend API ownership

The GAIA `/map` workbench consumes the Prophet Platform OSM Map API.

Expected API contract:

- `GET /healthz`
- `GET /readyz`
- `GET /map-layers`
- `GET /map-layers/{layer_id}`
- `GET /features/by-osm/{osm_type}/{osm_id}`
- `GET /features/by-h3/{h3_cell}`
- `GET /route-graphs/osm`
- `GET /runtime-boundaries/osm`
- `GET /governance/osm`
- `GET /search/osm-demo`

The backend is fixture-backed for the current proof slice. It is not a production tile server and it is not live OSM ingestion.

## Environment variables

The Vue shell uses:

```text
VITE_GAIA_MAP_API_BASE
```

Recommended values:

| Environment | `VITE_GAIA_MAP_API_BASE` | Notes |
| --- | --- | --- |
| Local Vite proxy | `/api` | Vite proxies to the local API. |
| Local direct API | `http://127.0.0.1:8088` | Requires API CORS allowing the Vite origin. |
| Preview | preview API URL or preview gateway path | Should use explicit CORS origin or same-origin gateway. |
| Staging | staging API URL or staging gateway path | Should be environment-pinned. |
| Production | production API URL or same-origin gateway path | Prefer same-origin gateway where practical. |

The OSM Map API uses:

```text
GAIA_FIXTURE_ROOT
SHERLOCK_FIXTURE_ROOT
SOCIOSPHERE_FIXTURE_ROOT
OSM_MAP_API_HOST
OSM_MAP_API_PORT
OSM_MAP_API_CORS_ALLOWED_ORIGINS
OSM_MAP_API_CORS_ALLOW_CREDENTIALS
```

`OSM_MAP_API_CORS_ALLOWED_ORIGINS` should use explicit origins. Do not use wildcard origins with credentialed browser access.

## Demo fallback mode

The Vue `/map` shell includes deterministic demo fallback mode.

Fallback mode exists so the product surface remains usable in a browser when the fixture-backed OSM Map API is offline or unavailable.

Fallback mode must remain visibly labeled and must not be represented as a production data plane.

Fallback mode covers:

- demo map layer;
- OSM feature binding;
- H3 lookup;
- advisory route graph;
- runtime-boundary state;
- governance state;
- Sherlock evidence.

Fallback mode does not authorize:

- safety-critical navigation;
- dispatch authority;
- live route guidance;
- production tile serving;
- Lattice RuntimeAsset admission.

## Verification

The Vue shell product verification is scoped to:

```bash
cd socioprophet-web/client-vue
npm install
npm run typecheck
npm run build
```

The scoped workflow should remain:

```text
client-vue-product-build
```

It should verify only the Vue app shell and should not run Storybook.

## Storybook and salvaged screens

Storybook and salvaged screen work are reference material only until separately normalized.

They must not be part of the product build gate for the Vue shell.

If Storybook is reintroduced later, it should be in a separate PR with a dedicated Storybook verification strategy.

## Identity boundary

Release-1 can run as a preview or semi-authenticated shell depending on deployment target.

Future identity/session handoff should support:

- public marketing unauthenticated;
- app shell authenticated or project-scoped;
- connected login between surfaces;
- device/project/org membership later.

Identity integration is explicitly out of scope for the current Vue promotion PR.

## Hosting candidates

Acceptable future hosting targets include:

- separate Firebase Hosting site for app shell;
- app subdomain such as `app.<domain>`;
- Cloud Run serving static app assets behind gateway routes;
- static object hosting behind a controlled CDN/gateway.

The deployment implementation should be chosen in a follow-up PR. This decision record does not change deployment behavior.

## Acceptance criteria for implementation

A future deployment PR should prove:

1. Marketing/docs build is independent from app shell build.
2. Vue app shell build is independently verified.
3. `/map` route is served by the app shell.
4. `VITE_GAIA_MAP_API_BASE` is set per environment.
5. API CORS or gateway routing permits only intended origins.
6. Demo fallback remains visible and advisory-only.
7. Storybook remains excluded from product build unless separately normalized.

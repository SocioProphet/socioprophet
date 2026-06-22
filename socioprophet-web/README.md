# socioprophet-web

This directory contains the SocioProphet web surfaces that currently sit inside the `SocioProphet/socioprophet` integration repository.

The active migration direction is **React to Vue**.

The canonical product/app shell is:

```text
socioprophet-web/client-vue
```

The older React client remains available as a legacy behavioral reference during transition. Do not start new product-shell work in the React client unless a later decision record explicitly reverses this migration direction.

## Current surface map

| Path | Status | Description |
| --- | --- | --- |
| `client-vue/` | canonical product shell | Vue 3 + Vite app/workbench shell for `/map`, domain routes, runtime-adapter surfaces, and future product dashboards. |
| `client/` | legacy/reference | React 18 + TypeScript SPA bundled with Webpack. Preserve as behavioral/visual reference until Vue parity and deprecation are explicitly accepted. |
| `server/` | legacy/reference backend | Express server that exposes `/api/feed/rss`; useful as historical/reference API wiring unless separately modernized. |
| `scripts/` | legacy web helpers | Shell helpers used by earlier root Makefile workflows. Review before reusing for Vue work. |
| `docs/` | decision and migration records | Placement for app-shell deployment split, GAIA map promotion plan, and mdheller consolidation audit. |

## Canonical Vue shell

Use `client-vue/` for new product-shell work.

```bash
cd socioprophet-web/client-vue
npm install
npm run typecheck
npm test
npm run build
```

The scoped CI workflow for this surface is:

```text
client-vue-product-build
```

It verifies only the Vue product shell and should not be expanded to Storybook, marketing/docs, or unrelated repo surfaces without a separate decision.

Current route ownership for the Vue shell includes app/workbench routes such as:

- `/map`
- `/news`
- `/law/*`
- `/people/*`
- `/economy/*`
- `/markets/*`
- `/weather/*`
- `/analytics/*`

Additional product-dashboard routes should be added under `client-vue/` only after checking the consolidation audit and preserving read-only/mock-boundary posture where backend integration is not yet real.

## React client posture

`client/` is not the future product-shell target.

Keep it available while migrating because it still documents useful historical behavior:

- top domain navigation;
- secondary tab row;
- left rail;
- breadcrumb/stage layout;
- ticker/feed affordances;
- older Express API proxy expectations.

Do not delete or relocate the React client until a dedicated deprecation PR proves Vue parity or records the remaining intentional gaps.

## Server posture

`server/` exposes the historical Express RSS endpoint:

- `GET /api/feed/rss`
  - returns a JSON array of items: `{ title, link }`;
  - historically sourced from `https://hnrss.org/newest`;
  - cached in memory.

The current Vue product shell should not assume this server is the canonical backend for future product surfaces. Backend/runtime contracts belong in the owning subsystem repos unless this repo is only rendering fixture-backed or evidence-backed state.

## Migration and retirement records

Start with these records before moving additional work:

- `docs/MDHELLER_SOCIOPROPHET_WEB_CONSOLIDATION_AUDIT.md`
- `docs/GAIA_MAP_VUE_SHELL_PROMOTION_PLAN.md`
- `docs/CLIENT_VUE_DEPLOYMENT_SPLIT.md`
- `client-vue/README.md`

The consolidation audit is the control ledger for retiring `mdheller/socioprophet-web` as an active staging repo. It classifies source work as already promoted, replay-needed, superseded, reference-only, or do-not-transfer.

## Development guidance

For Vue product work:

```bash
cd socioprophet-web/client-vue
cp .env.example .env.local
npm install
npm run dev
```

For React legacy reference only:

```bash
cd socioprophet-web/client
cp .env.example .env
# set REACT_PORT and NODE_PORT if running the old shell
```

For the old Express server only:

```bash
cd socioprophet-web/server
cp .env.example .env
# set PORT if running the old server
```

## Non-goals

This README update does not:

- delete or move the React client;
- change deployment behavior;
- promote any `mdheller/socioprophet-web` code by itself;
- authorize real backend/device/runtime authority from mock UI state;
- make the historical Express RSS server the future app backend.

## Placement rule

Use this repository for public web surfaces, app-shell integration, and product-facing evidence/workbench UI. Do not assume it is the canonical home for subsystem-owned schemas, runtime behavior, or backend contracts.

As a working rule:

- Vue app/workbench UI -> `socioprophet-web/client-vue`
- old React behavior -> `socioprophet-web/client` as legacy/reference
- product-shell migration records -> `socioprophet-web/docs`
- subsystem runtime/control-plane specifics -> owning subsystem repo
- marketing/docs/public static site -> existing marketing/docs surface, not `client-vue`

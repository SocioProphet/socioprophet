# ProCybernetica dashboard scaffold

This view is the first customer-facing scaffold for the ProCybernetica alignment dashboard.

## Intended route

This view is intended to be mounted at:

- `/procybernetica`

## Client wiring in this branch

The dashboard is wired in this branch with the following client changes:

- `src/routes.js` – import `ProCyberneticaDashboard` and add the `/procybernetica` route.
- Optional: add a header navigation link once the route is active.

## Data source

The view expects the Socioprophet server to expose:

- `GET /api/procybernetica/dashboard`

That endpoint is scaffolded in `server/src/routes/api/procybernetica-dashboard-route.ts` and is designed to proxy a Sherlock-search deployment.

## Why this sits in `socioprophet-web/client`

The actual UI surface in this repo is a React 18 + TypeScript SPA, not a Vue app. This dashboard therefore belongs here unless a separate frontend shell is later introduced.

# ProCybernetica dashboard scaffold

This view is the first customer-facing scaffold for the ProCybernetica alignment dashboard.

## Intended route

This view is intended to be mounted at:

- `/procybernetica`

## Required follow-up wiring

Because the current GitHub connector path used for this scaffold can create new files but does not expose a clean patch path for existing files in this turn, the following existing files still need one follow-up edit:

- `src/routes.js` – import `ProCyberneticaDashboard` and add the `/procybernetica` route.
- optional: add a header navigation link once the route is active.

## Data source

The view expects the Socioprophet server to expose:

- `GET /api/procybernetica/dashboard`

That endpoint is scaffolded in `server/src/routes/api/procybernetica-dashboard-route.ts` and is designed to proxy a Sherlock-search deployment.

## Why this sits in `socioprophet-web/client`

The actual UI surface in this repo is a React 18 + TypeScript SPA, not a Vue app. This dashboard therefore belongs here unless a separate frontend shell is later introduced.

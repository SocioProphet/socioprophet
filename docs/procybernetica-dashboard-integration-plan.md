# ProCybernetica dashboard integration plan

## What is already staged on this branch

- `socioprophet-web/client/src/views/procyberneticaDashboard/ProCyberneticaDashboard.tsx`
- `socioprophet-web/client/src/views/procyberneticaDashboard/styles.tsx`
- `socioprophet-web/client/src/views/procyberneticaDashboard/README.md`
- `socioprophet-web/server/src/routes/api/procybernetica-dashboard-route.ts`

## Remaining edits required to activate the scaffold

### 1. Register the client route

Edit `socioprophet-web/client/src/routes.js`.

Add:

```js
import ProCyberneticaDashboard from './views/procyberneticaDashboard/ProCyberneticaDashboard';
```

Then add a route object:

```js
{ path: '/procybernetica', element: <ProCyberneticaDashboard /> },
```

### 2. Mount the server proxy route

Edit `socioprophet-web/server/src/server.ts`.

Add:

```ts
const proCyberneticaRouter = require('./routes/api/procybernetica-dashboard-route');
```

Then mount:

```ts
app.use('/api/procybernetica', proCyberneticaRouter);
```

### 3. Runtime configuration

Set on the server runtime:

```bash
SHERLOCK_SEARCH_BASE_URL=https://<your-sherlock-service-host>
```

The route expects Sherlock-search to expose:

- `GET /api/procybernetica/dashboard`

## Architectural split

- `SocioProphet/sherlock-search` owns the search/discovery and payload contract side.
- `SocioProphet/socioprophet` owns the customer-facing React UI and thin server proxy.

## Why the route is not already patched in this branch

This branch was created through the GitHub connector path used in chat. In this turn, the connector path available for this repo allowed clean creation of new files, but not a clean in-place patch flow for the existing route registry and server mount files. This note preserves the exact remaining delta so a final follow-up patch can be landed quickly.

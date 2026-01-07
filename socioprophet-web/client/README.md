# Client

The SocioProphet frontend is a **React 18** single-page application written in **TypeScript** and bundled with **Webpack**. It renders the marketing site and consumes the backend RSS API for the ticker banner.

## High-level responsibilities

- Render the landing page, legal pages, and 404 page.
- Provide global layout components (header/footer).
- Fetch `/api/feed/rss` and display the feed in a scrolling ticker.

## Directory layout

| Path | Description |
| --- | --- |
| `src/` | React source code (components, views, routing, styling). |
| `public/` | HTML template and static assets. |
| `webpack.config.js` | Webpack build + dev server configuration. |
| `babel.config.js` | Babel configuration for React + TS. |
| `tsconfig.json` | TypeScript compiler options (type checking only). |
| `Dockerfile` | Container build (builds and serves with Nginx). |
| `.env.example` | Environment variable template. |
| `package.json` | Scripts, dependencies, metadata. |

## Entry points

- `src/index.tsx` – Mounts the React root into the DOM.
- `src/App.tsx` – Global styles + router.
- `src/routes.js` – Route table for `react-router-dom`.

## Environment variables

Create `client/.env` (see `.env.example`).

| Variable | Required | Description |
| --- | --- | --- |
| `REACT_PORT` | ✅ | Port for the Webpack dev server. |
| `NODE_PORT` | ✅ | Port that the backend server listens on; used to proxy `/api` requests. |

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| Start dev server | `yarn start` | Runs `webpack-dev-server` in development mode. |
| Build production bundle | `yarn build` | Outputs static assets to `client/build/`. |
| Launch in browser | `yarn launch` | Starts dev server and opens the browser. |

## Routing

Routing is configured in `src/routes.js` and wired into `<Routes>` in `src/App.tsx`.

| Path | View component | Description |
| --- | --- | --- |
| `/` | `views/landing/Landing` | Primary landing page. |
| `/terms-of-use` | `views/legal/Terms` | Terms of Use page. |
| `/privacy-policy` | `views/legal/Privacy` | Privacy Policy page. |
| `*` | `views/notFound/NotFound` | 404 fallback. |

## Styling

- Uses **styled-components** for most layout and typography.
- Global CSS resets and typography are defined in `src/globalStyles.tsx`.
- Component-specific styles live in adjacent `styles.tsx` files.

## Data flow (RSS ticker)

1. `TickerFeed` calls `/api/feed/rss` on mount.
2. The response is mapped into link elements.
3. `react-ticker` animates the scrolling display.

See `src/components/tickerFeed/` for implementation details.

## Static assets

- Asset files live under `public/` and `public/images`.
- Webpack copies assets during build based on imports in components and the HTML template.

## Docker build notes

The `Dockerfile` performs a two-stage build:

1. Builds the React app with Node 18 Alpine.
2. Serves the static build with Nginx.

> The Dockerfile expects `client/nginx/nginx.conf` to exist. Ensure that file is present before building or update the Dockerfile accordingly.

## Further documentation

- `src/README.md` – source tree overview
- `src/components/**/README.md` – component-level documentation
- `src/views/**/README.md` – page-level documentation

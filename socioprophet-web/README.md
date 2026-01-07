# socioprophet-web

This directory contains the **entire SocioProphet web application**, split into a frontend SPA and a backend API. Use this README for operational details; component-level documentation lives in subdirectories.

## Repository structure

| Path | Description |
| --- | --- |
| `client/` | React 18 + TypeScript SPA bundled with Webpack. |
| `server/` | Express server that exposes `/api/feed/rss`. |
| `scripts/` | Shell helpers used by the root `Makefile`. |

## Quick start (development)

```bash
# from /workspace/socioprophet
make install_web
make run_web
```

### What runs where

| Service | Default runtime | Notes |
| --- | --- | --- |
| Client | Webpack dev server | Configured in `client/webpack.config.js`. |
| Server | Express | Entry point: `server/src/server.ts`. |

## Environment variables

Create `.env` files in **both** subprojects.

### Client (`client/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `REACT_PORT` | ✅ | Port for the dev server (`webpack-dev-server`). |
| `NODE_PORT` | ✅ | Target port for API proxying (`/api`). |

### Server (`server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | ✅ | HTTP port for the Express server. |

## API overview

The backend exposes one API namespace:

- `GET /api/feed/rss`
  - Returns a JSON array of items: `{ title, link }`.
  - Sourced from `https://hnrss.org/newest` (Hacker News RSS).
  - Cached for **10 minutes** in-memory using `node-cache`.

The client fetches this endpoint in the ticker banner (`client/src/components/tickerFeed`).

## Development workflows

### Install dependencies

```bash
cd scripts
bash install_web.sh
```

### Run client + server together

```bash
cd scripts
bash run_web.sh
```

### Run projects individually

```bash
cd client
cp .env.example .env
# set REACT_PORT and NODE_PORT

yarn

yarn start
```

```bash
cd server
cp .env.example .env
# set PORT

yarn

yarn run dev
```

## Docker builds

Both subprojects include Dockerfiles. They are **not** wired together with a `docker-compose.yml`.

### Client container

- Build stage uses `node:18-alpine`, runs `yarn build`.
- Runtime stage uses `nginx:stable-alpine`.
- Copies `/build` output to `/usr/share/nginx/html`.
- Exposes port **80**.
- The Dockerfile expects an `nginx/nginx.conf` file under the client directory.

### Server container

- Uses `node:18-alpine`.
- Installs dependencies and runs `yarn start`.
- Exposes whatever `PORT` is configured at runtime.

## Where to find detailed documentation

Each directory ships with its own README. Start here:

- `client/README.md`
- `server/README.md`
- `scripts/README.md`
- `client/src/**/README.md`
- `server/src/**/README.md`

## Notes

- `node_modules/` directories are included in this workspace but are not part of documentation updates.
- The server uses CommonJS `require` syntax inside TypeScript for consistency; follow the existing patterns unless you explicitly refactor.

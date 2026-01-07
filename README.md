# SocioProphet Web (monorepo wrapper)

This repository contains the **full SocioProphet web stack**. The actual application lives under the `socioprophet-web/` folder and is split into a React frontend and an Express backend. The root folder only provides shared workflow helpers (Makefile, scripts) and high-level documentation.

> **Repository goal:** provide a working local development environment for the SocioProphet marketing site and its supporting RSS feed API.

## Repository layout (top level)

| Path | Description |
| --- | --- |
| `README.md` | This file. Overview and workspace instructions. |
| `CONTRIBUTING.md` | Contribution guidelines (style, workflow expectations). |
| `Makefile` | Convenience commands that delegate to scripts in `socioprophet-web/scripts/`. |
| `socioprophet-web/` | **Primary application code** (client, server, scripts). See that directory’s README for full details. |

## Prerequisites

- **Node.js 18+** (the codebase uses Node 18 tooling and APIs).
- **Yarn** package manager.
- **GNU Make** (for running top-level `make` targets).
- **Bash** (scripts are bash). 

## Quick start (recommended)

```bash
# from /workspace/socioprophet
make install_web
make run_web
```

What this does:
1. Installs dependencies in `socioprophet-web/client` and `socioprophet-web/server`.
2. Starts the backend with `yarn run dev` and the frontend with `yarn start`.

## Manual start (no Makefile)

```bash
cd socioprophet-web/client
cp .env.example .env
# set REACT_PORT and NODE_PORT inside .env

yarn

yarn start
```

```bash
cd socioprophet-web/server
cp .env.example .env
# set PORT inside .env

yarn

yarn run dev
```

## Environment variables

Create `.env` files in the **client** and **server** folders.

### Client (`socioprophet-web/client/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `REACT_PORT` | ✅ | Port for the Webpack dev server (e.g., `3000`). |
| `NODE_PORT` | ✅ | Port where the server is running (used for `/api` proxy). |

### Server (`socioprophet-web/server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | ✅ | Port that the Express server listens on (e.g., `3001`). |

## How the system fits together

- The **client** is a React SPA (single-page app) served by Webpack in development.
- The **server** is a lightweight Express API that fetches the Hacker News RSS feed and returns JSON.
- The client makes requests to `/api/feed/rss`, which is proxied to the server when running locally.

## Common tasks

| Task | Command | Where |
| --- | --- | --- |
| Install dependencies | `make install_web` | repo root |
| Run both apps | `make run_web` | repo root |
| Run client only | `yarn start` | `socioprophet-web/client` |
| Run server only | `yarn run dev` | `socioprophet-web/server` |

## Where to find more documentation

The project is intentionally verbose about documentation. Each major folder has its own README:

- `socioprophet-web/README.md` – app-level documentation
- `socioprophet-web/client/README.md` – frontend guide
- `socioprophet-web/server/README.md` – backend guide
- `socioprophet-web/scripts/README.md` – helper scripts
- `socioprophet-web/client/src/**/README.md` – component-level notes
- `socioprophet-web/server/src/**/README.md` – server source notes

## Notes and gotchas

- The root `Makefile` assumes a Unix-like shell environment (Bash).
- Both apps are expected to run **concurrently** in development. Ensure ports do not conflict.
- The client uses a Webpack dev server; it is not preconfigured for production SSR.
- Dockerfiles exist in the client/server directories for container builds (see their READMEs for details).

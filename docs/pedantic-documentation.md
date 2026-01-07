# SocioProphet Repository Documentation (Pedantic)

## 0. Purpose and Scope
This repository contains the source code and tooling for the SocioProphet web application. The codebase is split into a browser client (React/TypeScript) and a server (Node/Express) that currently proxies and caches a Hacker News RSS feed for the website’s scrolling ticker. This document is intentionally exhaustive: it describes *what exists*, *why it exists*, and *how the pieces fit together*.

> **What this is not:** This repository does not currently contain any API definitions or business logic beyond the RSS feed proxying/ticker support. Any references to “TriTRPC” or other systems are not present in this codebase.

## 1. Repository Layout
```
.
├── CONTRIBUTING.md
├── Makefile
├── README.md
├── docs/
│   └── pedantic-documentation.md
└── socioprophet-web/
    ├── client/                 # React 18 + TypeScript UI
    ├── server/                 # Express server serving RSS data
    └── scripts/                # Shell helpers used by the Makefile
```

### 1.1 Root Files
- **README.md**: quickstart, high-level description, and make targets.
- **CONTRIBUTING.md**: contribution guidance.
- **Makefile**: convenience targets for installing dependencies and running the app.

### 1.2 `socioprophet-web/` Subtree
- **client/**: React 18 app using TypeScript, Webpack, and Styled Components.
- **server/**: Express server that fetches and caches the Hacker News RSS feed.
- **scripts/**: shell scripts invoked by the Makefile.

## 2. Theory and Design Rationale
This project uses a classic **client/server split**. The theory behind this choice is to separate concerns:

1. **Separation of responsibilities**
   - The **client** focuses exclusively on presentation and user experience.
   - The **server** centralizes integration with external data sources (Hacker News RSS), providing a stable API for the client.

2. **Reduced browser responsibilities**
   - Browsers are limited in cross-origin requests and can be blocked by CORS. By routing external data fetches through an Express server, you minimize CORS and security complexity for the client.

3. **Cache locality and performance**
   - The server caches RSS responses with a TTL. This prevents repeated hits to the external RSS endpoint and stabilizes the data rate consumed by clients. Caching is done in-process to keep latency and configuration overhead low.

4. **Security and operational hygiene**
   - Middleware like `helmet`, `compression`, `cookie-parser`, and `cors` provide a baseline security and performance posture. The theory is to **opt into default hardening** rather than needing to add protections ad hoc later.

In short: *theory = isolate external data access and caching in a minimal server layer, while keeping the client UI focused and responsive.*

## 3. Client Application (`socioprophet-web/client/`)

### 3.1 Entry Points
- **`src/index.tsx`**: React entry point that mounts the app to the DOM.
- **`src/App.tsx`**: top-level application component.

### 3.2 UI Organization
- **`src/components/`**: reusable UI components.
- **`src/views/`**: higher-level screens or routes.
- **`src/globalStyles.tsx`**: global styling (Styled Components).
- **`src/constants/`**: client-side constants.

### 3.3 Routing
- **`src/routes.js`** and **`src/routes.d.ts`** define route configuration and typings.

### 3.4 Theory: UI Layering
The UI is layered with a “components” and “views” split. This aligns with a common UI architecture where:
- **Components** are reusable, low-level building blocks.
- **Views** are compositional containers that bind data to components.

This reduces coupling and keeps stateful orchestration (e.g., data fetching, view-specific layout) out of reusable UI primitives.

## 4. Server Application (`socioprophet-web/server/`)

### 4.1 Entry Point
- **`src/server.ts`**: configures middleware and registers routes.

Key middleware used:
- `cookie-session`: simple session support for future stateful interactions.
- `cors`: cross-origin request support for the client.
- `helmet`: secure HTTP headers.
- `compression`: gzip responses to reduce payload size.
- `express.json` / `express.urlencoded`: request parsing.
- `cookie-parser`: cookie parsing.

### 4.2 RSS Feed Route
- **`src/routes/api/rss-route.ts`**: fetches and caches the Hacker News RSS feed.

Request path:
- `GET /api/feed/rss`

Behavior:
1. Check in-memory cache (node-cache) for `HN_URL`.
2. If cached, return cached items.
3. If not cached, fetch RSS feed, parse XML via `jsdom`, extract `<item>` nodes, and cache results.

### 4.3 Theory: Simple Server-Side Cache
The server uses a memory cache with a TTL to balance:
- **Freshness**: The TTL ensures data is updated regularly.
- **Rate limiting**: Reduces the frequency of external requests.
- **Latency**: Allows instant response for repeated client requests within the TTL window.

This cache strategy is intentionally simple because the data is read-only and small; a full external cache (Redis) would add operational overhead without clear benefit.

## 5. Configuration & Environment Variables
The server loads environment variables from `.env` in non-production environments (`dotenv`).

### 5.1 Expected Files
- **`socioprophet-web/client/.env`** (see `.env.example` for client variables)
- **`socioprophet-web/server/.env`** (see `.env.examples` for server variables)

### 5.2 Theory: Environment Separation
Keeping environment values in `.env` files prevents hardcoding secrets into the repository and makes it easy to switch between local/dev/prod contexts.

## 6. Build, Install, and Run

### 6.1 Make Targets
The root `Makefile` provides two targets:
- `make install_web` → runs `socioprophet-web/scripts/install_web.sh`
- `make run_web` → runs `socioprophet-web/scripts/run_web.sh`

### 6.2 Theory: Make as a Thin Orchestration Layer
Make is used here as a lightweight command dispatcher. This keeps complexity out of developer workflows, allowing consistent local setup without requiring contributors to remember detailed commands.

## 7. Data Flow Summary
```
Browser (React client)
       |
       |  GET /api/feed/rss
       v
Express server (rss-route.ts)
       |
       |  fetch HN_URL
       v
External RSS endpoint (Hacker News)
```

Key points:
- Client never fetches the RSS URL directly.
- Server caches and normalizes data into `{ title, link }` pairs.

## 8. Operational Notes
- The server listens on `process.env.PORT`; ensure it is set in the server `.env`.
- The server handles `SIGINT` and closes the HTTP server for graceful shutdown.

## 9. Extension Points
Possible future evolution paths, aligned with the existing structure:
- Replace in-memory cache with Redis if scaling becomes necessary.
- Add server endpoints for additional data sources (e.g., other feeds).
- Implement client-side error handling/loading states around RSS consumption.

## 10. Glossary
- **RSS**: XML-based syndication format for updates.
- **TTL**: Time-to-live; duration before a cached entry is expired.
- **CORS**: Cross-Origin Resource Sharing; a browser security policy.

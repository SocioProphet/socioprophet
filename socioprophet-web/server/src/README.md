# Server Source

This directory contains the runtime source for the Express server. The code is intentionally small and focused on a single API endpoint.

## Top-level layout

| Path | Purpose |
| --- | --- |
| `server.ts` | Entry point; registers middleware and mounts routes. |
| `routes/` | Express routers grouped by feature area. |
| `constants/` | Shared constants (URLs, configuration values). |

## Execution flow (startup)

1. If `NODE_ENV` is not `production`, loads `.env` with `dotenv`.
2. Creates an Express `app` instance.
3. Registers middleware (sessions, CORS, security, compression, parsers).
4. Mounts API routes at `/api/feed`.
5. Starts listening on `process.env.PORT`.
6. Handles `SIGINT` for graceful shutdown.

## Conventions

- Use CommonJS `require` in TypeScript files to match existing modules.
- Keep route handlers small and delegate shared values to `constants/`.
- Prefer stateless route handlers with explicit input/output.

## Where to look next

- `routes/README.md` – router layout and conventions
- `routes/api/README.md` – the RSS endpoint details
- `constants/README.md` – shared constants

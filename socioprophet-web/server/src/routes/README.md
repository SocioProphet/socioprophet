# Server Routes

Contains Express routers grouped by API namespace.

## Structure

| Path | Description |
| --- | --- |
| `api/` | Endpoints intended for client consumption. |

## Conventions

- Each router should focus on a single resource or feature.
- Export routers with `module.exports = router` to match current usage.
- Mount routers in `src/server.ts` to keep route wiring centralized.

## Current routers

- `api/rss-route.ts` – Hacker News RSS JSON endpoint.

# Server

The server is a **lightweight Express API** that provides the RSS feed data consumed by the frontend ticker. It performs a single upstream fetch, normalizes the data into JSON, and caches responses for performance.

## Responsibilities

- Fetch Hacker News RSS (`https://hnrss.org/newest`).
- Convert XML to JSON (array of `{ title, link }`).
- Cache responses for 10 minutes.
- Expose the API at `/api/feed/rss`.

## Directory layout

| Path | Description |
| --- | --- |
| `src/` | Server source code (entry point, routes, constants). |
| `Dockerfile` | Container build for the API server. |
| `.env.example` | Example environment variables. |
| `package.json` | Scripts and dependencies. |
| `tsconfig.json` | TypeScript configuration. |

## Entry point

- `src/server.ts` – Configures Express middleware and mounts `/api/feed` routes.

## Environment variables

Create `server/.env` (see `.env.example`).

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | ✅ | Port the Express server listens on. |

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| Start | `yarn start` | Runs the server directly with Node. |
| Dev | `yarn run dev` | Runs the server with `nodemon`. |

## Middleware stack (order matters)

`src/server.ts` registers middleware in this order:

1. `cookie-session` – session cookies.
2. `cors` – allows cross-origin requests.
3. `helmet` – security headers.
4. `compression` – gzip compression.
5. `express.json` – JSON parsing.
6. `express.urlencoded` – URL-encoded parsing.
7. `cookie-parser` – cookie parsing.

## API routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/feed/rss` | GET | Returns cached JSON from the HN RSS feed. |

For implementation details, see `src/routes/api/rss-route.ts` and its README.

## Caching behavior

- Uses `node-cache` with a **600 second** TTL.
- Cache key = `HN_URL` constant.
- If cache is present, no upstream request is made.

## Docker notes

- Base image: `node:18-alpine`.
- The container runs `yarn start`.
- Ensure `PORT` is configured at runtime.

## Further documentation

- `src/README.md` – overview of server source structure
- `src/routes/README.md` – route-level conventions
- `src/routes/api/README.md` – API-specific notes
- `src/constants/README.md` – shared constants

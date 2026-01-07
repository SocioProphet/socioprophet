# API Routes

Defines API endpoints that the frontend consumes. This layer fetches upstream data, normalizes it to JSON, and returns a minimal payload to the client.

## Current endpoints

| Method | Path | Response | Source |
| --- | --- | --- | --- |
| GET | `/api/feed/rss` | `[{ title, link }, ...]` | `https://hnrss.org/newest` |

## Implementation details (`rss-route.ts`)

- Fetches XML from `HN_URL` (defined in `src/constants/index.js`).
- Uses `jsdom` to parse the RSS response into DOM nodes.
- Extracts `<title>` and `<link>` from each `<item>`.
- Stores the normalized array in `node-cache` for 10 minutes.
- Returns cached data if available to avoid hitting the upstream endpoint.

## Error handling

- The current implementation does not explicitly handle fetch failures.
- If you add additional endpoints, consider:
  - `try/catch` around upstream calls.
  - Status code and error payload conventions.
  - Cache invalidation policies.

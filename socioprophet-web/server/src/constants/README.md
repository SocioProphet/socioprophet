# Server Constants

Centralized constants used by server modules, keeping magic strings and URLs in one place.

## Files

| File | Description |
| --- | --- |
| `index.js` | Exports shared constants (currently only `HN_URL`). |

## Current constants

| Constant | Value | Used by |
| --- | --- | --- |
| `HN_URL` | `https://hnrss.org/newest` | `src/routes/api/rss-route.ts` |

## Guidance

- Add new shared values here rather than duplicating them in route modules.
- Keep naming uppercase and descriptive (e.g., `EXTERNAL_API_URL`).

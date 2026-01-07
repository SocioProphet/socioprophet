# TickerFeed Component

## Purpose
Fetches the RSS feed from the backend and streams it across the top of the page.

## Key Files
- `TickerFeed.tsx` – Fetches `/api/feed/rss`, stores the response in component state, and renders the ticker.
- `RssFeedData.tsx` – Maps feed items to clickable links.
- `types.ts` – Type definitions for the RSS feed payload shape.
- `styles.tsx` – Styled-components for ticker layout and typography.
- `index.ts` – Barrel export for the component.

## Responsibilities
- Fetch the RSS JSON payload from the server on mount.
- Guard against updates after unmount by tracking a `mounted` flag.
- Display the ticker only when feed data is available.

## Dependencies
- `react-ticker` provides the scrolling animation.

## Notes
- The server endpoint is expected to return `[{ title, link }, ...]`.
- If the server route changes, update the fetch path in `TickerFeed.tsx`.

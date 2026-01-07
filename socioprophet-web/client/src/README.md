# Client Source

This directory contains the **entire React application**. It is organized by entry points, route-level views, and reusable components, with styling co-located via styled-components.

## File inventory (top level)

| File/Folder | Purpose |
| --- | --- |
| `index.tsx` | React entry point; mounts `<App />` into `#root`. |
| `App.tsx` | Router container and `GlobalStyles`. |
| `routes.js` | Route map for the SPA. |
| `routes.d.ts` | Type definitions for `routes.js`. |
| `globalStyles.tsx` | Global CSS and base typography via styled-components. |
| `components/` | Reusable UI building blocks. |
| `views/` | Page-level compositions that map to routes. |
| `constants/` | Shared constants (links and URLs). |

## Routing flow

1. `routes.js` defines the array of routes.
2. `App.tsx` maps that array into `<Route />` components.
3. Each route points to a view under `views/`.

## Styling approach

- **Global styles:** `globalStyles.tsx` sets typography, layout resets, and base colors.
- **Local styles:** Each component/view includes a `styles.tsx` file with styled-components.

## Components

The `components/` directory has dedicated READMEs for each component group. Start with:

- `components/README.md` – index of component groups
- `components/header/README.md` – header navigation
- `components/tickerFeed/README.md` – RSS ticker logic

## Views

Views are page-level and should avoid embedding reusable elements directly. The view READMEs describe layout and ownership:

- `views/README.md`
- `views/landing/README.md`
- `views/legal/README.md`
- `views/notFound/README.md`

## Constants

- `constants/urls.ts` maps named links (e.g., Terms, Privacy, GitHub, Blog) to their destinations.
- Update URLs here instead of hardcoding them in components.

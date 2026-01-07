# Components

Reusable UI building blocks for the SocioProphet frontend. Each component group has its own directory with implementation (`*.tsx`) and styles (`styles.tsx`), plus a dedicated README with details.

## Component index

| Component | Purpose | Key files |
| --- | --- | --- |
| `header/` | Fixed top navigation with brand title and external links. | `Header.tsx`, `styles.tsx` |
| `footer/` | Footer navigation and copyright line. | `Footer.tsx`, `FooterLink.tsx`, `styles.tsx` |
| `headerLink/` | Consistent link styling for header navigation. | `HeaderLink.tsx`, `styles.tsx` |
| `logo/` | Renders the hero logo image. | `Logo.tsx`, `styles.tsx` |
| `main/` | Landing page hero + about sections. | `MainHero.tsx`, `MainAbout.tsx`, `styles.tsx` |
| `featureItem/` | Individual feature card used by the landing page. | `FeatureItem.tsx`, `styles.tsx` |
| `tickerFeed/` | Fetches and renders the scrolling RSS ticker. | `TickerFeed.tsx`, `RssFeedData.tsx`, `styles.tsx`, `types.ts` |

## Conventions

- **Co-location:** JSX and styled-components are kept together in each component directory.
- **Props:** Components are typed explicitly (see `FeatureItem` and `TickerFeed` for examples).
- **Routing:** Components do *not* create routes; routing is handled by `src/routes.js`.

## How to add a new component

1. Create a new folder under `components/`.
2. Add `ComponentName.tsx` and `styles.tsx`.
3. Add a `README.md` documenting the component’s responsibilities and props.
4. Export the component (optionally via an `index.ts`).

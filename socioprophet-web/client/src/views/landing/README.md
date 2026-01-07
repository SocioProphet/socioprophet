# Landing View

## Purpose
Home page composition for the SocioProphet site.

## Key Files
- `Landing.tsx` – Assembles the page using shared components.

## Layout Composition
1. `Header` – Fixed top navigation.
2. `TickerFeed` – RSS ticker just below the header.
3. `MainHero` – Hero section with logo and tagline.
4. `MainAbout` – Feature summary cards.
5. `Footer` – Footer navigation and copyright line.

## Notes
- This view is mapped to `/` in `src/routes.js`.
- Visual styling lives within the component-level `styles.tsx` files rather than here.

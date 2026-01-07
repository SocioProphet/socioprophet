# Header Component

## Purpose
Renders the fixed top navigation bar with the SocioProphet title and external links.

## Key Files
- `Header.tsx` – Layout for the nav, title link, and external link group.
- `styles.tsx` – Styled-components for the header layout, title, and link container.

## Responsibilities
- Display the site title linking to the root (`/`).
- Expose external links defined in `src/constants/urls.ts` (GitHub, Wiki, Blog).
- Keep the header fixed and visible above other content (`z-index` usage).

## Notes
- The component uses `HeaderLink` to standardize link styling.
- Any additional navigation items should be added via `Header.tsx` to keep the link order explicit.

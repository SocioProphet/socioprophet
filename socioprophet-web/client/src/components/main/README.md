# Main Section Components

## Purpose
Hosts the hero and about sections of the landing page.

## Key Files
- `MainHero.tsx` – Renders the hero background and tagline alongside the logo.
- `MainAbout.tsx` – Composes the three feature items below the hero.
- `styles.tsx` – Defines shared layout styles and background imagery.

## Responsibilities
- Apply responsive background images for desktop and mobile.
- Provide layout wrappers for the hero and about sections.
- Keep the landing page copy centralized within these components.

## Notes
- Background images reference assets in `public/images` via imports.
- Content updates should be made in `MainHero.tsx` or `MainAbout.tsx` rather than in `styles.tsx`.

# Footer Component

## Purpose
Provides footer navigation and copyright metadata for the site.

## Key Files
- `Footer.tsx` – Assembles footer links and renders the copyright year.
- `FooterLink.tsx` – Wrapper for internal links using React Router.
- `styles.tsx` – Styled-components for layout, links, and typography.

## Responsibilities
- Provide mail and policy links using `URLS` constants.
- Use internal routing for Privacy and Terms links via `FooterLink`.
- Keep a consistent layout (centered links and copyright line).

## Notes
- External links use `StyledAnchor` to avoid React Router for mailto URLs.
- The copyright year is calculated dynamically.

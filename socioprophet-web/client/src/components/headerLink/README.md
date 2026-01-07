# HeaderLink Component

## Purpose
Small wrapper component used by the header to render navigation links with consistent styling.

## Key Files
- `HeaderLink.tsx` – Renders an anchor element with external or internal target behavior.
- `styles.tsx` – Styled-components for spacing and typography.

## Responsibilities
- Provide a uniform link presentation for the header.
- Apply `_blank` targets for external links while keeping internal links in the same tab.

## Notes
- `HeaderLink` does not use React Router; it always renders a plain `<a>` tag.

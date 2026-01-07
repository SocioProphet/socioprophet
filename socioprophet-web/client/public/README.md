# Public Assets

## Purpose
Static assets and the base HTML shell for the SPA. Webpack copies these files into the build output and serves them directly in development.

## Key Files
- `index.html` – The HTML template containing:
  - Meta tags and SEO keywords.
  - Font loading (Google Fonts, Font Awesome).
  - A loading spinner before React bootstraps.
  - Google Analytics script inclusion.
- `favicon.ico` – Browser favicon.
- `images/` – Image assets used by components.

## Notes
- Changes to `index.html` affect the entire application shell.
- Keep third-party scripts here minimal, as they run before React loads.

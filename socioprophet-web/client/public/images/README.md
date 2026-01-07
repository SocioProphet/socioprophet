# Image Assets

## Purpose
Static imagery used by the frontend for branding, backgrounds, and visuals.

## Asset Inventory
- `mothership-logo.png` – Primary SocioProphet logo; imported by `src/components/logo/Logo.tsx`.
- `mothership-background.jpg` – Desktop hero background; used in `src/components/main/styles.tsx`.
- `dashboard-temp-background.jpg` – Mobile hero background; used in `src/components/main/styles.tsx`.
- `fishCropFinal.gif` – Legacy/unused animation asset (not referenced in `src/`).
- `google-sign-in-light.jpg` – Legacy/unused sign-in graphic (not referenced in `src/`).

## Notes
- Prefer referencing assets via imports in `src/` so Webpack can fingerprint them.
- If unused assets remain unnecessary, consider removing them after confirming they are not referenced in production.

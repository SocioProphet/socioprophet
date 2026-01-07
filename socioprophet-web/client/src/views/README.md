# Views

Views are **route-level** components that map directly to URL paths. Each view composes shared components and owns page layout.

## View index

| View | Route | Purpose | Files |
| --- | --- | --- | --- |
| Landing | `/` | Primary landing page. | `landing/Landing.tsx` |
| Terms | `/terms-of-use` | Terms of Use policy page. | `legal/Terms.tsx` |
| Privacy | `/privacy-policy` | Privacy Policy page. | `legal/Privacy.tsx` |
| Not Found | `*` | 404 fallback. | `notFound/NotFound.tsx` |

## Shared conventions

- Views should avoid duplicating global layout elements; use `Header`, `Footer`, and other shared components.
- Layout styling for a view belongs in the view’s `styles.tsx` file.
- Any static copy that is specific to a page (terms, privacy) lives directly in the view file.

## Where routes are configured

Routes are defined in `src/routes.js` and rendered in `src/App.tsx` via `react-router-dom`.

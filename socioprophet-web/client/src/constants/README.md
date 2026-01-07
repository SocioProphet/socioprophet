# Client Constants

Central location for shared constants used by UI components and views.

## Files

| File | Purpose |
| --- | --- |
| `urls.ts` | Maps labels to URLs and mailto destinations used across the app. |

## Usage

- Imported by the `Header` and `Footer` components.
- Keeps external destinations centralized to avoid duplication.

## Guidance

- Update values here if link destinations change.
- Avoid hardcoding external URLs directly in components.

# Current State

## Repo roles

### Legacy/reference implementation
`/socioprophet-web/client` and `/socioprophet-web/server` are the older React/Webpack/Express implementation line.

This code remains useful as:
- route and information-architecture reference
- design and content reference
- behavioral and backend-semantics reference

It is **not** the forward UI implementation target.

### Forward implementation target
The Vue/Vite shell derived from `mdheller/socioprophet-web` is the forward UI implementation target.

For safety, it is imported side-by-side into:
- `/socioprophet-web/app-vue`

until parity and stabilization are sufficient for cutover.

## Immediate goal

The first production-relevant deliverable of the Vue shell is narrow:

- any `@socioprophet.ai` user can authenticate
- they land in a blank `vue.socioprophet.com` shell
- the shell is stable enough to become the new portal base

## Migration rule

Do not overwrite the legacy React app blindly.
Treat it as a donor/reference source while the Vue shell stabilizes.

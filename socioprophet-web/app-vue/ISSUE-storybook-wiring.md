# Storybook wiring fails with legacy Vite builder name

## Summary
Running Storybook via `yarn dev` fails because the Storybook config forces the legacy Vite builder name (`storybook-builder-vite`). Modern Storybook expects `@storybook/builder-vite` (or the builder is implied by `@storybook/vue3-vite`).

## Current behavior
`storybook dev -p 6006` fails with:

```
Cannot find package 'storybook-builder-vite'
```

## Expected behavior
Storybook should start successfully with the Vue 3 + Vite framework integration.

## Environment
* Repo: `socioprophet-web`
* `package.json` uses ESM: `"type": "module"`
* Storybook dependency: `@storybook/vue3-vite` present

## Root cause
`.storybook/main.*` currently includes:

```
core: { builder: 'storybook-builder-vite' }
```

This legacy package name no longer exists in modern Storybook versions.

## Proposed fix
1. Update `.storybook/main.*` to ESM and set:
   * `framework: { name: '@storybook/vue3-vite', options: {} }`
2. Remove the legacy `core.builder` override entirely.
3. (Optional) Align Storybook package versions to avoid mixed major versions.

## Reproduction
1. `yarn install`
2. `yarn dev`
3. Observe Storybook failure on startup.

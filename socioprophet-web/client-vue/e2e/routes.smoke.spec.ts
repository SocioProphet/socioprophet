import { test, expect, type ConsoleMessage } from '@playwright/test';
import { ALL_ROUTES, UNKNOWN_ROUTE } from './routes';

// Route smoke test: every registered route (see ./routes.ts for how the list
// is assembled from src/main.ts + the nav configs it consumes) must render
// with no browser console errors and no uncaught page errors.
//
// Auth: the dev server has no Firebase apiKey configured, so
// src/stores/auth.ts's DEV_AUTH_BYPASS stubs a signed-in user and the router
// guard in main.ts lets every non-public route through without a real login.
//
// "Rendered" is detected via `.sp-shell`, the one element App.vue always
// renders (topbar + stage + RouterView) regardless of which route/component
// is mounted inside it — no app source or markup was changed to add this
// hook; it already wraps every route unconditionally.
const APP_SHELL = '.sp-shell';

// Benign noise that isn't a client-vue bug. Each entry must be justified —
// this list must NOT grow to swallow real app errors.
const ALLOWED_ERROR_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    // This smoke test's webServer runs ONLY `vite` (see playwright.config.ts) —
    // none of the ~10 backend microservices it proxies to (hellgraph, algo-engine,
    // ie-engine, sherlock, holmes, synapse, the /api data + builder APIs, the
    // /mesh passthrough) are started, in this sandbox or in CI. Every "live"
    // surface that fetches on mount (map, knowledge graph, discovery, model
    // board/tournament, algorithmic trading, economic prophet, provenance, …)
    // therefore gets a connection-refused/502 on its API call, and Chromium's
    // network layer itself — not any app code — logs that as a console error
    // reading exactly "Failed to load resource: <net::ERR_* | status text>".
    // Confirmed by hand for /ai/labs, /analytics/model-board, /knowledge/graph,
    // /discovery, /control-plane/provenance, /economy/value-drivers, /map: in
    // every case this was the ONLY console error, i.e. the Vue component itself
    // rendered fine and degraded gracefully — it just couldn't reach a backend
    // that was never started. The message is Chromium-authored and fixed-form,
    // so it can't accidentally mask a real app error (those read as JS
    // exceptions / "[Vue warn]" / stack traces, never this string).
    pattern: /^Failed to load resource: /,
    reason: 'no backend microservices are started for this frontend-only smoke run (local or CI) — proxied API calls 502/connection-refuse by design, logged by Chromium itself',
  },
];

function isAllowed(text: string): boolean {
  return ALLOWED_ERROR_PATTERNS.some(({ pattern }) => pattern.test(text));
}

async function assertRouteRendersCleanly(page: import('@playwright/test').Page, route: string) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !isAllowed(msg.text())) {
      consoleErrors.push(msg.text());
    }
  };
  const onPageError = (err: Error) => {
    pageErrors.push(err.message);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  try {
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator(APP_SHELL)).toBeVisible();
    // Let any deferred/async render-time console noise (post-networkidle
    // microtasks, e.g. a chart library's next-tick warning) surface too.
    await page.waitForTimeout(250);
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }

  expect(
    pageErrors,
    `route ${route} threw uncaught page error(s):\n${pageErrors.join('\n')}`,
  ).toEqual([]);
  expect(
    consoleErrors,
    `route ${route} logged console error(s):\n${consoleErrors.join('\n')}`,
  ).toEqual([]);
}

for (const route of ALL_ROUTES) {
  test(`route renders cleanly: ${route}`, async ({ page }) => {
    await assertRouteRendersCleanly(page, route);
  });
}

test(`unknown route falls back cleanly: ${UNKNOWN_ROUTE}`, async ({ page }) => {
  await assertRouteRendersCleanly(page, UNKNOWN_ROUTE);
});

test('route inventory is non-trivial', () => {
  // Guards against ./routes.ts silently resolving to an empty/near-empty
  // list (e.g. a broken import) and every test above vacuously "passing".
  expect(ALL_ROUTES.length).toBeGreaterThan(100);
});

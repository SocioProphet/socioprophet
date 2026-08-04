import { defineConfig, devices } from '@playwright/test';

// Fixed port distinct from the interactive dev default (5174) so a smoke-test
// run never collides with (or reuses) a developer's own `npm run dev` session.
const PORT = 5175;
const BASE_URL = `http://localhost:${PORT}`;

// Route smoke test: boots the Vite dev server (auth is bypassed in dev when no
// Firebase apiKey is configured — see src/stores/auth.ts DEV_AUTH_BYPASS) and
// drives a real Chromium instance across every registered route, asserting
// each renders with no console errors / uncaught page errors. No backend
// services (hellgraph, algo-engine, etc.) are started, so any surface that
// depends on one is exercised against a dev server with everything else dark —
// see e2e/routes.smoke.spec.ts for how that's handled.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

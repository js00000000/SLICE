import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

/**
 * Playwright config for the authenticated e2e suite (under e2e-dev/).
 *
 * Two run modes:
 *
 *  1. Local (default) — boots `npm run dev` on port 5173 with NO Firebase env
 *     override, so Vite loads the real dev credentials from .env.local. Requires
 *     a populated .env.local (dev project, easy-split-dev-1cfa3).
 *
 *  2. Remote — when E2E_BASE_URL is set (e.g. in CI after the dev deploy), the
 *     tests run against that already-deployed URL and no local server is
 *     started. The deployed dev site is already built against the dev Firebase
 *     project, so the authenticated flows work the same way.
 *
 * Either way these tests write to the shared dev Firebase project (throwaway
 * anonymous users + groups) and clean up after themselves via the app's Delete
 * Account flow. They run serially.
 */

const remoteBaseURL = process.env.E2E_BASE_URL;
const PORT = 5173;
const baseURL = remoteBaseURL ?? `http://localhost:${PORT}`;

const config: PlaywrightTestConfig = {
  testDir: './e2e-dev',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  // These flows hit the real dev Firebase over the network (sign-in, writes,
  // account deletion in teardown), so allow more than the 30s default.
  timeout: 60_000,
  // Post-mutation assertions wait on a Firestore snapshot round-trip (e.g. an
  // expense/member disappearing after a delete), which can exceed the default
  // 5s. Bump the expect timeout to match the network reality of this suite.
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'en-US',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
};

// Only manage a local dev server when targeting localhost. Against a deployed
// URL there is nothing to start.
if (!remoteBaseURL) {
  config.webServer = {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  };
}

export default defineConfig(config);

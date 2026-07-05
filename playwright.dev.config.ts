import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the authenticated e2e suite (under e2e-dev/).
 *
 * Unlike the default config — which serves the app with dummy Firebase values
 * and only covers the signed-out surface — this one runs `npm run dev` with NO
 * Firebase env override, so Vite loads the real credentials from .env.local
 * (the dev project, easy-split-dev-1cfa3). That lets the tests exercise real
 * anonymous Auth + Firestore flows (Quick Start, adding expenses).
 *
 * NOTE: these tests write to the shared dev Firebase project — they create
 * throwaway anonymous users and groups. Keep them serial and prefer running
 * them deliberately (npm run test:e2e:dev) rather than on every CI push.
 * Requires a populated .env.local (dev credentials) to be present.
 */

const PORT = 5174;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e-dev',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  // These flows hit the real dev Firebase over the network (sign-in, writes,
  // account deletion in teardown), so allow more than the 30s default.
  timeout: 60_000,
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
  webServer: {
    // No `env` override: Vite dev loads .env.local (real dev Firebase config).
    // Dedicated port so it never collides with the signed-out suite on 5173.
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

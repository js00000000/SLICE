import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e config for SLICE.
 *
 * The suite targets the unauthenticated, deterministic surface (landing page,
 * legal pages, client-side routing, i18n). These render without any Firebase
 * network round-trip, so the tests are stable even when the app is built with
 * the dummy `VITE_FIREBASE_*` values used in CI — and they never write test
 * data into the real Firebase project.
 *
 * Authenticated flows (Quick Start / Google login) are intentionally out of
 * scope here: they require live Firebase Auth + Firestore and would pollute the
 * real project. Cover those with the Firebase emulator suite if/when it's added.
 */

const PORT = 5173;
const baseURL = `http://localhost:${PORT}`;

// Dummy Firebase config so `npm run dev` boots even without a local .env.local
// (e.g. in CI). Locally, real values in .env.local take precedence — either way
// the unauthenticated surface renders identically.
const dummyFirebaseEnv = {
  VITE_APP_ENV: 'local',
  VITE_FIREBASE_API_KEY: 'e2e-dummy',
  VITE_FIREBASE_AUTH_DOMAIN: 'e2e-dummy',
  VITE_FIREBASE_PROJECT_ID: 'e2e-dummy',
  VITE_FIREBASE_STORAGE_BUCKET: 'e2e-dummy',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'e2e-dummy',
  VITE_FIREBASE_APP_ID: 'e2e-dummy',
  VITE_FIREBASE_MEASUREMENT_ID: 'e2e-dummy',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: dummyFirebaseEnv,
  },
});

import { test as base, expect, type Page } from '@playwright/test';
import { cleanupCurrentAccount } from './helpers';

/**
 * Shared-account harness for the authenticated dev suite.
 *
 * Previously every test created its own throwaway anonymous account (via
 * quickStart) and deleted it in an afterEach. That churned a fresh Firebase Auth
 * user per test and ran the flaky Delete-Account UI teardown on every single
 * test — and any teardown hiccup (or a test that failed before reaching the
 * delete button) leaked an account + its groups into the shared dev project.
 *
 * The suite runs serially (workers: 1), so instead we sign in ONCE per worker
 * and reuse that account across all tests. Each test still creates its own fresh
 * group (quickStart → GroupSelectionPage "Create") so tests stay isolated from
 * each other's group state. The single shared account is deleted exactly once,
 * at worker teardown, which cascade-deletes every group any test created under
 * it (handleDeleteAccount → cleanupUserData).
 *
 * Why a shared browser context (not per-test contexts + storageState): Firebase
 * persists the anonymous auth session in IndexedDB, which Playwright's
 * storageState does NOT serialize across contexts. Reusing the session
 * therefore requires reusing the same context — hence a worker-scoped page.
 *
 * quick-start.spec.ts intentionally does NOT use this harness: it exercises the
 * signed-out anonymous sign-in flow itself, so it needs its own fresh context
 * (it imports test/expect straight from @playwright/test and cleans up its own
 * account per test).
 */
type WorkerFixtures = {
  sharedPage: Page;
};

// Mirror playwright.dev.config.ts's baseURL: the deployed URL when E2E_BASE_URL
// is set (remote/CI mode), else the local dev server on 5173. A worker-scoped
// fixture can't depend on the test-scoped built-in `baseURL`, so we resolve it
// here rather than reading it off the config.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export const test = base.extend<object, WorkerFixtures>({
  sharedPage: [
    async ({ browser }, use) => {
      // Manually-created context, so pass through the config's baseURL/locale
      // (a hand-rolled context does not inherit `use: {...}` options).
      const context = await browser.newContext({ baseURL, locale: 'en-US' });
      const page = await context.newPage();

      await use(page);

      // One-time teardown for the whole worker: delete the shared anon account,
      // cascading to every group any test created. Best-effort + logged inside
      // cleanupCurrentAccount, so a teardown failure never fails the run.
      await cleanupCurrentAccount(page).catch(() => {});
      await context.close();
    },
    { scope: 'worker' },
  ],

  // Every test runs on the shared, already-authenticated page instead of a fresh
  // per-test context (which would drop the reused anonymous session).
  page: async ({ sharedPage }, use) => {
    await use(sharedPage);
  },
});

export { expect };

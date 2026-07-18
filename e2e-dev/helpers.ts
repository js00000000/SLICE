import { expect, type Page } from '@playwright/test';

/**
 * Drive the Quick Start flow from the landing page and wait until the fresh
 * group dashboard is showing. Returns the created groupId parsed from the URL.
 */
export async function quickStart(page: Page): Promise<string> {
  await page.goto('/');

  const startBtn = page.getByRole('button', { name: 'Start Directly (No Login)' });
  const createInput = page.getByPlaceholder('Enter Group Name');

  // The authenticated suite shares ONE anonymous account across the whole worker
  // (see e2e-dev/fixtures.ts). So the first test lands on the signed-out landing
  // page ("Start Directly", which signs in + auto-creates the group), while
  // every later test is already authenticated and lands on GroupSelectionPage,
  // where we create a fresh group via the "Create" form. Both paths leave us on
  // a brand-new "Untitled Trip" dashboard, so the specs don't care which ran.
  await expect(startBtn.or(createInput).first()).toBeVisible({ timeout: 15_000 });

  if (await startBtn.isVisible()) {
    await startBtn.click();
  } else {
    await createInput.fill('Untitled Trip');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
  }

  await expect(page).toHaveURL(/\/group\/[^/]+$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Trip' })).toBeVisible();

  const match = page.url().match(/\/group\/([^/]+)$/);
  return match![1];
}

/**
 * Add a single expense via the bottom-nav "+" button. Assumes the group has one
 * member (the host), so it splits across everyone via "Select All".
 */
export async function addExpense(
  page: Page,
  { description, amount }: { description: string; amount: string }
): Promise<void> {
  const descField = page.getByPlaceholder('e.g. Dinner, Taxi');

  // Open the expense modal via the bottom-nav "+" (aria-label "Add Expense").
  // Right after a navigation the button can be tapped before the page has wired
  // up its handler, so the first click is occasionally swallowed and the modal
  // never opens — re-click until the description field appears.
  await expect(async () => {
    if (!(await descField.isVisible())) {
      await page.getByRole('button', { name: 'Add Expense' }).click();
    }
    await expect(descField).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 20_000 });

  await descField.fill(description);
  await page.getByPlaceholder('0.00').fill(amount);
  await page.getByRole('button', { name: 'Select All' }).click();

  await page.getByRole('button', { name: 'Confirm' }).click();
}

/**
 * Add a member to the current group from the Group Settings (members) page.
 * Only the host can do this, which is the case for a Quick Start group.
 */
export async function addMemberByHost(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder('Enter member name').fill(name);
  await page.locator('section').filter({ hasText: 'Member List' }).getByRole('button', { name: 'Add' }).click();
}

/**
 * Confirm the app's shared confirmation dialog (DialogContext). It renders at the
 * top of the stack (z-[100]) with the primary "confirm" button first in DOM
 * order (the footer is flex-row-reverse), so we click the first button inside it
 * rather than relying on the label — which is Chinese by default and varies per
 * caller (Settle Up, Mark Paid, …).
 */
export async function confirmDialog(page: Page): Promise<void> {
  const overlay = page.locator('.z-\\[100\\]');
  await overlay.waitFor({ state: 'visible', timeout: 10_000 });
  await overlay.getByRole('button').first().click();
}

/**
 * Add a currency in the group settings Currencies card (host only).
 * Assumes the settings page (/group/{id}/members) is open. Scopes all
 * locators to the Currencies section to avoid the Member-List "Add" button.
 */
export async function addCurrency(
  page: Page,
  { code, rate }: { code: string; rate: string },
): Promise<void> {
  const section = page.locator('section').filter({ hasText: 'Currencies' });
  await section.getByPlaceholder('e.g. JPY').fill(code);
  await section.getByPlaceholder('Exchange Rate').fill(rate);
  await section.getByRole('button', { name: 'Add' }).click();
}

/**
 * Open the expense modal via the bottom-nav "+" button. Uses the same
 * retry-click pattern as addExpense to handle the occasional swallowed click
 * right after a navigation. Resolves once the description field is visible.
 */
export async function openExpenseModal(page: Page): Promise<void> {
  const descField = page.getByPlaceholder('e.g. Dinner, Taxi');
  await expect(async () => {
    if (!(await descField.isVisible())) {
      await page.getByRole('button', { name: 'Add Expense' }).click();
    }
    await expect(descField).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 20_000 });
}

/**
 * Reload (or re-navigate to `url`) and run `assert`, retrying the whole cycle
 * until it passes. A Firestore write issued from a slow client (the CI runner's
 * network path to Firebase) can take well over a single assertion's timeout to
 * commit server-side, and a fresh page load discards the in-memory optimistic
 * copy of that write — so a one-shot "reload then assert the persisted value"
 * reliably flakes on CI while passing instantly on localhost. Re-reading in a
 * toPass loop lets the write reach the server and the fresh listeners catch up.
 *
 * This is the same resilient pattern already used inline in
 * member-management.spec.ts's "host deletes a member" (the one reload-readback
 * test that never flaked). Keep per-assert timeouts short so each cycle fails
 * fast and the loop can re-read, and let the outer `timeout` bound the total.
 */
export async function reloadUntil(
  page: Page,
  assert: () => Promise<void>,
  { url, timeout = 30_000 }: { url?: string; timeout?: number } = {},
): Promise<void> {
  await expect(async () => {
    if (url) {
      await page.goto(url);
    } else {
      await page.reload();
    }
    await assert();
  }).toPass({ timeout });
}

/**
 * Best-effort teardown for the shared dev project: delete the current
 * anonymous account, which cascades to deleting the groups it created
 * (handleDeleteAccount → cleanupUserData in AuthContext). Drives the app's own
 * Delete Account flow so it stays honest about what the UI actually does.
 *
 * Callers should wrap this so a cleanup failure never fails the test itself —
 * see the afterEach hooks in the specs.
 */
export async function cleanupCurrentAccount(page: Page): Promise<void> {
  // Every log line is prefixed so you can grep the Playwright output with
  // `[e2e-cleanup]` to see exactly how far teardown got for each test.
  const log = (msg: string) => console.log(`[e2e-cleanup] ${msg}`);

  const url = page.url();
  const match = url.match(/\/group\/([^/]+)/);
  if (!match) {
    // This is the #1 silent leak: the test didn't end inside a group (it failed
    // early, or navigated away), so we never reach the delete button and the
    // anon account + any group it created are left behind in the dev project.
    log(`SKIPPED — not on a /group/ URL (was: ${url}). Account NOT deleted; this leaks.`);
    return;
  }

  const groupId = match[1];
  log(`starting for group ${groupId} (url: ${url})`);

  // Bounded timeout on every step: against the real dev project a step can be
  // slow or (if a prior test left odd state) never resolve. Bounding it means a
  // failure rejects promptly and the caller's .catch() swallows it, instead of
  // hanging until the whole test times out.
  const opts = { timeout: 10_000 };

  // Run one named step, logging when it starts, succeeds, or throws. On failure
  // we log WHICH step broke (with the error message) and rethrow so the
  // afterEach .catch() still keeps the test result honest — but now the leak is
  // visible in the output instead of vanishing.
  const step = async (name: string, fn: () => Promise<void>) => {
    log(`→ ${name}`);
    try {
      await fn();
      log(`  ✓ ${name}`);
    } catch (err) {
      const reason = err instanceof Error ? err.message.split('\n')[0] : String(err);
      log(`  ✗ ${name} FAILED — ${reason}`);
      log(`ACCOUNT NOT DELETED for group ${groupId} — leaked at step "${name}".`);
      throw err;
    }
  };

  // Header overflow menu → Profile Settings → Delete Account → confirm.
  // Scope "Settings" to the <header> so it doesn't collide with the bottom-nav
  // "Settings" tab.
  await step('navigate to group', () => page.goto(`/group/${groupId}`).then(() => {}));

  // Wait for the group dashboard to actually settle before touching the header
  // menu. Opening it while Firestore snapshots are still streaming in triggers a
  // mid-open re-render that detaches the animated "Profile Settings" item, so
  // the click silently misses and times out (this was the observed leak). The
  // header Settings button being visible is the signal the group loaded.
  await step('wait for group dashboard to settle', () =>
    page.locator('header').getByRole('button', { name: 'Settings' }).waitFor({ state: 'visible', ...opts }));

  // Open the menu and click Profile Settings as one resilient unit: the menu has
  // an open animation and can re-render, so the first Settings click is
  // occasionally swallowed or the item detaches. Re-open until the item is
  // actually clickable — same pattern as addExpense above.
  await step('open Profile Settings from header menu', async () => {
    const settingsBtn = page.locator('header').getByRole('button', { name: 'Settings' });
    const profileItem = page.getByRole('menuitem', { name: /Profile Settings/ });
    await expect(async () => {
      if (!(await profileItem.isVisible())) {
        await settingsBtn.click();
      }
      await expect(profileItem).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    await profileItem.click(opts);
  });

  await step('click Delete Account', () =>
    page.getByRole('button', { name: 'Delete Account' }).click(opts));
  await step('click Delete Permanently', () =>
    page.getByRole('button', { name: 'Delete Permanently' }).click(opts));

  // handleDeleteAccount signs out and returns to the landing page.
  await step('wait for redirect to landing (delete complete)', () =>
    page.waitForURL(/\/$/, { timeout: 15_000 }));

  log(`✓ DONE — account + group ${groupId} deleted.`);
}

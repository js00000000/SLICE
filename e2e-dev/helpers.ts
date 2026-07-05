import { expect, type Page } from '@playwright/test';

/**
 * Drive the Quick Start flow from the landing page and wait until the fresh
 * group dashboard is showing. Returns the created groupId parsed from the URL.
 */
export async function quickStart(page: Page): Promise<string> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Directly (No Login)' }).click();

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
  await page.getByRole('button', { name: 'Add Expense' }).click();

  await page.getByPlaceholder('e.g. Dinner, Taxi').fill(description);
  await page.getByPlaceholder('0.00').fill(amount);
  await page.getByRole('button', { name: 'Select All' }).click();

  await page.getByRole('button', { name: 'Confirm' }).click();
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
  const match = page.url().match(/\/group\/([^/]+)/);
  if (!match) return; // Not inside a group — nothing reachable to delete.

  // Bounded timeout on every step: against the real dev project a step can be
  // slow or (if a prior test left odd state) never resolve. Bounding it means a
  // failure rejects promptly and the caller's .catch() swallows it, instead of
  // hanging until the whole test times out.
  const opts = { timeout: 10_000 };

  await page.goto(`/group/${match[1]}`);

  // Header overflow menu → Profile Settings → Delete Account → confirm.
  // Scope "Settings" to the <header> so it doesn't collide with the bottom-nav
  // "Settings" tab.
  await page.locator('header').getByRole('button', { name: 'Settings' }).click(opts);
  await page.getByRole('menuitem', { name: /Profile Settings/ }).click(opts);
  await page.getByRole('button', { name: 'Delete Account' }).click(opts);
  await page.getByRole('button', { name: 'Delete Permanently' }).click(opts);

  // handleDeleteAccount signs out and returns to the landing page.
  await page.waitForURL(/\/$/, { timeout: 15_000 });
}

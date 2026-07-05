import { test, expect } from '@playwright/test';
import { cleanupCurrentAccount } from './helpers';

// Delete the throwaway anonymous account (and its group) from the dev project
// after the test. Best-effort — never let cleanup failure fail the test.
test.afterEach(async ({ page }) => {
  await cleanupCurrentAccount(page).catch(() => {});
});

/**
 * Quick Start is the anonymous-auth entry point: it signs the visitor in
 * anonymously, creates a default group with them as the host member, and drops
 * them on the group dashboard. This exercises a full Firebase Auth +
 * Firestore write/read round-trip through the security rules, against the dev
 * project (see playwright.dev.config.ts).
 */
test('Quick Start signs in anonymously and lands on a fresh dashboard', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Start Directly (No Login)' }).click();

  // Anonymous sign-in + createGroup() + navigate. The URL becomes /group/<id>.
  await expect(page).toHaveURL(/\/group\/[^/]+$/, { timeout: 15_000 });

  // Default group name from createGroup(), rendered as the dashboard heading.
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Trip' })).toBeVisible();

  // A brand-new group has no expenses yet.
  await expect(page.getByText('No expenses recorded').first()).toBeVisible();

  // The anonymous session persists across a reload (Firebase keeps it in
  // IndexedDB), so the same group is restored rather than bouncing to landing.
  await page.reload();
  await expect(page).toHaveURL(/\/group\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Trip' })).toBeVisible();
});

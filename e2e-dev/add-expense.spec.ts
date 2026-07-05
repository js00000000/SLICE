import { test, expect } from '@playwright/test';
import { quickStart, addExpense, cleanupCurrentAccount } from './helpers';

// Delete the throwaway anonymous account (and its group) from the dev project
// after each test. Best-effort — never let cleanup failure fail the test.
test.afterEach(async ({ page }) => {
  await cleanupCurrentAccount(page).catch(() => {});
});

test('adds an expense and shows it in the expenses list', async ({ page }) => {
  const groupId = await quickStart(page);

  await addExpense(page, { description: 'Dinner', amount: '120' });

  // On save the app navigates to the expenses tab.
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));

  // The persisted expense round-trips back through the Firestore listener and
  // renders in the list.
  await expect(page.getByRole('heading', { name: 'Dinner' })).toBeVisible();

  // It also survives a reload (i.e. it was actually written to Firestore, not
  // just held in memory).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dinner' })).toBeVisible();
});

test('reflects the expense total on the dashboard', async ({ page }) => {
  const groupId = await quickStart(page);

  await addExpense(page, { description: 'Taxi', amount: '80' });
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));

  // Back to the dashboard: the expense count and total should have updated.
  await page.goto(`/group/${groupId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Trip' })).toBeVisible();
  await expect(page.getByText('1 Expenses')).toBeVisible();
  await expect(page.getByText('80', { exact: false }).first()).toBeVisible();
});

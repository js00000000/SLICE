import { test, expect } from '@playwright/test';
import { quickStart, addExpense, confirmDialog, cleanupCurrentAccount } from './helpers';

// Delete the throwaway anonymous account (and its group) from the dev project
// after each test. Best-effort — never let cleanup failure fail the test.
test.afterEach(async ({ page }) => {
  await cleanupCurrentAccount(page).catch(() => {});
});

test('deletes an expense after confirmation', async ({ page }) => {
  const groupId = await quickStart(page);

  await addExpense(page, { description: 'Taxi', amount: '80' });
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));
  await expect(page.getByRole('heading', { name: 'Taxi' })).toBeVisible();

  // Open the detail modal and delete, which routes through the shared confirm
  // dialog (handleDeleteExpense → confirm()).
  await page.getByRole('heading', { name: 'Taxi' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await confirmDialog(page);

  // The expense is gone and the empty state is shown.
  await expect(page.getByRole('heading', { name: 'Taxi' })).toHaveCount(0);
  await expect(page.getByText('No expenses recorded')).toBeVisible();

  // The deletion is persisted, not just an in-memory removal.
  await page.reload();
  await expect(page.getByText('No expenses recorded')).toBeVisible();
});

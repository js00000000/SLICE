import { test, expect } from './fixtures';
import { quickStart, addExpense } from './helpers';

// Account is shared across the whole worker and deleted once at teardown (see
// fixtures.ts). Each test creates its own fresh group via quickStart.

test('edits an existing expense and persists the change', async ({ page }) => {
  const groupId = await quickStart(page);

  await addExpense(page, { description: 'Dinner', amount: '120' });
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));
  await expect(page.getByRole('heading', { name: 'Dinner' })).toBeVisible();

  // Tapping the row opens the detail modal; "Edit" swaps in the edit form
  // (ExpenseDetailModal → ExpenseModal with initialData).
  await page.getByRole('heading', { name: 'Dinner' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();

  // Change both the description and the amount, then save.
  await page.getByPlaceholder('e.g. Dinner, Taxi').fill('Fancy Dinner');
  await page.getByPlaceholder('0.00').fill('200');
  await page.getByRole('button', { name: 'Save' }).click();

  // The update round-trips through Firestore and replaces the old expense.
  await expect(page.getByRole('heading', { name: 'Fancy Dinner' })).toBeVisible();
  await expect(page.getByText('$200')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dinner', exact: true })).toHaveCount(0);

  // Survives a reload (i.e. it was actually written, not just held in memory).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Fancy Dinner' })).toBeVisible();
  await expect(page.getByText('$200')).toBeVisible();
});

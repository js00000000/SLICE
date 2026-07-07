import { test, expect } from './fixtures';
import { quickStart, addExpense, confirmDialog } from './helpers';

// Account is shared across the whole worker and deleted once at teardown (see
// fixtures.ts). Each test creates its own fresh group via quickStart.

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

import { test, expect } from '@playwright/test';
import {
  quickStart,
  addMemberByHost,
  addExpense,
  confirmDialog,
  cleanupCurrentAccount,
} from './helpers';

// Delete the throwaway anonymous account (and its group) from the dev project
// after each test. Best-effort — never let cleanup failure fail the test.
test.afterEach(async ({ page }) => {
  await cleanupCurrentAccount(page).catch(() => {});
});

test('settles the group and marks a suggested payment as paid', async ({ page }) => {
  const groupId = await quickStart(page);

  // Add a second member so there is an actual balance to settle.
  await page.goto(`/group/${groupId}/members`);
  await addMemberByHost(page, 'Alice');
  await expect(page.getByText('2 members')).toBeVisible();

  // The host ("Me") pays 100, split evenly across both members → Alice owes 50.
  // Saving from the members page navigates to the expenses tab client-side.
  await addExpense(page, { description: 'Hotel', amount: '100' });
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));
  await expect(page.getByRole('heading', { name: 'Hotel' })).toBeVisible();

  // Reach the settlements page via the in-app bottom nav rather than a reload:
  // client-side navigation keeps the already-loaded GroupContext (same groupId,
  // so the expenses subscription is not torn down and re-raced), so the balance
  // is present immediately — the host's "Settle Up" button enables (it's
  // disabled at zero expenses) and the Alice → Me $50 transfer is suggested.
  await page.getByRole('button', { name: 'Balances' }).click();
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/settlements$`));

  const settleUp = page.getByRole('button', { name: 'Settle Up' });
  await expect(settleUp).toBeEnabled();
  await expect(page.getByText('$50').first()).toBeVisible();

  // Host settles the group; the confirm dialog locks it in.
  await settleUp.click();
  await confirmDialog(page);
  // exact: avoid matching the "Group settled. Expenses are now locked." toast.
  await expect(page.getByText('Group Settled', { exact: true })).toBeVisible();

  // Once settled, party members can mark the suggested payment as paid.
  await page.getByRole('button', { name: 'Mark Paid' }).click();
  await confirmDialog(page);

  // The payment moves into the Completed Payments card and offsets the balance.
  await expect(page.getByText('Completed Payments')).toBeVisible();
  await expect(page.getByText('Net Balance')).toBeVisible();
});

import { test, expect } from './fixtures';
import {
  quickStart,
  addMemberByHost,
  addExpense,
  confirmDialog,
} from './helpers';

// Account is shared across the whole worker and deleted once at teardown (see
// fixtures.ts). Each test creates its own fresh group via quickStart.

test('host adds a member and it shows in the member list', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);
  await expect(page.getByText('1 members')).toBeVisible();

  await addMemberByHost(page, 'Alice');

  // The new member round-trips through the members subcollection listener.
  await expect(page.getByText('2 members')).toBeVisible();
  await expect(page.getByText('Alice', { exact: true })).toBeVisible();

  // Persisted to Firestore, so it survives a reload.
  await page.reload();
  await expect(page.getByText('2 members')).toBeVisible();
  await expect(page.getByText('Alice', { exact: true })).toBeVisible();
});

test('host renames the group', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);

  // The group-name field is the first textbox on the page (the add-member input
  // comes later and carries a placeholder).
  await page.getByRole('textbox').first().fill('Beach Trip');
  await page.getByRole('button', { name: 'Save' }).click();

  // The rename propagates to the dashboard heading via the group-doc listener.
  await page.goto(`/group/${groupId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Beach Trip' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Beach Trip' })).toBeVisible();
});

test('host deletes a member after confirmation', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);
  await addMemberByHost(page, 'Bob');
  await expect(page.getByText('2 members')).toBeVisible();

  // A member with no expenses has a settled (zero) balance, so the host's
  // delete control is enabled. Its accessible name comes from the button title.
  await page.getByRole('button', { name: 'Delete Member' }).click();
  await confirmDialog(page);

  // Back to just the host, and Bob is gone (and stays gone after a reload).
  await expect(page.getByText('1 members')).toBeVisible();
  await expect(page.getByText('Bob', { exact: true })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText('1 members')).toBeVisible();
  await expect(page.getByText('Bob', { exact: true })).toHaveCount(0);
});

test('host cannot delete a member with an unsettled balance', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);
  await addMemberByHost(page, 'Carol');
  await expect(page.getByText('2 members')).toBeVisible();

  // Give Carol a balance: the host pays 100 split evenly → Carol owes 50. Saving
  // from the members page navigates to the expenses tab client-side.
  await addExpense(page, { description: 'Cabin', amount: '100' });
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));
  await expect(page.getByRole('heading', { name: 'Cabin' })).toBeVisible();

  // Return to the members page via the in-app bottom nav (the visible-text
  // "Settings" tab — distinct from the icon-only header menu of the same
  // accessible name). Client-side navigation keeps the loaded GroupContext, so
  // Carol's balance is already unsettled here.
  await page.getByRole('button', { name: 'Settings' }).filter({ hasText: 'Settings' }).click();
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/members$`));

  // With an unsettled balance, the delete control is disabled (its title becomes
  // "Balance not settled"), enforcing handleDeleteMemberByHost's guard.
  await expect(page.getByText('Owe $50')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Balance not settled' })).toBeDisabled();
});

test('member updates their own display name', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);
  // Let the group's Firestore listeners settle before opening the header menu —
  // otherwise a mid-open re-render can detach the animated menu item.
  await expect(page.getByText('1 members')).toBeVisible();

  // Open the profile modal from the header overflow menu.
  await page.locator('header').getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.getByRole('menuitem', { name: /Profile Settings/ }).click();

  // Rename from the default host name ("Me") to "Captain". Scope to the modal so
  // the field isn't confused with the members page's add-member input, which
  // shares the same placeholder.
  const profileModal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Profile Settings' });
  await profileModal.getByPlaceholder('Enter member name').fill('Captain');
  await profileModal.getByRole('button', { name: 'Save' }).click();

  // The member-doc update round-trips into the member list (shown as the current
  // member's row).
  await expect(page.getByText('Captain')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Captain')).toBeVisible();
});

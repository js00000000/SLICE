import { test, expect } from './fixtures';
import {
  quickStart,
  addCurrency,
  openExpenseModal,
  confirmDialog,
  reloadUntil,
} from './helpers';

// Account is shared across the whole worker and deleted once at teardown (see
// fixtures.ts). Each test creates its own fresh group via quickStart.

test('host adds a currency with an exchange rate and it persists', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);
  const section = page.locator('section').filter({ hasText: 'Currencies' });
  await expect(section).toBeVisible();

  await addCurrency(page, { code: 'JPY', rate: '0.21' });

  // The JPY rate row appears with the correct label and stored value.
  await expect(section.getByText('JPY · Exchange Rate')).toBeVisible();
  await expect(section.locator('input[type="number"]').first()).toHaveValue('0.21');

  // Persisted to Firestore — survives a full reload. The group-doc update can lag
  // behind a single assertion window on the CI→Firebase path, and the reload
  // drops the optimistic copy, so re-read until the stored rate comes back.
  await reloadUntil(page, async () => {
    await expect(section.getByText('JPY · Exchange Rate')).toBeVisible({ timeout: 5_000 });
    await expect(section.locator('input[type="number"]').first()).toHaveValue('0.21', { timeout: 5_000 });
  });
});

test('expense in a foreign currency shows original + converted amounts', async ({ page }) => {
  const groupId = await quickStart(page);

  // On the dashboard first: the expense modal should NOT show currency chips
  // while the group has only one currency (the default TWD).
  await openExpenseModal(page);
  await expect(page.getByRole('button', { name: 'TWD', exact: true })).toHaveCount(0);
  // Close the modal by clicking the X button.
  await page.locator('.fixed.inset-0.z-50').getByRole('button', { name: /close/i }).or(
    page.locator('.fixed.inset-0.z-50 button').first()
  ).click();

  // Settings → add JPY @ 0.21, then go back to the dashboard.
  await page.goto(`/group/${groupId}/members`);
  await addCurrency(page, { code: 'JPY', rate: '0.21' });
  // Confirm the currency committed server-side before leaving this page: the
  // dashboard reads the group doc on a fresh load, and if the write hasn't
  // landed yet the expense modal renders no currency chips at all (the observed
  // CI flake). Re-read here so JPY is durable before we depend on it.
  await reloadUntil(page, () =>
    expect(page.locator('section').filter({ hasText: 'Currencies' }).getByText('JPY · Exchange Rate')).toBeVisible({ timeout: 5_000 }));

  // Go back to the dashboard and wait for the page to settle.
  await page.goto(`/group/${groupId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Trip' })).toBeVisible();

  // Open expense modal: now the currency chips should be visible inside the form.
  await openExpenseModal(page);
  const modal = page.locator('form');
  await expect(modal.getByRole('button', { name: 'TWD', exact: true })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'JPY', exact: true })).toBeVisible();

  // Fill in a JPY expense.
  await page.getByPlaceholder('e.g. Dinner, Taxi').fill('Ramen');
  await page.getByPlaceholder('0.00').fill('1200');
  await modal.getByRole('button', { name: 'JPY', exact: true }).click();

  // The converted preview appears: 1200 × 0.21 = 252 → ≈ TWD 252.
  await expect(page.getByText('≈ TWD 252')).toBeVisible();

  await page.getByRole('button', { name: 'Select All' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  // The expense list shows the foreign amount and the converted default amount.
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));
  await expect(page.getByText('JPY 1,200')).toBeVisible();
  await expect(page.getByText('≈ $252')).toBeVisible();

  // Dashboard: total spend is displayed in the default currency inside the 'Total Spend' card.
  await page.goto(`/group/${groupId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Trip' })).toBeVisible();
  const totalSpendCard = page.locator('div').filter({ hasText: 'Total Spend' });
  await expect(totalSpendCard.getByText('$252').first()).toBeVisible();
});

test('changing the default currency recomputes exchange rates', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);
  const section = page.locator('section').filter({ hasText: 'Currencies' });

  // Add JPY at rate 0.21 (1 JPY = 0.21 TWD).
  await addCurrency(page, { code: 'JPY', rate: '0.21' });
  await expect(section.getByText('JPY · Exchange Rate')).toBeVisible();

  // Open the default-currency dropdown (trigger button shows "TWD") and switch
  // to JPY. The trigger is inside the Currencies section, scoped to avoid the
  // member list's OptionSelect.
  await section.getByRole('button', { name: 'TWD' }).click();
  await page.getByRole('option', { name: 'JPY' }).click();

  // Changing the default requires a confirmation dialog.
  await confirmDialog(page);

  // After the switch the trigger should now read "JPY" and the TWD rate row
  // should have the reciprocal rate: 1 / 0.21 ≈ 4.761905.
  await expect(section.getByRole('button', { name: 'JPY' })).toBeVisible();
  await expect(section.getByText('TWD · Exchange Rate')).toBeVisible();
  await expect(section.locator('input[type="number"]').first()).toHaveValue('4.761905');
});

test('removing a currency requires confirmation and is blocked while in use', async ({ page }) => {
  const groupId = await quickStart(page);

  await page.goto(`/group/${groupId}/members`);
  const section = page.locator('section').filter({ hasText: 'Currencies' });

  // Add two foreign currencies.
  await addCurrency(page, { code: 'KRW', rate: '0.024' });
  await expect(section.getByText('KRW · Exchange Rate')).toBeVisible();

  // Remove KRW (no expenses use it): click the delete button → confirm → gone.
  // Navigate from the label text to its parent div (the row container) so we
  // target exactly the KRW row's delete button, not the card-level wrapper
  // which would match multiple delete buttons and trigger a strict violation.
  await section.getByText('KRW · Exchange Rate').locator('..').getByRole('button', { name: 'Delete' }).click();
  await confirmDialog(page);
  await expect(section.getByText('KRW · Exchange Rate')).toHaveCount(0);
  await addCurrency(page, { code: 'JPY', rate: '0.21' });
  // JPY must be committed server-side before the dashboard expense modal can
  // offer it as a chip on a fresh load — re-read until it's durable.
  await reloadUntil(page, () => expect(section.getByText('JPY · Exchange Rate')).toBeVisible({ timeout: 5_000 }));

  // Add a JPY expense so JPY is now in use.
  await page.goto(`/group/${groupId}`);
  await openExpenseModal(page);
  await page.getByPlaceholder('e.g. Dinner, Taxi').fill('Sushi');
  await page.getByPlaceholder('0.00').fill('800');
  await page.getByRole('button', { name: 'JPY', exact: true }).click();
  await page.getByRole('button', { name: 'Select All' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page).toHaveURL(new RegExp(`/group/${groupId}/expenses$`));
  // The delete-block below only triggers if the members page (a fresh load) can
  // read an expense still referencing JPY. Confirm the expense committed
  // server-side before navigating away, so the guard sees it.
  await reloadUntil(page, () => expect(page.getByRole('heading', { name: 'Sushi' })).toBeVisible({ timeout: 5_000 }));

  // Return to settings and try to remove JPY — should show an error toast
  // because an expense still references it.
  await page.goto(`/group/${groupId}/members`);
  await expect(section.getByText('JPY · Exchange Rate')).toBeVisible();
  await section.getByText('JPY · Exchange Rate').locator('..').getByRole('button', { name: 'Delete' }).click();

  // The error toast appears and JPY stays in the list (no confirm dialog).
  await expect(page.getByText('1 expense(s) still use JPY')).toBeVisible();
  await expect(section.getByText('JPY · Exchange Rate')).toBeVisible();
});

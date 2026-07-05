import { test, expect } from '@playwright/test';

// Client-side routing for unauthenticated visitors. Unknown paths that are not
// `/group/*` or `/join/*` are rejected by App.isValidRoute and redirected to
// `/` without any Firebase call — deterministic.
test.describe('Routing', () => {
  test('unknown route redirects to the landing page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('effortless');
  });

  test('root shows the landing page for signed-out visitors', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Start Directly (No Login)' })
    ).toBeVisible();
  });
});

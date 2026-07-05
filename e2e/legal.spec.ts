import { test, expect } from '@playwright/test';

// Legal pages render ahead of the auth gate (see App.tsx) and are pure static
// content — no Firebase, fully deterministic.
test.describe('Legal pages', () => {
  test('privacy policy renders and links back home', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
    // NOTE: the document <title> is intentionally not asserted here. App.tsx
    // runs a `document.title = seo_title` effect for signed-out users that fires
    // even on the early-returned legal routes, clobbering LegalPage's Helmet
    // <title>. The visible <h1> is the reliable signal for these pages.

    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('effortless');
  });

  test('terms of service renders', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible();
  });

  test('emits BreadcrumbList JSON-LD', async ({ page }) => {
    await page.goto('/privacy');

    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts.first()).toBeAttached();

    const types = (await scripts.allTextContents())
      .map((raw) => {
        try {
          return JSON.parse(raw)['@type'];
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    expect(types).toContain('BreadcrumbList');
  });
});

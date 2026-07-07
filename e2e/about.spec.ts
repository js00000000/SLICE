import { test, expect } from '@playwright/test';

// The about page renders ahead of the auth gate (see App.tsx) and is pure
// static content — no Firebase, fully deterministic.
test.describe('About page', () => {
  test('renders, has SEO title, and links back home', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { level: 1, name: 'About SLICE' })).toBeVisible();
    await expect(page).toHaveTitle(/About SLICE/);

    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('effortless');
  });

  test('links to the compare page', async ({ page }) => {
    await page.goto('/about');

    await page.getByRole('link', { name: /SLICE vs Splitwise comparison/ }).click();
    await expect(page).toHaveURL(/\/compare\/splitwise$/);
    await expect(page.getByRole('heading', { level: 1, name: 'SLICE vs Splitwise' })).toBeVisible();
  });

  test('emits BreadcrumbList + AboutPage JSON-LD', async ({ page }) => {
    await page.goto('/about');

    const scripts = page.locator('script[type="application/ld+json"]');

    // Same injection race as landing.spec.ts: Helmet adds its script after
    // mount while the static index.html JSON-LD is present from the start.
    const readTypes = async () =>
      (await scripts.allTextContents())
        .flatMap((raw) => {
          try {
            const parsed = JSON.parse(raw);
            return parsed['@graph']
              ? parsed['@graph'].map((n: { '@type': string }) => n['@type'])
              : [parsed['@type']];
          } catch {
            return [];
          }
        })
        .filter(Boolean);

    await expect.poll(readTypes).toContain('BreadcrumbList');
    await expect.poll(readTypes).toContain('AboutPage');
  });

  test('is reachable from the landing footer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1, name: 'About SLICE' })).toBeVisible();
  });
});

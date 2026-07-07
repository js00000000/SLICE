import { test, expect } from '@playwright/test';

// The compare page renders ahead of the auth gate (see App.tsx) and is pure
// static content — no Firebase, fully deterministic.
test.describe('Compare page', () => {
  test('renders, has SEO title, and links back home', async ({ page }) => {
    await page.goto('/compare/splitwise');

    await expect(page.getByRole('heading', { level: 1, name: 'SLICE vs Splitwise' })).toBeVisible();
    await expect(page).toHaveTitle(/SLICE vs Splitwise/);

    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('effortless');
  });

  test('shows the comparison table with both product columns', async ({ page }) => {
    await page.goto('/compare/splitwise');

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('columnheader').filter({ hasText: 'SLICE' })).toBeVisible();
    await expect(table.getByRole('columnheader').filter({ hasText: 'Splitwise' })).toBeVisible();
    await expect(table.getByRole('rowheader', { name: 'Pricing' })).toBeVisible();
  });

  test('emits BreadcrumbList + FAQPage JSON-LD', async ({ page }) => {
    await page.goto('/compare/splitwise');

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
    await expect.poll(readTypes).toContain('FAQPage');
  });

  test('is reachable from the landing footer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'vs Splitwise' }).click();
    await expect(page).toHaveURL(/\/compare\/splitwise$/);
    await expect(page.getByRole('heading', { level: 1, name: 'SLICE vs Splitwise' })).toBeVisible();
  });
});

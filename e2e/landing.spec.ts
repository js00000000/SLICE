import { test, expect } from '@playwright/test';

// The landing page is what unauthenticated users see at `/`. It renders
// entirely client-side with no Firebase round-trip, so these assertions are
// deterministic. Default locale is en-US (see playwright.config.ts), so the
// English copy is expected on first load.
test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the hero and both login CTAs', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('effortless');

    // Two primary CTAs in the login widget.
    await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Start Directly (No Login)' })
    ).toBeVisible();
  });

  test('has the SLICE SEO title', async ({ page }) => {
    await expect(page).toHaveTitle(/SLICE/);
  });

  test('toggles language between English and 繁體中文', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('effortless');

    // In English, the toggle offers the Chinese label.
    const toggle = page.getByRole('button', { name: '繁體中文' });
    await toggle.click();

    // Chinese hero copy appears; the CTA switches to the Chinese variant.
    await expect(h1).toContainText('輕鬆計算每一分錢');
    await expect(page.getByRole('button', { name: '直接開始' })).toBeVisible();

    // Toggle now offers switching back to English.
    await page.getByRole('button', { name: 'English' }).click();
    await expect(h1).toContainText('effortless');
  });

  test('expands and collapses an FAQ item', async ({ page }) => {
    const firstFaq = page.getByRole('button', { name: /Is SLICE free\?/ });
    await expect(firstFaq).toHaveAttribute('aria-expanded', 'false');

    await firstFaq.click();
    await expect(firstFaq).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByText(/completely free for personal use/i)
    ).toBeVisible();

    await firstFaq.click();
    await expect(firstFaq).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens and closes the sponsor modal', async ({ page }) => {
    await page.getByRole('button', { name: /Sponsor/ }).click();

    // Modal mounts with sponsor-specific content (the contact email is unique
    // to this modal).
    const email = page.getByText('fusion.labs.tw@gmail.com');
    await expect(email).toBeVisible();

    // The modal closes on backdrop click; the top-left corner is over the
    // backdrop overlay, clear of the centered card.
    await page.mouse.click(5, 5);
    await expect(email).toBeHidden();
  });

  test('footer links route to legal pages', async ({ page }) => {
    await page.getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/\/privacy$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL(/\/terms$/);
  });

  test('emits FAQ + HowTo JSON-LD structured data', async ({ page }) => {
    const scripts = page.locator('script[type="application/ld+json"]');
    // react-helmet-async injects these into <head> after mount.
    await expect(scripts.first()).toBeAttached();

    const ldJson = await scripts.allTextContents();
    const types = ldJson
      .map((raw) => {
        try {
          return JSON.parse(raw)['@type'];
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    expect(types).toContain('FAQPage');
    expect(types).toContain('HowTo');
  });
});

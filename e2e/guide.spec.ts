import { test, expect } from '@playwright/test';

// The travel-split guide renders ahead of the auth gate (see App.tsx) and is
// deliberately zh-only (no i18n switching), so assertions use Chinese text
// regardless of the browser locale.
test.describe('Travel split guide page', () => {
  test('renders in Chinese with SEO title and links back home', async ({ page }) => {
    await page.goto('/guide/travel-split');

    await expect(page.getByRole('heading', { level: 1, name: '出國旅遊分帳全攻略' })).toBeVisible();
    await expect(page).toHaveTitle(/出國旅遊分帳全攻略/);

    await page.getByRole('link', { name: '返回首頁' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('emits Article + FAQPage JSON-LD', async ({ page }) => {
    await page.goto('/guide/travel-split');

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

    await expect.poll(readTypes).toContain('Article');
    await expect.poll(readTypes).toContain('FAQPage');
  });

  test('links to the compare page', async ({ page }) => {
    await page.goto('/guide/travel-split');

    await page.getByRole('link', { name: /SLICE 與 Splitwise 的完整比較/ }).click();
    await expect(page).toHaveURL(/\/compare\/splitwise$/);
  });

  test('is reachable from the landing footer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Travel Guide' }).click();
    await expect(page).toHaveURL(/\/guide\/travel-split$/);
    await expect(page.getByRole('heading', { level: 1, name: '出國旅遊分帳全攻略' })).toBeVisible();
  });
});

// The scenario guides share the data-driven GuidePage template (src/data/guideData.ts).
test.describe('Scenario guides', () => {
  const scenarios = [
    { slug: 'japan-trip', h1: '日本自由行分帳怎麼算？', titleKeyword: '日本自由行分帳' },
    { slug: 'dining-aa', h1: '聚餐 AA 制怎麼分才公平？', titleKeyword: '聚餐 AA 制' }
  ];

  for (const { slug, h1, titleKeyword } of scenarios) {
    test(`/${slug} renders in Chinese with its own H1 and SEO title`, async ({ page }) => {
      await page.goto(`/guide/${slug}`);

      await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
      // <title> carries the fuller `headline`; assert on the shared keyword.
      await expect(page).toHaveTitle(new RegExp(titleKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  }

  test('cross-link to a sibling guide (hub-and-spoke)', async ({ page }) => {
    await page.goto('/guide/japan-trip');

    await page.getByRole('link', { name: '出國旅遊分帳全攻略' }).click();
    await expect(page).toHaveURL(/\/guide\/travel-split$/);
  });
});

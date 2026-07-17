import { describe, it, expect } from 'vitest';
import { COMPARE_COMPETITORS, COMPARE_SLUGS } from './compareData';
// Import the build route registry as raw text (Vite's ?raw), so this TS file
// avoids a declaration-less .mjs import and node type deps under the app's
// tsconfig (allowJs: false, no "node" in types). We only need to assert the
// compare paths match — parsing the text is enough for that guard.
import routeSource from '../../scripts/seo-routes.mjs?raw';

// Guards for the programmatic /compare/:competitor pages. The runtime content
// registry (compareData.ts) and the build-time route list (seo-routes.mjs) are
// separate files by necessity — one is TS the app imports, the other is plain
// ESM the node build scripts import. These tests keep them honest and enforce
// the pSEO quality bar: no drift, no thin/duplicate content.
const COMPARE_ROUTE_SLUGS = [
  ...new Set([...routeSource.matchAll(/'\/compare\/([\w-]+)'/g)].map((m) => m[1]))
];

describe('compare route registry ⇄ content registry', () => {
  it('every content slug is a declared build route (and vice versa)', () => {
    expect([...COMPARE_SLUGS].sort()).toEqual([...COMPARE_ROUTE_SLUGS].sort());
  });

  it('each entry key matches its own slug', () => {
    for (const [key, entry] of Object.entries(COMPARE_COMPETITORS)) {
      expect(entry.slug).toBe(key);
    }
  });
});

describe('compare content quality (thin/duplicate-content guards)', () => {
  const entries = Object.values(COMPARE_COMPETITORS);

  it('titles and meta descriptions are unique across pages', () => {
    for (const locale of ['zh', 'en'] as const) {
      const titles = entries.map((e) => e[locale].title);
      const descriptions = entries.map((e) => e[locale].description);
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    }
  });

  it('each page ships substantive, structured content in both locales', () => {
    for (const entry of entries) {
      for (const locale of ['zh', 'en'] as const) {
        const c = entry[locale];
        expect(c.competitorName).toBeTruthy();
        expect(c.title).toContain('SLICE');
        // Meta descriptions in a healthy range for SERP snippets.
        expect(c.description.length).toBeGreaterThanOrEqual(70);
        expect(c.description.length).toBeLessThanOrEqual(320);
        expect(c.intro.length).toBeGreaterThanOrEqual(2);
        expect(c.rows.length).toBeGreaterThanOrEqual(8);
        expect(c.faqs.length).toBeGreaterThanOrEqual(4);
        expect(c.whenSlice.length).toBeGreaterThanOrEqual(2);
        expect(c.whenCompetitor.length).toBeGreaterThanOrEqual(1);
        expect(c.disclaimer).toBeTruthy();
        for (const faq of c.faqs) {
          expect(faq.q).toBeTruthy();
          expect(faq.a.length).toBeGreaterThanOrEqual(20);
        }
      }
    }
  });
});

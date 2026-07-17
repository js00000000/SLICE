import { describe, it, expect } from 'vitest';
import { GUIDE_GUIDES, GUIDE_SLUGS } from './guideData';
// Import the build route registry as raw text (Vite's ?raw), so this TS file
// avoids a declaration-less .mjs import and node type deps under the app's
// tsconfig (allowJs: false, no "node" in types). We only need to assert the
// guide paths match — parsing the text is enough for that guard.
import routeSource from '../../scripts/seo-routes.mjs?raw';

// Guards for the programmatic /guide/:scenario pages. The runtime content
// registry (guideData.ts) and the build-time route list (seo-routes.mjs) are
// separate files by necessity — one is TS the app imports, the other is plain
// ESM the node build scripts import. These tests keep them honest and enforce
// the pSEO quality bar: no drift, no thin/duplicate content.
const GUIDE_ROUTE_SLUGS = [
  ...new Set([...routeSource.matchAll(/'\/guide\/([\w-]+)'/g)].map((m) => m[1]))
];

describe('guide route registry ⇄ content registry', () => {
  it('every content slug is a declared build route (and vice versa)', () => {
    expect([...GUIDE_SLUGS].sort()).toEqual([...GUIDE_ROUTE_SLUGS].sort());
  });

  it('each entry key matches its own slug', () => {
    for (const [key, entry] of Object.entries(GUIDE_GUIDES)) {
      expect(entry.slug).toBe(key);
    }
  });
});

describe('guide content quality (thin/duplicate-content guards)', () => {
  const entries = Object.values(GUIDE_GUIDES);

  it('titles, headlines and meta descriptions are unique across pages', () => {
    const titles = entries.map((e) => e.title);
    const headlines = entries.map((e) => e.headline);
    const descriptions = entries.map((e) => e.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(headlines).size).toBe(headlines.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('each page ships substantive, structured content', () => {
    for (const entry of entries) {
      expect(entry.eyebrow).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.headline).toBeTruthy();
      expect(entry.tagline).toBeTruthy();
      // Meta descriptions in a healthy range for zh SERP snippets. CJK renders
      // wider per character than Latin, so the floor is lower than the bilingual
      // compare guard (~40–78 CJK chars ≈ the same pixel width Google shows).
      expect(entry.description.length).toBeGreaterThanOrEqual(55);
      expect(entry.description.length).toBeLessThanOrEqual(160);
      // ISO date, so <lastmod>/schema dates stay valid.
      expect(entry.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (entry.updated) expect(entry.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.sections.length).toBeGreaterThanOrEqual(4);
      expect(entry.faqs.length).toBeGreaterThanOrEqual(3);
      for (const sec of entry.sections) {
        expect(sec.h).toBeTruthy();
        expect(sec.body.length).toBeGreaterThanOrEqual(1);
        for (const p of sec.body) expect(p.length).toBeGreaterThanOrEqual(20);
      }
      for (const faq of entry.faqs) {
        expect(faq.q).toBeTruthy();
        expect(faq.a.length).toBeGreaterThanOrEqual(20);
      }
    }
  });
});

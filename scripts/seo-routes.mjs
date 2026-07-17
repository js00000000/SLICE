// Single source of truth for the public, indexable routes.
//
// Both scripts/generate-sitemap.js (sitemap.xml) and scripts/prerender.js
// (static per-route HTML) import this list, so a route is declared exactly once.
// App.tsx's isValidRoute() allowlist must stay consistent with these paths; the
// programmatic /compare/* pages are additionally guarded by
// src/data/compareData.test.ts, which asserts every COMPARE_SLUGS entry appears
// here (and vice versa) so the runtime registry and the build list can't drift.
//
// `file` is used only to derive <lastmod> from git history; point programmatic
// routes at the data module so content edits move the timestamp.

export const PAGES = [
  { path: '/', file: 'src/pages/LandingPage.tsx', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', file: 'src/pages/AboutPage.tsx', changefreq: 'monthly', priority: '0.5' },

  // Programmatic /guide/:scenario pages — driven by src/data/guideData.ts.
  { path: '/guide/travel-split', file: 'src/data/guideData.ts', changefreq: 'monthly', priority: '0.6' },
  { path: '/guide/japan-trip', file: 'src/data/guideData.ts', changefreq: 'monthly', priority: '0.6' },
  { path: '/guide/dining-aa', file: 'src/data/guideData.ts', changefreq: 'monthly', priority: '0.6' },

  // Programmatic /compare/:competitor pages — driven by src/data/compareData.ts.
  { path: '/compare/splitwise', file: 'src/data/compareData.ts', changefreq: 'monthly', priority: '0.6' },
  { path: '/compare/tricount', file: 'src/data/compareData.ts', changefreq: 'monthly', priority: '0.6' },
  { path: '/compare/settle-up', file: 'src/data/compareData.ts', changefreq: 'monthly', priority: '0.6' },

  { path: '/privacy', file: 'src/pages/LegalPage.tsx', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', file: 'src/pages/LegalPage.tsx', changefreq: 'yearly', priority: '0.3' }
];

/** All compare-page slugs declared in the build route list. */
export const COMPARE_ROUTE_SLUGS = PAGES
  .map((p) => p.path.match(/^\/compare\/([^/]+)$/)?.[1])
  .filter((s) => Boolean(s));

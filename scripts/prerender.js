// Post-build prerender for the public, indexable routes.
//
// SLICE is a client-rendered SPA: Cloudflare Pages serves `dist/index.html` for
// every route (`/* -> /index.html 200`), so crawlers hitting `/privacy`,
// `/about`, `/compare/splitwise` etc. receive the *landing page's* <head> (its
// title, description, canonical -> "/") and an empty <div id="root">. Google can
// execute JS, but social scrapers and many crawlers index the raw HTML — so the
// sub-routes effectively share the landing page's metadata and canonicalize to
// "/", which is an SEO dead end.
//
// This script boots `vite preview` over the built `dist/`, drives a headless
// browser to each public route, lets React + react-helmet-async render, then
// writes the fully-rendered HTML back to `dist/<route>/index.html`. Cloudflare
// Pages serves those static files ahead of the SPA fallback, so each route now
// ships its own <head> and body content. On a real visit, `createRoot().render()`
// client-renders over the prerendered markup (no hydration, so no mismatch).
//
// It is intentionally best-effort: any failure logs a warning and exits 0. The
// SPA fallback still works, so a prerender hiccup never blocks a deploy.
//
// Runs only in the deploy jobs (`npm run build:deploy`), which install chromium
// first. The plain `build` gate stays browser-free.

import { preview } from 'vite'
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PAGES } from './seo-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

// Public routes that should be independently indexable, sourced from the shared
// registry (scripts/seo-routes.mjs) so prerender and the sitemap never drift.
// Root ("/") already carries strong static SEO in index.html, but we prerender
// it too so the shipped HTML contains the rendered landing body (not just the
// <noscript> fallback).
const ROUTES = PAGES.map((p) => p.path)

const PORT = 4183

// Collapse the duplicate <head> tags that result from prerendering. index.html
// ships static landing-page metadata (title, description, canonical -> "/",
// og:*), and react-helmet-async *appends* each route's own tags to the end of
// <head> rather than replacing the static ones — so a prerendered sub-route ends
// up with two <title>s, two canonicals, etc.
//
// Helmet does not tag managed elements individually in this version, but it does
// append them last, which matches the browser/Helmet "last one wins" resolution.
// So we dedupe by identity keeping the LAST occurrence: the route-specific value
// survives and the static landing duplicate is dropped. Tags with a unique
// identity (og:image, apple-* meta, JSON-LD) have no duplicate and are left
// untouched.
function dedupeManagedHead() {
  const head = document.head

  // <title>: unlike meta/link, Helmet inserts its managed <title> *before* the
  // static one, and the browser resolves document.title from that. So collapse
  // to a single <title> carrying the authoritative document.title value rather
  // than relying on position.
  const resolvedTitle = document.title
  const titles = Array.from(head.querySelectorAll('title'))
  titles.forEach((el, i) => {
    if (i > 0) el.remove()
  })
  if (titles[0]) titles[0].textContent = resolvedTitle

  // <link rel="canonical">: keep the last.
  const canonicals = head.querySelectorAll('link[rel="canonical"]')
  canonicals.forEach((el, i) => {
    if (i < canonicals.length - 1) el.remove()
  })

  // <meta>: dedupe by name/property, keeping the last occurrence. Walking from
  // the end, the first time we see an identity is the keeper. Metas with neither
  // name nor property (charset, http-equiv) have no identity and are kept.
  const metas = Array.from(head.querySelectorAll('meta'))
  const seen = new Set()
  for (let i = metas.length - 1; i >= 0; i--) {
    const el = metas[i]
    const name = el.getAttribute('name')
    const prop = el.getAttribute('property')
    const key = name ? 'name:' + name : prop ? 'prop:' + prop : null
    if (!key) continue
    if (seen.has(key)) el.remove()
    else seen.add(key)
  }
}

async function run() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.warn('[prerender] dist/index.html not found — run `vite build` first. Skipping.')
    return
  }

  let server
  let browser
  try {
    server = await preview({
      // Serve the built dist/ with SPA fallback (vite preview default appType).
      preview: { port: PORT, strictPort: true },
      logLevel: 'warn',
    })
    const base = `http://localhost:${PORT}`

    browser = await chromium.launch()
    // zh-TW is the canonical/default locale (see index.html <html lang> and the
    // i18n fallback). Pin it so the prerendered content matches the canonical.
    const context = await browser.newContext({ locale: 'zh-TW' })
    const page = await context.newPage()

    for (const route of ROUTES) {
      const url = base + route
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 20000 })
        // Wait until React has rendered meaningful body content (past the auth
        // loading gate / into the page). Best-effort: don't fail if it lingers.
        await page
          .waitForFunction(
            () => {
              const root = document.getElementById('root')
              return !!root && root.innerText.trim().length > 150
            },
            { timeout: 15000 },
          )
          .catch(() => {
            console.warn(`[prerender] ${route}: content signal timed out, capturing as-is`)
          })
        // Small settle so Helmet flushes head mutations and i18n resolves.
        await page.waitForTimeout(500)

        await page.evaluate(dedupeManagedHead)

        const html = await page.content()
        const outPath =
          route === '/'
            ? path.join(distDir, 'index.html')
            : path.join(distDir, route.replace(/^\//, ''), 'index.html')
        fs.mkdirSync(path.dirname(outPath), { recursive: true })
        fs.writeFileSync(outPath, html, 'utf8')
        console.log(`[prerender] wrote ${path.relative(distDir, outPath)}`)
      } catch (err) {
        console.warn(`[prerender] ${route}: failed to prerender — ${err.message}`)
      }
    }
  } catch (err) {
    // Best-effort: never block a deploy on prerender. The SPA fallback still
    // serves every route.
    console.warn(`[prerender] skipped due to error: ${err.message}`)
  } finally {
    await browser?.close().catch(() => {})
    await new Promise((resolve) => {
      if (!server) return resolve()
      server.httpServer.close(() => resolve())
    })
  }
}

run()

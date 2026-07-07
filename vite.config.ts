import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'robots.txt',
        'sitemap.xml',
        'apple-touch-icon.png',
      ],
      devOptions: {
        // Generate/serve the service worker during `npm run dev` so PWA
        // behaviour (install prompt, offline) can be tested locally.
        enabled: true,
      },
      manifest: {
        id: '/',
        name: 'SLICE 群組分帳',
        short_name: 'SLICE',
        description:
          '專為群組設計的簡單分帳工具。支援匿名登入、Google 登入，輕鬆追蹤支出、計算結清金額。',
        lang: 'zh-Hant-TW',
        start_url: '/',
        display: 'standalone',
        background_color: '#FFF0EA',
        theme_color: '#FF6B35',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/, /^\/\.netlify\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) {
            return 'firebase';
          }
          if (id.includes('lucide-react')) {
            return 'ui-icons';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  // Vitest picks up `**/*.{test,spec}.ts` by default, which would sweep in the
  // Playwright specs under e2e/. Keep the unit runner (vitest) and the e2e
  // runner (playwright) strictly separate.
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**', 'e2e-dev/**'],
  },
})

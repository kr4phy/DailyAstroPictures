// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  vite: {
    build: {
      chunkSizeWarningLimit: 550,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('@iconify')) {
              return 'iconify-vendor';
            }
          }
        }
      }
    }
  },
  app: {
    // Keep local preview/dev at root. Set NUXT_APP_BASE_URL=/DailyAstroPictures/ only in GitHub Pages deploy.
    baseURL: process.env.NUXT_APP_BASE_URL || '/'
  },
  modules: ['@nuxt/ui', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'github_pages'
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Daily Astro Pictures',
      short_name: 'AstroPics',
      description: 'Explore NASA APOD with local-first caching',
      theme_color: '#0f172a',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192.svg',
          sizes: '192x192',
          type: 'image/svg+xml'
        },
        {
          src: '/icons/icon-512.svg',
          sizes: '512x512',
          type: 'image/svg+xml'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request, url }) =>
            request.destination === 'image' || /apod\.nasa\.gov/.test(url.hostname),
          handler: 'CacheFirst',
          method: 'GET',
          options: {
            cacheName: 'apod-images',
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 7
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apodApiKey: 'DEMO_KEY'
    }
  }
})

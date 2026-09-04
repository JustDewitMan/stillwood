import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const pages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: pages ? '/stillwood/' : '/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Stillwood',
        short_name: 'Stillwood',
        description: 'A calm 2D gather-and-craft adventure',
        theme_color: '#2f4a3c',
        background_color: '#1e3329',
        display: 'standalone',
        orientation: 'any',
        start_url: pages ? '/stillwood/' : '/',
        scope: pages ? '/stillwood/' : '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})

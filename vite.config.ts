import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icon.svg'],
      manifest: {
        name: 'Abo Suhail Calculator',
        short_name: 'ASC Calc',
        description: 'آلة حاسبة متقدمة وذكية',
        start_url: '/',
        display: 'standalone',
        background_color: '#050A14',
        theme_color: '#050A14',
        orientation: 'portrait',
        lang: 'ar',
        dir: 'rtl',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'static-resources' }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', cacheableResponse: { statuses: [0, 200] } }
          },
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'tailwind-cdn', cacheableResponse: { statuses: [0, 200] } }
          }
        ],
        navigateFallback: '/index.html',
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  server: { host: '0.0.0.0', port: 3000 },
  build: { outDir: 'dist' }
});

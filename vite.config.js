import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'log-interceptor',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/log-error')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const error = url.searchParams.get('error');
            const stack = url.searchParams.get('stack');
            const logMsg = `[BROWSER ERROR] ${new Date().toISOString()}\nError: ${error}\nStack: ${stack}\n\n`;
            console.log(logMsg);
            
            fs.appendFileSync(path.join(__dirname, 'browser-errors.log'), logMsg);
            
            res.statusCode = 200;
            res.end('Logged');
            return;
          }
          next();
        });
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Shared Net',
        short_name: 'ShardNet',
        description: 'Self-Healing Information Network (Survival Ready)',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    emptyOutDir: true
  }
})

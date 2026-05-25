import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'BatLife',
        short_name: 'BatLife',
        description: 'Optimisation de batterie pour VAE et trottinettes',
        theme_color: '#18181b',
        background_color: '#18181b',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/batlife-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom)/,
            }
          ]
        }
      }
    }
  }
}) // ✅ accolade + parenthèse fermante de defineConfig
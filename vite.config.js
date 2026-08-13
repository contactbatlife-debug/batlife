import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // ✅ On utilise notre propre SW au lieu du SW auto-généré
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',

      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'screenshots/*.jpg'],
      manifest: {
        name: 'BatLife - Optimiseur de Batterie VAE & Trottinettes',
        short_name: 'BatLife',
        description: 'Optimisez la durée de vie et suivez l\'autonomie de votre batterie de vélo électrique.',
        start_url: '/',
        id: '/',
        display: 'standalone',
        background_color: '#0a1830',
        theme_color: '#0a1830',
        orientation: 'portrait',
        lang: 'fr',
        categories: ['utilities', 'lifestyle'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/batlife-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/batlife-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshots/screenshot-dashboard.jpg',
            sizes: '386x843',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Tableau de bord — autonomie et température en temps réel'
          },
          {
            src: 'screenshots/screenshot-stats.jpg',
            sizes: '389x844',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Statistiques détaillées et prévision de santé batterie'
          },
          {
            src: 'screenshots/screenshot-coach.jpg',
            sizes: '389x842',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Coach BatLife — les 7 règles d\'or'
          },
          {
            src: 'screenshots/screenshot-badges.jpg',
            sizes: '385x836',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Système de badges et progression'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  }
})
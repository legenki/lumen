import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/lumen/',
  server: { port: 3000 },
  // lightningcss keeps both -webkit-backdrop-filter and the standard property
  // (esbuild's CSS minifier drops the standard one — see grafema history).
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: { safari: 15 << 16, chrome: 90 << 16 },
    },
  },
  build: { outDir: 'dist', cssMinify: 'lightningcss' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,webp,png,frag,vert}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Lumen Filter Studio',
        short_name: 'Lumen',
        description: 'Generative image-filtering studio: shader effect stack, masks, presets',
        theme_color: '#f4f4f4',
        background_color: '#f4f4f4',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
});

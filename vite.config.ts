import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// PWA uses injectManifest so we own the service worker source (src/pwa/sw.ts).
// This matches ADR-0005: full control over cache strategy is required for offline-first.

// Inline the app version from the project manifest at build time so the
// Settings → About surface tracks the source of truth (see src/vite-env.d.ts
// for the ambient declaration).
const manifestPath = new URL('./package.json', import.meta.url);
const appVersion = (JSON.parse(readFileSync(manifestPath, 'utf8')) as { version: string }).version;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      // v1.1.x hotfix — autoUpdate replaces the previous 'prompt' registration
      // policy for the module-independence rollout. Existing installed clients
      // running the pre-Slice-G bundle stayed on the old app because 'prompt'
      // required a user click to activate the new SW. autoUpdate lets the new
      // SW take control automatically on next update check. See release-log
      // entry "Post-v1.1.0 hotfix — SW auto-update for module-independence".
      // ADR-0005's 'prompt' preference is temporarily overridden for this
      // rollout; UpdatePrompt.tsx + useServiceWorkerUpdate.ts remain in tree
      // (unused for this cycle) so 'prompt' can be reinstated later without
      // recovering deleted code.
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Personal OS',
        short_name: 'Personal OS',
        description: 'A calm daily surface for keeping promises to yourself.',
        theme_color: '#0a0a0a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          { src: '/icons/icon-maskable-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@ds': path.resolve(__dirname, 'src/design-system'),
      '@contract': path.resolve(__dirname, 'src/contract'),
      '@kernel': path.resolve(__dirname, 'src/kernel'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-router') || id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', 'dist/'],
    },
  },
});

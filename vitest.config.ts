import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Vitest-only config. Kept separate from vite.config.ts so that running
// tests does not have to resolve the full Vite plugin graph (which breaks
// under certain UNC / cross-filesystem paths on Windows).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '@app': path.resolve(process.cwd(), 'src/app'),
      '@routes': path.resolve(process.cwd(), 'src/routes'),
      '@features': path.resolve(process.cwd(), 'src/features'),
      '@shared': path.resolve(process.cwd(), 'src/shared'),
      '@data': path.resolve(process.cwd(), 'src/data'),
      '@ds': path.resolve(process.cwd(), 'src/design-system'),
      '@contract': path.resolve(process.cwd(), 'src/contract'),
      '@kernel': path.resolve(process.cwd(), 'src/kernel'),
    },
  },
  test: {
    globals: false,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Slice H — exclude the Playwright runtime-verification suite;
    // those specs run under `npm run verify:runtime` (Playwright),
    // not Vitest. Without this, Vitest attempts to execute the
    // Playwright DSL and reports the file as failed.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/runtime/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', 'dist/'],
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Slice H — Automated Runtime Verification.
 *
 * Minimal Playwright configuration. Single Chromium target only;
 * no visual regression, no screenshot testing, no cross-browser
 * matrix. The suite exists to close Phase 3B (Interactive Runtime
 * Verification) automatically per docs/release/release-verification-policy.md.
 *
 * Base URL is controlled by PLAYWRIGHT_BASE_URL. Locally, run
 * `npm run preview` in one shell and `npm run verify:runtime` in
 * another. Against production, set
 * PLAYWRIGHT_BASE_URL=https://makeyoudiscplined.netlify.app and run
 * `npm run verify:runtime` — no local server needed.
 */
export default defineConfig({
  testDir: './tests/runtime',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

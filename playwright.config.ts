import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against the demo build, which has the mock API
 * (ADR 0008). In CI, E2E_BASE_URL points at the Docker image, so the journeys
 * also prove the nginx configuration. Locally, without it, the demo is built
 * and served by `vite preview`.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4173'
const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  // A retry in CI records a trace of the failure; locally a failure is final.
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    // The smallest width the app supports (NFR, CLAUDE.md "Mobile first").
    {
      name: 'mobile-chromium',
      use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 } },
    },
    // Safari's engine: testers found iPhone-only bugs (#74, #75, #76).
    { name: 'mobile-webkit', use: { ...devices['iPhone 15'] } },
  ],
  ...(!process.env.E2E_BASE_URL && {
    webServer: {
      command: 'npm run build && npm run preview -- --port 4173 --strictPort',
      env: { VITE_ENABLE_MOCKS: 'true' },
      url: baseURL,
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
  }),
})

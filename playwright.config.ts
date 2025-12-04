import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/web',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,

  use: {
    baseURL: process.env.CENTY_APP_URL || 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd ../centy-app && pnpm dev',
        url: 'http://localhost:5180',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});

// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com',
    extraHTTPHeaders: { Accept: 'application/json' },
    timeout: 15_000,
    trace: 'retain-on-failure',
  },
});

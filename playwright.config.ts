import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 3,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://petstore.swagger.io/v2/',
    extraHTTPHeaders: {
      api_key: 'special-key',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },
});
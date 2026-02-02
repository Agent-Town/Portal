// @ts-check
const { defineConfig } = require('@playwright/test');
const fs = require('fs');

// In some environments (CI sandboxes, offline containers) Playwright can't
// download its managed browsers. If a system Chromium is available, use it.
const SYSTEM_CHROMIUM = ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        ...(SYSTEM_CHROMIUM
          ? {
              launchOptions: {
                executablePath: SYSTEM_CHROMIUM,
                args: ['--no-sandbox']
              }
            }
          : {})
      }
    }
  ],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    // Use `exec` so the node process replaces the shell. This helps Playwright
    // reliably terminate the server across environments.
    command: 'exec node server/index.js',
    url: 'http://localhost:4173/api/health',
    // Always start/stop the server for deterministic local + CI runs.
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'test',
      PORT: '4173'
    }
  }
});

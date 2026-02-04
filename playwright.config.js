// @ts-check
const { defineConfig } = require('@playwright/test');
const fs = require('fs');

// In some environments (CI sandboxes, offline containers) Playwright can't
// download its managed browsers. If a system Chromium is available, use it.
const SYSTEM_CHROMIUM = ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));

const PORT = Number(process.env.PW_PORT || (process.env.CI ? 4173 : 4174));

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
    // Use IPv6 loopback explicitly; on this machine, 127.0.0.1 may be proxied.
    baseURL: `http://[::1]:${PORT}`,
    trace: 'on-first-retry'
  },
  webServer: {
    // Use `exec` so the node process replaces the shell. This helps Playwright
    // reliably terminate the server across environments.
    command: 'exec node server/index.js',
    url: `http://[::1]:${PORT}/api/health`,
    // Always start/stop the server for deterministic local + CI runs.
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'test',
      PORT: String(PORT),
      TEST_RESET_TOKEN: 'test-reset',
      // Avoid modifying tracked data/store.test.json during e2e runs.
      STORE_PATH: require('path').join(process.cwd(), 'data', 'store.e2e.json')
    }
  }
});

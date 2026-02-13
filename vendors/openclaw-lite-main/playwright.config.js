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
  // Tests share one webServer instance + in-memory session state.
  // Parallel workers would race on /__test__/reset and break determinism.
  workers: 1,
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
      // Deterministic Ed25519 seed used by /__test__/wallet/seed and token-gating shortcuts.
      TEST_WALLET_SEED_HEX: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      TEST_EVM_PRIVATE_KEY: '0x59c6995e998f97a5a0044966f0945381d1d0e6f94f7f8f6fe1d9a8f8a9f2f9d3',
      // Avoid modifying tracked data/store.json during e2e runs.
      STORE_PATH: require('path').join(process.cwd(), 'data', 'store.e2e.sqlite')
    }
  }
});

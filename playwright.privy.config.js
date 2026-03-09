// @ts-check
const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { loadDotEnv } = require('./server/env');

process.env.LOAD_DOTENV_IN_TEST = process.env.LOAD_DOTENV_IN_TEST || '1';
loadDotEnv(process.cwd());

if (!process.env.ENABLE_PRIVY_IN_TEST) process.env.ENABLE_PRIVY_IN_TEST = '1';
if (!process.env.PRIVY_LOGIN_METHOD) process.env.PRIVY_LOGIN_METHOD = 'guest';
if (!process.env.START_PAGE_ENABLED && process.env.PRIVY_APP_ID) process.env.START_PAGE_ENABLED = '1';

const SYSTEM_CHROMIUM = ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
const PORT = Number(process.env.PW_PORT || 4175);
const STORE_PATH = process.env.STORE_PATH || path.join(process.cwd(), 'data', 'store.e2e.privy.sqlite');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: ['155_privy_live_guest_wallet.spec.js'],
  timeout: 120_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
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
    // Privy/start flow canonicalizes loopback hosts to localhost.
    // Keep Playwright on the same origin so cookies + localStorage survive
    // document navigations between /start, /app, and /create.
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'exec node server/index.js',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(PORT),
      TEST_RESET_TOKEN: process.env.TEST_RESET_TOKEN || 'test-reset',
      ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'test-admin',
      LOAD_DOTENV_IN_TEST: '1',
      ENABLE_PRIVY_IN_TEST: '1',
      PRIVY_LOGIN_METHOD: process.env.PRIVY_LOGIN_METHOD || 'guest',
      START_PAGE_ENABLED: process.env.START_PAGE_ENABLED || (process.env.PRIVY_APP_ID ? '1' : '0'),
      STORE_PATH,
    }
  }
});

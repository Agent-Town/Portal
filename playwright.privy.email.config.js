// @ts-check
const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { loadDotEnv } = require('./server/env');

const LIVE_NODE_ENV = 'development';
process.env.NODE_ENV = LIVE_NODE_ENV;
loadDotEnv(process.cwd());

process.env.PRIVY_LOGIN_METHOD = 'email';
if (!process.env.START_PAGE_ENABLED && process.env.PRIVY_APP_ID) process.env.START_PAGE_ENABLED = '1';

const SYSTEM_CHROMIUM = ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
const PORT = Number(process.env.PW_PORT || 4176);
const STORE_PATH = process.env.STORE_PATH || path.join(process.cwd(), 'data', 'store.e2e.privy-email-live.sqlite');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: ['163_privy_live_email_wallet.spec.js'],
  timeout: 180_000,
  expect: { timeout: 15_000 },
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
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'exec node scripts/start_live_server.js',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    env: {
      ...process.env,
      NODE_ENV: LIVE_NODE_ENV,
      PORT: String(PORT),
      ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'test-admin',
      PRIVY_LOGIN_METHOD: 'email',
      START_PAGE_ENABLED: process.env.START_PAGE_ENABLED || (process.env.PRIVY_APP_ID ? '1' : '0'),
      STORE_PATH,
    }
  }
});

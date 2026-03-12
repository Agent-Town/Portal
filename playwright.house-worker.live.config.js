// @ts-check
const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { loadDotEnv } = require('./server/env');

loadDotEnv(process.cwd());

const SYSTEM_CHROMIUM = ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
const baseURL = String(process.env.HOUSE_WORKER_LIVE_BASE_URL || process.env.BASE_URL || '').trim() || 'http://localhost:3000';
const storageState = String(process.env.HOUSE_WORKER_LIVE_STORAGE_STATE || '').trim();

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: ['246_house_worker_operator_live_gate.spec.js'],
  timeout: 240_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: false,
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
    baseURL,
    storageState: storageState ? path.resolve(storageState) : undefined,
    trace: 'on-first-retry',
  },
});

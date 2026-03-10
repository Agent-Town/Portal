const { test, expect } = require('@playwright/test');
const path = require('path');
const { execFileSync } = require('child_process');

const { resetPortalWebState } = require('./helpers/portal_web');

const repoRoot = path.join(__dirname, '..');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.5: live suite manifest is machine-readable and missing env fails with one stable setup message', async ({ request }) => {
  const response = await request.get('/__test__/live-suites', {
    headers: { 'x-test-reset': process.env.TEST_RESET_TOKEN || 'test-reset' },
  });
  const payload = await response.json();
  expect(payload.ok).toBe(true);
  const suites = Array.isArray(payload.suites) ? payload.suites : [];
  const statuses = Array.isArray(payload.statuses) ? payload.statuses : [];
  const suiteIds = suites.map((entry) => String(entry.suiteId || ''));
  expect(suiteIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet']));
  const statusIds = statuses.map((entry) => String(entry.suiteId || ''));
  expect(statusIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet']));
  for (const suite of suites) {
    expect(String(suite.suiteId || '')).toBeTruthy();
    expect(String(suite.command || '')).toBeTruthy();
    expect(Array.isArray(suite.requiredEnv)).toBe(true);
    expect(suite.requiredEnv.length).toBeGreaterThan(0);
    expect(String(suite.defaultMode || '')).toBeTruthy();
  }
  for (const status of statuses) {
    expect(String(status.suiteId || '')).toBeTruthy();
    expect(typeof status.ready).toBe('boolean');
    expect(Array.isArray(status.missing)).toBe(true);
    expect(Array.isArray(status.mismatched)).toBe(true);
    expect(Array.isArray(status.requirements)).toBe(true);
    expect(String(status.mode || '')).toMatch(/^(ready|skip|blocked)$/);
  }

  const manifestOutput = execFileSync('node', ['scripts/test_live.js', '--list'], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
  });
  const listedSuites = JSON.parse(manifestOutput);
  const listedIds = listedSuites.map((entry) => String(entry.suiteId || ''));
  expect(listedIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet']));

  const statusOutput = execFileSync('node', ['scripts/test_live.js', '--status'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PRIVY_APP_ID: '',
      PRIVY_LOGIN_METHOD: '',
      PRIVY_EMAIL_OTP_PROVIDER: '',
      PRIVY_EMAIL_OTP_FETCH_URL: '',
      PRIVY_EMAIL_OTP_TEST_EMAIL: '',
      PRIVY_LIVE_REQUIRED: '',
      PRIVY_EMAIL_OTP_REQUIRED: '',
      REAL_SEPOLIA_WALLET_TEST: '',
      SEPOLIA_TEST_WALLET_ADDRESS: '',
    },
    encoding: 'utf8',
  });
  const listedStatuses = JSON.parse(statusOutput);
  const privyGuestStatus = listedStatuses.find((entry) => String(entry.suiteId || '') === 'privy-guest');
  expect(privyGuestStatus).toMatchObject({
    suiteId: 'privy-guest',
    ready: false,
    mode: 'skip',
    missing: ['PRIVY_APP_ID', 'PRIVY_LOGIN_METHOD=guest'],
    mismatched: [],
  });

  const mismatchStatusOutput = execFileSync('node', ['scripts/test_live.js', '--status', 'privy-guest'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PRIVY_APP_ID: 'app_live_fixture',
      PRIVY_LOGIN_METHOD: 'email',
      PRIVY_LIVE_REQUIRED: '1',
    },
    encoding: 'utf8',
  });
  const mismatchStatuses = JSON.parse(mismatchStatusOutput);
  expect(mismatchStatuses).toHaveLength(1);
  expect(mismatchStatuses[0]).toMatchObject({
    suiteId: 'privy-guest',
    ready: false,
    mode: 'blocked',
    missing: [],
    mismatched: ['PRIVY_LOGIN_METHOD=guest'],
  });

  let setupError = null;
  try {
    execFileSync('node', ['scripts/test_live.js', '--check', 'privy-email-otp'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PRIVY_APP_ID: '',
        PRIVY_LOGIN_METHOD: '',
        PRIVY_EMAIL_OTP_PROVIDER: '',
        PRIVY_EMAIL_OTP_FETCH_URL: '',
        PRIVY_EMAIL_OTP_TEST_EMAIL: '',
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    setupError = err;
  }
  expect(setupError).toBeTruthy();
  const stderr = String(setupError?.stderr || '');
  expect(stderr).toContain('LIVE_SUITE_SETUP_REQUIRED:privy-email-otp:');
  expect(stderr).toContain('PRIVY_APP_ID');
  expect(stderr).toContain('PRIVY_EMAIL_OTP_PROVIDER');

  let mismatchError = null;
  try {
    execFileSync('node', ['scripts/test_live.js', '--check', 'privy-guest'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PRIVY_APP_ID: 'app_live_fixture',
        PRIVY_LOGIN_METHOD: 'email',
        PRIVY_LIVE_REQUIRED: '1',
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    mismatchError = err;
  }
  expect(mismatchError).toBeTruthy();
  expect(String(mismatchError?.stderr || '')).toContain('LIVE_SUITE_SETUP_REQUIRED:privy-guest:PRIVY_LOGIN_METHOD=guest');
});

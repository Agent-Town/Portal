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
  const suiteIds = suites.map((entry) => String(entry.suiteId || ''));
  expect(suiteIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet']));
  for (const suite of suites) {
    expect(String(suite.suiteId || '')).toBeTruthy();
    expect(String(suite.command || '')).toBeTruthy();
    expect(Array.isArray(suite.requiredEnv)).toBe(true);
    expect(suite.requiredEnv.length).toBeGreaterThan(0);
    expect(String(suite.defaultMode || '')).toBeTruthy();
  }

  const manifestOutput = execFileSync('node', ['scripts/test_live.js', '--list'], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
  });
  const listedSuites = JSON.parse(manifestOutput);
  const listedIds = listedSuites.map((entry) => String(entry.suiteId || ''));
  expect(listedIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet']));

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
});

const { test, expect } = require('@playwright/test');
const fs = require('fs');
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
  expect(suiteIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet', 'house-worker-operator']));
  const statusIds = statuses.map((entry) => String(entry.suiteId || ''));
  expect(statusIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet', 'house-worker-operator']));
  for (const suite of suites) {
    expect(String(suite.suiteId || '')).toBeTruthy();
    expect(String(suite.command || '')).toBeTruthy();
    expect(Array.isArray(suite.requiredEnv)).toBe(true);
    expect(suite.requiredEnv.length).toBeGreaterThan(0);
    expect(String(suite.defaultMode || '')).toBeTruthy();
  }
  const emailSuite = suites.find((entry) => String(entry.suiteId || '') === 'privy-email-otp');
  const guestSuite = suites.find((entry) => String(entry.suiteId || '') === 'privy-guest');
  expect(guestSuite?.forcedEnv).toEqual(['PRIVY_LOGIN_METHOD=guest']);
  expect(emailSuite?.forcedEnv).toEqual(['PRIVY_LOGIN_METHOD=email']);
  expect(emailSuite?.providerEnv).toMatchObject({
    'http-json': expect.arrayContaining(['PRIVY_EMAIL_OTP_FETCH_URL']),
    imap: expect.arrayContaining(['PRIVY_EMAIL_OTP_IMAP_HOST', 'PRIVY_EMAIL_OTP_IMAP_PASSWORD']),
    'gmail-imap': expect.arrayContaining(['PRIVY_EMAIL_OTP_IMAP_PASSWORD']),
  });
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
  expect(listedIds).toEqual(expect.arrayContaining(['privy-guest', 'privy-email-otp', 'sepolia-wallet', 'house-worker-operator']));
  const sepoliaSuite = listedSuites.find((entry) => String(entry.suiteId || '') === 'sepolia-wallet');
  expect(String(sepoliaSuite?.command || '')).toBe('npm run test:sepolia-live');
  const houseWorkerSuite = listedSuites.find((entry) => String(entry.suiteId || '') === 'house-worker-operator');
  expect(String(houseWorkerSuite?.command || '')).toBe('npm run test:house-worker-live');
  expect(String(houseWorkerSuite?.captureCommand || '')).toBe('npm run capture:house-worker-live-state');

  const statusOutput = execFileSync('node', ['scripts/test_live.js', '--status'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PRIVY_APP_ID: '',
      PRIVY_LOGIN_METHOD: '',
      PRIVY_EMAIL_OTP_PROVIDER: '',
      PRIVY_EMAIL_OTP_FETCH_URL: '',
      PRIVY_EMAIL_OTP_TEST_EMAIL: '',
      PRIVY_EMAIL_OTP_IMAP_HOST: '',
      PRIVY_EMAIL_OTP_IMAP_PASSWORD: '',
      PRIVY_LIVE_REQUIRED: '',
      PRIVY_EMAIL_OTP_REQUIRED: '',
      REAL_SEPOLIA_WALLET_TEST: '',
      LOCAL_SEPOLIA_WALLET_FILE: path.join(repoRoot, 'test-results', 'missing.sepolia.wallet.json'),
      HOUSE_WORKER_LIVE_REQUIRED: '',
      HOUSE_WORKER_LIVE_BASE_URL: '',
      HOUSE_WORKER_LIVE_STORAGE_STATE: path.join(repoRoot, 'test-results', 'missing.house-worker.storage-state.json'),
      HOUSE_WORKER_LIVE_PROVIDER: '',
      HOUSE_WORKER_LIVE_MODEL: '',
      HOUSE_WORKER_LIVE_API_KEY: '',
    },
    encoding: 'utf8',
  });
  const listedStatuses = JSON.parse(statusOutput);
  const privyGuestStatus = listedStatuses.find((entry) => String(entry.suiteId || '') === 'privy-guest');
  expect(privyGuestStatus).toMatchObject({
    suiteId: 'privy-guest',
    ready: false,
    mode: 'skip',
    missing: ['PRIVY_APP_ID'],
    mismatched: [],
  });
  const sepoliaStatus = listedStatuses.find((entry) => String(entry.suiteId || '') === 'sepolia-wallet');
  expect(sepoliaStatus).toMatchObject({
    suiteId: 'sepolia-wallet',
    ready: false,
    mode: 'skip',
    missing: ['REAL_SEPOLIA_WALLET_TEST=1', 'LOCAL_SEPOLIA_WALLET_CONFIGURED'],
    mismatched: [],
  });
  const emailStatus = listedStatuses.find((entry) => String(entry.suiteId || '') === 'privy-email-otp');
  expect(emailStatus).toMatchObject({
    suiteId: 'privy-email-otp',
    ready: false,
    mode: 'skip',
    missing: ['PRIVY_APP_ID', 'PRIVY_EMAIL_OTP_PROVIDER', 'PRIVY_EMAIL_OTP_TEST_EMAIL'],
  });
  const houseWorkerStatus = listedStatuses.find((entry) => String(entry.suiteId || '') === 'house-worker-operator');
  expect(houseWorkerStatus).toMatchObject({
    suiteId: 'house-worker-operator',
    captureCommand: 'npm run capture:house-worker-live-state',
    ready: false,
    mode: 'skip',
    missing: expect.arrayContaining([
      'HOUSE_WORKER_LIVE_BASE_URL',
      'HOUSE_WORKER_LIVE_PROVIDER',
      'HOUSE_WORKER_LIVE_MODEL',
      'HOUSE_WORKER_LIVE_API_KEY',
      'HOUSE_WORKER_LIVE_STORAGE_STATE_READY',
    ]),
  });

  const emailImapStatusOutput = execFileSync('node', ['scripts/test_live.js', '--status', 'privy-email-otp'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PRIVY_APP_ID: 'app_live_fixture',
      PRIVY_EMAIL_OTP_PROVIDER: 'gmail-imap',
      PRIVY_EMAIL_OTP_TEST_EMAIL: 'elizatown.mail@gmail.com',
      PRIVY_EMAIL_OTP_IMAP_PASSWORD: '',
      PRIVY_EMAIL_OTP_REQUIRED: '1',
    },
    encoding: 'utf8',
  });
  const emailImapStatuses = JSON.parse(emailImapStatusOutput);
  expect(emailImapStatuses).toHaveLength(1);
  expect(emailImapStatuses[0]).toMatchObject({
    suiteId: 'privy-email-otp',
    provider: 'gmail-imap',
    ready: false,
    mode: 'blocked',
    missing: ['PRIVY_EMAIL_OTP_IMAP_PASSWORD'],
  });

  const emailReadyOutput = execFileSync('node', ['scripts/test_live.js', '--status', 'privy-email-otp'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PRIVY_APP_ID: 'app_live_fixture',
      PRIVY_EMAIL_OTP_PROVIDER: 'gmail-imap',
      PRIVY_EMAIL_OTP_TEST_EMAIL: 'elizatown.mail@gmail.com',
      PRIVY_EMAIL_OTP_IMAP_PASSWORD: 'app-password',
      PRIVY_EMAIL_OTP_REQUIRED: '1',
    },
    encoding: 'utf8',
  });
  const emailReadyStatuses = JSON.parse(emailReadyOutput);
  expect(emailReadyStatuses).toHaveLength(1);
  expect(emailReadyStatuses[0]).toMatchObject({
    suiteId: 'privy-email-otp',
    provider: 'gmail-imap',
    ready: true,
    mode: 'ready',
    missing: [],
    mismatched: [],
  });

  const liveStoragePath = path.join(repoRoot, 'test-results', 'house-worker.live.storage-state.json');
  fs.writeFileSync(liveStoragePath, JSON.stringify({
    cookies: [{ name: 'portal.sid', value: 'live-session', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
    origins: [],
  }));
  const houseWorkerReadyOutput = execFileSync('node', ['scripts/test_live.js', '--status', 'house-worker-operator'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      HOUSE_WORKER_LIVE_BASE_URL: 'http://localhost:3000',
      HOUSE_WORKER_LIVE_STORAGE_STATE: liveStoragePath,
      HOUSE_WORKER_LIVE_PROVIDER: 'openai',
      HOUSE_WORKER_LIVE_MODEL: 'gpt-4.1-mini',
      HOUSE_WORKER_LIVE_API_KEY: 'live-key',
      HOUSE_WORKER_LIVE_REQUIRED: '1',
    },
    encoding: 'utf8',
  });
  const houseWorkerReadyStatuses = JSON.parse(houseWorkerReadyOutput);
  expect(houseWorkerReadyStatuses).toHaveLength(1);
  expect(houseWorkerReadyStatuses[0]).toMatchObject({
    suiteId: 'house-worker-operator',
    ready: true,
    mode: 'ready',
    missing: [],
    mismatched: [],
  });

  let setupError = null;
  try {
    execFileSync('node', ['scripts/test_live.js', '--check', 'privy-email-otp'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PRIVY_APP_ID: '',
        PRIVY_EMAIL_OTP_PROVIDER: '',
        PRIVY_EMAIL_OTP_FETCH_URL: '',
        PRIVY_EMAIL_OTP_TEST_EMAIL: '',
        PRIVY_EMAIL_OTP_IMAP_HOST: '',
        PRIVY_EMAIL_OTP_IMAP_PASSWORD: '',
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
        PRIVY_APP_ID: '',
        PRIVY_LIVE_REQUIRED: '1',
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    mismatchError = err;
  }
  expect(mismatchError).toBeTruthy();
  expect(String(mismatchError?.stderr || '')).toContain('LIVE_SUITE_SETUP_REQUIRED:privy-guest:PRIVY_APP_ID');

  let houseWorkerSetupError = null;
  try {
    execFileSync('node', ['scripts/test_live.js', '--check', 'house-worker-operator'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HOUSE_WORKER_LIVE_BASE_URL: '',
        HOUSE_WORKER_LIVE_STORAGE_STATE: '',
        HOUSE_WORKER_LIVE_PROVIDER: '',
        HOUSE_WORKER_LIVE_MODEL: '',
        HOUSE_WORKER_LIVE_API_KEY: '',
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    houseWorkerSetupError = err;
  }
  expect(houseWorkerSetupError).toBeTruthy();
  expect(String(houseWorkerSetupError?.stderr || '')).toContain('LIVE_SUITE_SETUP_REQUIRED:house-worker-operator:');
  expect(String(houseWorkerSetupError?.stderr || '')).toContain('HOUSE_WORKER_LIVE_BASE_URL');
  expect(String(houseWorkerSetupError?.stderr || '')).toContain('HOUSE_WORKER_LIVE_STORAGE_STATE');

  const configAuditOutput = execFileSync(
    'node',
    [
      '-e',
      `const guest = require('./playwright.privy.config.js');
const email = require('./playwright.privy.email.config.js');
const houseWorker = require('./playwright.house-worker.live.config.js');
const sepolia = require('./playwright.sepolia.live.config.js');
const isTruthy = (value) => /^(1|true|yes|on)$/i.test(String(value || ''));
const payload = {
  guest: {
    nodeEnv: guest?.webServer?.env?.NODE_ENV || null,
    testResetToken: guest?.webServer?.env?.TEST_RESET_TOKEN || null,
    enablePrivyInTest: isTruthy(guest?.webServer?.env?.ENABLE_PRIVY_IN_TEST),
    command: guest?.webServer?.command || '',
  },
  email: {
    nodeEnv: email?.webServer?.env?.NODE_ENV || null,
    testResetToken: email?.webServer?.env?.TEST_RESET_TOKEN || null,
    enablePrivyInTest: isTruthy(email?.webServer?.env?.ENABLE_PRIVY_IN_TEST),
    command: email?.webServer?.command || '',
  },
  houseWorker: {
    hasWebServer: !!houseWorker?.webServer,
    testMatch: Array.isArray(houseWorker?.testMatch) ? houseWorker.testMatch : [],
    headless: houseWorker?.projects?.[0]?.use?.headless ?? null,
  },
  sepolia: {
    hasWebServer: !!sepolia?.webServer,
    testMatch: Array.isArray(sepolia?.testMatch) ? sepolia.testMatch : [],
  },
};
process.stdout.write(JSON.stringify(payload));`,
    ],
    {
      cwd: repoRoot,
      env: { ...process.env },
      encoding: 'utf8',
    }
  );
  const configAudit = JSON.parse(configAuditOutput);
  expect(configAudit.guest).toMatchObject({
    nodeEnv: 'development',
    testResetToken: null,
    enablePrivyInTest: false,
  });
  expect(String(configAudit.guest.command || '')).toContain('scripts/start_live_server.js');
  expect(configAudit.email).toMatchObject({
    nodeEnv: 'development',
    testResetToken: null,
    enablePrivyInTest: false,
  });
  expect(String(configAudit.email.command || '')).toContain('scripts/start_live_server.js');
  expect(configAudit.houseWorker).toMatchObject({
    hasWebServer: false,
    testMatch: ['246_house_worker_operator_live_gate.spec.js'],
    headless: false,
  });
  expect(configAudit.sepolia).toMatchObject({
    hasWebServer: false,
    testMatch: ['10_sepolia_wallet_reuse.spec.js'],
  });
});

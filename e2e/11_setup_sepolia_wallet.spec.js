const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('setup script writes reusable local sepolia wallet config', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'et-wallet-'));
  const walletFile = path.join(tmpDir, 'local.sepolia.wallet.json');
  const address = '0x1111111111111111111111111111111111111111';

  const run = spawnSync('node', ['scripts/setup_sepolia_wallet.js', '--address', address, '--no-balance-check'], {
    cwd: process.cwd(),
    env: { ...process.env, LOCAL_SEPOLIA_WALLET_FILE: walletFile },
    encoding: 'utf8'
  });

  expect(run.status).toBe(0);
  expect(fs.existsSync(walletFile)).toBeTruthy();

  const parsed = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
  expect(parsed.address).toBe(address);
  expect(parsed.network).toBe('sepolia');
  expect(typeof parsed.updatedAt).toBe('string');

  const rerun = spawnSync('node', ['scripts/setup_sepolia_wallet.js', '--address', address, '--no-balance-check'], {
    cwd: process.cwd(),
    env: { ...process.env, LOCAL_SEPOLIA_WALLET_FILE: walletFile },
    encoding: 'utf8'
  });

  expect(rerun.status).toBe(0);
  const parsed2 = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
  expect(parsed2.address).toBe(address);
});

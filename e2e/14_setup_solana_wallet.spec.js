const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { isValidAddress, isValidSecretKey } = require('./helpers/solana_wallet');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('setup script writes reusable local solana devnet wallet config', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'et-solana-wallet-'));
  const walletFile = path.join(tmpDir, 'local.solana.devnet.wallet.json');

  const run = spawnSync('node', ['scripts/setup_solana_wallet.js', '--no-balance-check'], {
    cwd: process.cwd(),
    env: { ...process.env, LOCAL_SOLANA_DEVNET_WALLET_FILE: walletFile },
    encoding: 'utf8'
  });

  expect(run.status).toBe(0);
  expect(fs.existsSync(walletFile)).toBeTruthy();

  const parsed = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
  expect(isValidAddress(parsed.address)).toBeTruthy();
  expect(isValidSecretKey(parsed.secretKey)).toBeTruthy();
  expect(parsed.network).toBe('solana-devnet');
  expect(typeof parsed.updatedAt).toBe('string');

  const rerun = spawnSync('node', ['scripts/setup_solana_wallet.js', '--no-balance-check'], {
    cwd: process.cwd(),
    env: { ...process.env, LOCAL_SOLANA_DEVNET_WALLET_FILE: walletFile },
    encoding: 'utf8'
  });

  expect(rerun.status).toBe(0);
  const parsed2 = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
  expect(parsed2.address).toBe(parsed.address);
  expect(parsed2.secretKey).toBe(parsed.secretKey);
});

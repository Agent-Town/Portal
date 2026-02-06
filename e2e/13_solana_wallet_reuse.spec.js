const { test, expect } = require('@playwright/test');

const {
  DEFAULT_FAUCET_URL,
  ensureWalletFile,
  readWalletConfig,
  isValidAddress,
  getDevnetBalanceLamports,
  lamportsToSolString,
  minLamportsFromEnv
} = require('./helpers/solana_wallet');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const REAL_WALLET_TEST = process.env.REAL_SOLANA_WALLET_TEST === '1';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test.describe('local solana devnet wallet reuse', () => {
  test.skip(!REAL_WALLET_TEST, 'Set REAL_SOLANA_WALLET_TEST=1 for local wallet integration checks.');

  test('reuses one wallet config per install', async () => {
    const fileA = ensureWalletFile();
    const first = readWalletConfig();
    const second = readWalletConfig();

    expect(first.file).toBe(fileA);
    expect(second.file).toBe(fileA);
    expect(first.config.address).toBe(second.config.address);
    if (!isValidAddress(first.config.address)) {
      throw new Error(`Wallet address is not configured in ${first.file}. Run: npm run setup:solana-wallet`);
    }
  });

  test('checks solana devnet balance before faucet use', async () => {
    const { file, config } = readWalletConfig();
    if (!isValidAddress(config.address)) {
      throw new Error(`Wallet address is not configured in ${file}. Run: npm run setup:solana-wallet`);
    }

    const minLamports = minLamportsFromEnv();
    const balanceLamports = await getDevnetBalanceLamports(config.address);

    expect(typeof balanceLamports).toBe('bigint');

    if (balanceLamports < minLamports) {
      const msg = [
        `Wallet ${config.address} in ${file} has ${lamportsToSolString(balanceLamports)} devnet SOL,`,
        `below required minimum ${lamportsToSolString(minLamports)}.`,
        `Top up first via ${DEFAULT_FAUCET_URL}.`
      ].join(' ');
      throw new Error(msg);
    }
  });
});

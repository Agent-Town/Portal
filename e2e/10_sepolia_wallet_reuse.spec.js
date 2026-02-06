const { test, expect } = require('@playwright/test');

const {
  DEFAULT_FAUCET_URL,
  ensureWalletFile,
  readWalletConfig,
  isValidAddress,
  getSepoliaBalanceWei,
  weiToEthString,
  minWeiFromEnv
} = require('./helpers/sepolia_wallet');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const REAL_WALLET_TEST = process.env.REAL_SEPOLIA_WALLET_TEST === '1';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test.describe('local sepolia wallet reuse', () => {
  test.skip(!REAL_WALLET_TEST, 'Set REAL_SEPOLIA_WALLET_TEST=1 for local wallet integration checks.');

  test('reuses one wallet config per install', async () => {
    const fileA = ensureWalletFile();
    const first = readWalletConfig();
    const second = readWalletConfig();

    expect(first.file).toBe(fileA);
    expect(second.file).toBe(fileA);
    expect(first.config.address).toBe(second.config.address);
    if (!isValidAddress(first.config.address)) {
      throw new Error(`Wallet address is not configured in ${first.file}. Run: npm run setup:sepolia-wallet`);
    }
  });

  test('checks sepolia balance before faucet use', async () => {
    const { file, config } = readWalletConfig();
    if (!isValidAddress(config.address)) {
      throw new Error(`Wallet address is not configured in ${file}. Run: npm run setup:sepolia-wallet`);
    }

    const minWei = minWeiFromEnv();
    const balWei = await getSepoliaBalanceWei(config.address);

    expect(typeof balWei).toBe('bigint');

    if (balWei < minWei) {
      const msg = [
        `Wallet ${config.address} in ${file} has ${weiToEthString(balWei)} Sepolia ETH,`,
        `below required minimum ${weiToEthString(minWei)}.`,
        `Top up first via ${DEFAULT_FAUCET_URL}.`
      ].join(' ');
      throw new Error(msg);
    }
  });
});

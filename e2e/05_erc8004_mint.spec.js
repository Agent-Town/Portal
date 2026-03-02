const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('ERC-8004 UI stays hidden on house page', async ({ page }) => {
  // Mock Solana wallet + EVM wallet + ag0 SDK
  await page.addInitScript(() => {
    // Solana mock
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 17) & 0xff;
    const solanaAddress = 'So1anaMockMint11111111111111111111111111111';
    const evmAddress = '0x000000000000000000000000000000000000dEaD';
    const evmProvider = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') return [evmAddress];
        if (method === 'eth_chainId') return '0xaa36a7'; // sepolia
        if (method === 'wallet_switchEthereumChain') return null;
        if (method === 'personal_sign') return '0x';
        throw new Error(`unhandled method ${method} ${JSON.stringify(params || [])}`);
      }
    };
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: solanaAddress }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => solanaAddress } }),
      connectEvm: async () => ({ address: evmAddress, provider: evmProvider }),
      signEvmMessage: async () => '0x',
      getEvmProvider: () => evmProvider
    };

    // ag0 SDK mock
    class SDK {
      constructor() {}
      createAgent(name, description) {
        return {
          registerHTTP: async () => ({ hash: '0xfeedbeef' })
        };
      }
    }
    window.__AG0_SDK_MOCK = { SDK };
  });

  await page.goto('/');
  await reachCreateViaLite(page);

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  await expect(page.locator('#erc8004Panel')).toBeHidden();
  await expect(page.locator('#toggleErc8004Btn')).toHaveClass(/is-hidden/);
  await expect(page.locator('#mintErc8004Btn')).toBeHidden();
});

const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('house unlock is wallet-signature gated (mocked wallet)', async ({ page, request }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (255 - i) & 0xff;
    const solanaAddress = 'So1anaMock222222222222222222222222222222222';
    const evmAddress = '0x1111111111111111111111111111111111111111';
    const evmProvider = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') return [evmAddress];
        if (method === 'eth_chainId') return '0xaa36a7'; // sepolia
        if (method === 'wallet_switchEthereumChain') return null;
        if (method === 'personal_sign') return '0x';
        throw new Error(`unmocked evmProvider.request: ${method} ${JSON.stringify(params || [])}`);
      }
    };
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: solanaAddress }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => solanaAddress } }),
      connectEvm: async () => ({ address: evmAddress }),
      signEvmMessage: async () => '0x',
      getEvmProvider: () => evmProvider
    };

    window.__AG0_SDK_MOCK = {
      SDK: class SDK {
        constructor() {}
        createAgent() {
          return {
            setMetadata: () => {},
            registerHTTP: async () => ({
              hash: '0xdeadbeef',
              waitConfirmed: async () => ({
                receipt: { status: 'success' },
                result: { agentId: '11155111:123' }
              })
            })
          };
        }
      }
    };
  });
  await reachCreateViaLite(page);

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  await expect(page.getByRole('button', { name: 'Sign to unlock' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toHaveCount(0);

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

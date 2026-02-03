const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset');
});

test('ERC-8004 mint uses ag0 SDK (mock) and reports submitted', async ({ page, request }) => {
  // Mock Solana wallet + EVM wallet + ag0 SDK
  await page.addInitScript(() => {
    // Solana mock
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 17) & 0xff;
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => 'So1anaMockMint11111111111111111111111111111' } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMockMint11111111111111111111111111111' } })
    };

    // EVM wallet mock
    window.ethereum = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') return ['0x000000000000000000000000000000000000dEaD'];
        if (method === 'eth_chainId') return '0xaa36a7'; // sepolia
        if (method === 'wallet_switchEthereumChain') return null;
        throw new Error(`unhandled method ${method}`);
      }
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
  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

  // Connect agent
  await request.post('/api/agent/connect', { data: { teamCode, agentName: 'ClawTest' } });

  // Match
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode, elementId: 'key' } });

  // Press beta
  await page.getByTestId('email').fill('test@example.com');
  await page.getByTestId('beta-btn').click();
  await request.post('/api/agent/beta/press', { data: { teamCode } });
  await page.waitForURL('**/create');

  // Agent ceremony
  // Use randomness to avoid deterministic roomId collisions when tests run in parallel workers.
  const ra = require('crypto').randomBytes(32);
  const raB64 = ra.toString('base64');
  const raCommit = require('crypto').createHash('sha256').update(ra).digest('base64');
  await request.post('/api/agent/room/commit', { data: { teamCode, commit: raCommit } });
  await request.post('/api/agent/room/reveal', { data: { teamCode, reveal: raB64 } });

  // Human paints + lock in
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/room\?room=/);

  // Unlock (solana sig)
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await page.getByRole('button', { name: 'Sign to unlock' }).click();

  // Mint
  await page.getByRole('button', { name: 'Mint ERC-8004 identity' }).click();
  await expect(page.locator('#erc8004MintStatus')).toContainText('0xfeedbeef');
});

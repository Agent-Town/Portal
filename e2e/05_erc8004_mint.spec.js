const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet, seedRecoverableTokenHouse } = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const MOCK_SOLANA_ADDRESS = 'So1anaMockToken1111111111111111111111111111';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function installWalletAndSdkMocks(page, {
  mintedAgentId = '11155111:947',
  registerHash = '0xfeedbeef'
} = {}) {
  await installMockSolanaWallet(page, { address: MOCK_SOLANA_ADDRESS, multiplier: 11 });
  await page.addInitScript(({ mintId, txHash }) => {
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
    const bridge = window.__PRIVY_WALLET_BRIDGE__ && typeof window.__PRIVY_WALLET_BRIDGE__ === 'object'
      ? window.__PRIVY_WALLET_BRIDGE__
      : {};
    window.__PRIVY_WALLET_BRIDGE__ = {
      ...bridge,
      connectEvm: async () => ({ address: evmAddress, provider: evmProvider }),
      signEvmMessage: async () => '0x',
      getEvmProvider: () => evmProvider
    };

    class SDK {
      constructor() {}

      createAgent() {
        return {
          registerHTTP: async (uri) => {
            window.__LAST_REGISTER_URI__ = String(uri || '');
            return {
              hash: txHash,
              waitConfirmed: async () => ({ result: { agentId: mintId } })
            };
          }
        };
      }
    }
    window.__AG0_SDK_MOCK = { SDK };
  }, { mintId: mintedAgentId, txHash: registerHash });
}

async function createAndOpenHouse(page, request, { ercFlag = false } = {}) {
  const seeded = await seedRecoverableTokenHouse(request, {
    address: MOCK_SOLANA_ADDRESS,
    signatureMultiplier: 11
  });
  const base = `/house?house=${encodeURIComponent(seeded.houseId)}`;
  await page.goto(ercFlag ? `${base}&erc8004=1` : base);
  await page.waitForURL(/\/house\?house=/, { timeout: 10000 });
  return seeded.houseId;
}

async function unlockHouse(page) {
  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();
}

test('M2.HOUSE.1 ERC-8004 panel stays hidden by default', async ({ page, request }) => {
  await installWalletAndSdkMocks(page);
  await createAndOpenHouse(page, request, { ercFlag: false });
  await unlockHouse(page);

  await expect(page.locator('#toggleErc8004Btn')).toHaveClass(/is-hidden/);
  await expect(page.locator('#erc8004Panel')).toBeHidden();
  await expect(page.locator('#mintErc8004Btn')).toBeHidden();
});

test('M2.HOUSE.2 ERC-8004 panel becomes reachable with query flag', async ({ page, request }) => {
  await installWalletAndSdkMocks(page);
  await createAndOpenHouse(page, request, { ercFlag: true });
  await unlockHouse(page);

  const toggle = page.locator('#toggleErc8004Btn');
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeEnabled();

  await toggle.click();
  await expect(page.locator('#erc8004Panel')).toBeVisible();
  await expect(page.locator('#anchorsPanel')).toBeVisible();
});

test('M2.HOUSE.3 Mint uses tokenUri and completes registration record', async ({ page, request }) => {
  await installWalletAndSdkMocks(page, { mintedAgentId: '11155111:947' });
  await createAndOpenHouse(page, request, { ercFlag: true });
  await unlockHouse(page);

  await page.locator('#toggleErc8004Btn').click();
  await expect(page.locator('#erc8004Panel')).toBeVisible();

  await page.locator('#mintErc8004Btn').click();
  await expect(page.locator('#erc8004MintStatus')).toContainText('Minted identity: 11155111:947', { timeout: 10000 });

  const tokenUri = await page.evaluate(() => window.__LAST_REGISTER_URI__ || '');
  expect(tokenUri).toBeTruthy();
  expect(tokenUri).toMatch(/\/api\/erc8004\/registration\/.+\.json$/);

  const registrationResp = await page.request.get(tokenUri);
  expect(registrationResp.ok()).toBeTruthy();
  const registrationJson = await registrationResp.json();
  expect(Array.isArray(registrationJson.registrations)).toBeTruthy();
  expect(registrationJson.registrations.length).toBe(1);
  expect(registrationJson.registrations[0].agentId).toBe(947);
});

test('M2.HOUSE.4 Minted identity persists across reload', async ({ page, request }) => {
  await installWalletAndSdkMocks(page, { mintedAgentId: '11155111:947' });
  await createAndOpenHouse(page, request, { ercFlag: true });
  await unlockHouse(page);

  await page.locator('#toggleErc8004Btn').click();
  await expect(page.locator('#erc8004Panel')).toBeVisible();
  await page.locator('#mintErc8004Btn').click();
  await expect(page.locator('#erc8004MintStatus')).toContainText('Minted identity: 11155111:947', { timeout: 10000 });

  await page.reload();
  await unlockHouse(page);
  await page.locator('#toggleErc8004Btn').click();

  await expect(page.locator('#anchorErc8004Id')).toHaveValue('11155111:947');
});

test('M2.API.1 Draft endpoint creates resolvable tokenUri', async ({ request }) => {
  const draftResp = await request.post('/api/erc8004/registration/draft', {
    data: {
      context: { kind: 'house', houseId: 'house_test_1' },
      entityType: 'human',
      name: 'Test Human',
      description: 'Test registration draft',
      image: 'https://example.com/human.png',
      services: [{ name: 'web', endpoint: 'https://example.com' }]
    }
  });
  expect(draftResp.status()).toBe(200);
  const draft = await draftResp.json();
  expect(draft.ok).toBeTruthy();
  expect(typeof draft.regId).toBe('string');
  expect(draft.regId.length).toBeGreaterThan(0);
  expect(draft.tokenUri).toContain('/api/erc8004/registration/');
  expect(draft.tokenUri.endsWith('.json')).toBeTruthy();
  expect(typeof draft.completionToken).toBe('string');
  expect(draft.completionToken.length).toBeGreaterThan(0);

  const getResp = await request.get(draft.tokenUri);
  expect(getResp.status()).toBe(200);
  const registration = await getResp.json();
  expect(registration.type).toBe('https://eips.ethereum.org/EIPS/eip-8004#registration-v1');
  expect(typeof registration.name).toBe('string');
  expect(registration.name.length).toBeGreaterThan(0);
  expect(Array.isArray(registration.services)).toBeTruthy();
  expect(registration.services.length).toBeGreaterThanOrEqual(1);
  expect(Array.isArray(registration.registrations)).toBeTruthy();
  expect(registration.entityType).toBe('human');
});

test('M2.API.2 Complete endpoint injects registrations[]', async ({ request }) => {
  const draftResp = await request.post('/api/erc8004/registration/draft', {
    data: {
      context: { kind: 'house', houseId: 'house_test_2' },
      entityType: 'house',
      name: 'Test House',
      description: 'Test house registration',
      image: 'https://example.com/house.png',
      services: [{ name: 'web', endpoint: 'https://example.com/house' }]
    }
  });
  expect(draftResp.status()).toBe(200);
  const draft = await draftResp.json();

  const completeResp = await request.post('/api/erc8004/registration/complete', {
    data: {
      regId: draft.regId,
      completionToken: draft.completionToken,
      onchain: {
        namespace: 'eip155',
        chainId: 11155111,
        identityRegistry: '0x8004a818bfb912233c491871b3d84c89a494bd9e',
        agentId: 947
      }
    }
  });
  expect(completeResp.status()).toBe(200);
  const complete = await completeResp.json();
  expect(complete.ok).toBeTruthy();

  const getResp = await request.get(draft.tokenUri);
  expect(getResp.status()).toBe(200);
  const registration = await getResp.json();
  expect(registration.registrations.length).toBe(1);
  expect(registration.registrations[0].agentId).toBe(947);
  expect(registration.registrations[0].agentRegistry).toBe('eip155:11155111:0x8004a818bfb912233c491871b3d84c89a494bd9e');
});

test('M2.API.3 Complete endpoint requires completion token and is immutable', async ({ request }) => {
  const draftResp = await request.post('/api/erc8004/registration/draft', {
    data: {
      context: { kind: 'house', houseId: 'house_test_3' },
      entityType: 'house',
      name: 'Immutable Test House',
      description: 'Immutable completion check',
      image: 'https://example.com/immutable.png',
      services: [{ name: 'web', endpoint: 'https://example.com/immutable' }]
    }
  });
  expect(draftResp.status()).toBe(200);
  const draft = await draftResp.json();

  const missingTokenResp = await request.post('/api/erc8004/registration/complete', {
    data: {
      regId: draft.regId,
      onchain: {
        namespace: 'eip155',
        chainId: 11155111,
        identityRegistry: '0x8004a818bfb912233c491871b3d84c89a494bd9e',
        agentId: 1001
      }
    }
  });
  expect(missingTokenResp.status()).toBe(400);
  const missingTokenBody = await missingTokenResp.json();
  expect(missingTokenBody.error).toBe('MISSING_COMPLETION_TOKEN');

  const firstCompleteResp = await request.post('/api/erc8004/registration/complete', {
    data: {
      regId: draft.regId,
      completionToken: draft.completionToken,
      onchain: {
        namespace: 'eip155',
        chainId: 11155111,
        identityRegistry: '0x8004a818bfb912233c491871b3d84c89a494bd9e',
        agentId: 1001
      }
    }
  });
  expect(firstCompleteResp.status()).toBe(200);

  const overwriteResp = await request.post('/api/erc8004/registration/complete', {
    data: {
      regId: draft.regId,
      completionToken: draft.completionToken,
      onchain: {
        namespace: 'eip155',
        chainId: 11155111,
        identityRegistry: '0x8004a818bfb912233c491871b3d84c89a494bd9e',
        agentId: 1002
      }
    }
  });
  expect(overwriteResp.status()).toBe(409);
  const overwriteBody = await overwriteResp.json();
  expect(overwriteBody.error).toBe('ALREADY_COMPLETED');

  const getResp = await request.get(draft.tokenUri);
  expect(getResp.status()).toBe(200);
  const registration = await getResp.json();
  expect(registration.registrations.length).toBe(1);
  expect(registration.registrations[0].agentId).toBe(1001);
});

test('M2.API.4 Draft endpoint rejects oversized payloads', async ({ request }) => {
  const oversized = 'x'.repeat(70 * 1024);
  const draftResp = await request.post('/api/erc8004/registration/draft', {
    data: {
      context: { kind: 'house', houseId: 'house_test_4' },
      entityType: 'human',
      name: 'Large Draft',
      description: 'Large payload should be rejected',
      image: 'https://example.com/large.png',
      services: [{ name: 'web', endpoint: 'https://example.com/large' }],
      permissionManifest: { oversized }
    }
  });

  expect(draftResp.status()).toBe(413);
  const draftBody = await draftResp.json();
  expect(draftBody.error).toBe('REGISTRATION_DRAFT_TOO_LARGE');
});

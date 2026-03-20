const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

const MINT_IDS = {
  userEvm: '11155111:456',
  userSolana: 'solana:user-asset-789',
  agentEvm: '11155111:457',
  agentSolana: 'solana:agent-asset-790'
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeOnboarding(complete = false) {
  return {
    required: true,
    registrationComplete: complete,
    registeredAt: complete ? '2026-02-16T00:00:00.000Z' : null,
    profile: {
      humanName: complete ? 'Robin' : null,
      agentName: complete ? 'OpenClaw' : null,
      humanAvatar: {
        image: '/brand-kit/default_user_avatar.png',
        prompt: complete ? 'Human prompt' : '',
        source: 'default',
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      },
      agentAvatar: {
        image: '/brand-kit/default_agent_avatar.png',
        prompt: complete ? 'Agent prompt' : '',
        source: 'default',
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      }
    },
    erc8004: complete
      ? {
          user: {
            evm: {
              id: MINT_IDS.userEvm,
              chain: 'sepolia',
              txHash: null,
              updatedAt: '2026-02-16T00:00:00.000Z'
            },
            solana: {
              id: MINT_IDS.userSolana,
              cluster: 'devnet',
              txSig: null,
              updatedAt: '2026-02-16T00:00:00.000Z'
            }
          },
          agent: {
            evm: {
              id: MINT_IDS.agentEvm,
              chain: 'sepolia',
              txHash: null,
              updatedAt: '2026-02-16T00:00:00.000Z'
            },
            solana: {
              id: MINT_IDS.agentSolana,
              cluster: 'devnet',
              txSig: null,
              updatedAt: '2026-02-16T00:00:00.000Z'
            }
          }
        }
      : {
          user: {
            evm: { id: null, chain: 'sepolia', txHash: null, updatedAt: null },
            solana: { id: null, cluster: 'devnet', txSig: null, updatedAt: null }
          },
          agent: {
            evm: { id: null, chain: 'sepolia', txHash: null, updatedAt: null },
            solana: { id: null, cluster: 'devnet', txSig: null, updatedAt: null }
          }
        }
  };
}

async function mockTownhallMintFlow(page) {
  const evmAddress = '0x000000000000000000000000000000000000dEaD';
  const solAddress = 'So1anaWalletMint11111111111111111111111111111';

  await page.addInitScript(({ evmAddress: evmAddr, solAddress: solAddr, ids }) => {
    window.__TOWNHALL_TEST_MOCKS_ENABLED__ = true;

    let evmMintIndex = 0;
    let solMintIndex = 0;
    const evmReceipts = new Map();
    const transferTopic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const evmContract = '0x8004a818bfb912233c491871b3d84c89a494bd9e';

    const addressTopic = (address) => `0x${String(address || '').replace(/^0x/i, '').padStart(64, '0')}`;
    const tokenTopic = (agentId, fallbackIndex) => {
      const suffix = String(agentId || '').split(':').pop() || '';
      const numeric = /^[0-9]+$/.test(suffix) ? BigInt(suffix) : BigInt(fallbackIndex + 1);
      return `0x${numeric.toString(16).padStart(64, '0')}`;
    };
    const saveReceipt = (result, fallbackIndex) => {
      if (!result || typeof result !== 'object' || typeof result.txHash !== 'string') return;
      evmReceipts.set(result.txHash.toLowerCase(), {
        transactionHash: result.txHash,
        status: '0x1',
        logs: [{
          address: evmContract,
          topics: [
            transferTopic0,
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            addressTopic(evmAddr),
            tokenTopic(result.agentId, fallbackIndex)
          ],
          data: '0x'
        }]
      });
    };

    const evmProvider = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') return [evmAddr];
        if (method === 'eth_chainId') return '0xaa36a7';
        if (method === 'wallet_switchEthereumChain') return null;
        if (method === 'eth_getTransactionReceipt') {
          const txHash = Array.isArray(params) && params[0] ? String(params[0]).toLowerCase() : '';
          return evmReceipts.get(txHash) || null;
        }
        if (method === 'eth_sendTransaction') {
          const out = evmMintIndex === 0
            ? { agentId: ids.userEvm, txHash: '0x0000000000000000000000000000000000000000000000000000000000001001' }
            : { agentId: ids.agentEvm, txHash: '0x0000000000000000000000000000000000000000000000000000000000001002' };
          const idx = evmMintIndex;
          evmMintIndex += 1;
          saveReceipt(out, idx);
          return out.txHash;
        }
        throw new Error(`unhandled EVM method ${method}`);
      }
    };

    const solProvider = {
      request: async ({ method }) => {
        if (method === 'signAndSendTransaction' || method === 'solana_signAndSendTransaction') {
          const sig = solMintIndex === 0 ? 'sol-user-signature' : 'sol-agent-signature';
          solMintIndex += 1;
          return { signature: sig };
        }
        throw new Error(`unhandled Solana method ${method}`);
      },
      on: () => {},
      off: () => {}
    };

    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: solAddr, provider: solProvider, wallet: solProvider }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: new Uint8Array(64) }),
      connectEvm: async () => ({ address: evmAddr, provider: evmProvider }),
      disconnectEvm: async () => {},
      sendEvmTransaction: async () => {
        const out = evmMintIndex === 0
          ? { agentId: ids.userEvm, txHash: '0x0000000000000000000000000000000000000000000000000000000000001001' }
          : { agentId: ids.agentEvm, txHash: '0x0000000000000000000000000000000000000000000000000000000000001002' };
        const idx = evmMintIndex;
        evmMintIndex += 1;
        saveReceipt(out, idx);
        return { hash: out.txHash };
      },
      getEvmProvider: () => evmProvider,
      getEvmChainId: async () => 11155111,
      switchEvmChain: async () => null
    };

    window.__SOLANA_WEB3_MOCK = {
      Keypair: {
        generate: () => ({ publicKey: { toBase58: () => 'AssetPubkeyMock1111111111111111111111111111111' } })
      },
      Transaction: { from: () => ({}) },
      Connection: class {}
    };
  }, { evmAddress, solAddress, ids: MINT_IDS });

  await page.route('**/api/townhall/mint/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        mint: {
          enabled: true,
          pinataEnabled: true,
          evm: {
            enabled: true,
            chainId: 11155111,
            network: 'sepolia',
            rpcUrl: 'https://sepolia.infura.io/v3/test',
            contractAddress: '0x8004a818bfb912233c491871b3d84c89a494bd9e'
          },
          solana: {
            enabled: true,
            cluster: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com',
            web3ModuleUrl: 'mock://solana-web3'
          }
        }
      })
    });
  });

  await page.route('**/api/townhall/mint/evm/prepare', async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        tokenUri: `ipfs://bafybeievm-${body.subject}`,
        metadataCid: `bafybeievm-${body.subject}`,
        subject: body.subject,
        evm: {
          chainId: 11155111,
          network: 'sepolia',
          rpcUrl: 'https://sepolia.infura.io/v3/test',
          contractAddress: '0x8004a818bfb912233c491871b3d84c89a494bd9e'
        }
      })
    });
  });

  await page.route('**/api/townhall/mint/solana/prepare', async (route) => {
    const body = route.request().postDataJSON();
    const isHuman = body.subject === 'human';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        tokenUri: `ipfs://bafybeisol-${body.subject}`,
        metadataCid: `bafybeisol-${body.subject}`,
        subject: body.subject,
        erc8004Id: isHuman ? MINT_IDS.userSolana : MINT_IDS.agentSolana,
        prepared: {
          transaction: 'AQID',
          blockhash: 'mock-blockhash',
          lastValidBlockHeight: 12345,
          signer: solAddress,
          signed: false
        },
        solana: {
          cluster: 'devnet',
          rpcUrl: 'https://api.devnet.solana.com',
          assetPubkey: isHuman ? 'UserAssetPubkey' : 'AgentAssetPubkey'
        }
      })
    });
  });
}

async function completeTownhallStory(page, {
  humanName = 'Robin',
  agentName = 'OpenClaw',
  humanPrompt = 'Human prompt text',
  agentPrompt = 'Agent prompt text'
} = {}) {
  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/i });
  if (await connectWalletBtn.isVisible().catch(() => false)) {
    const label = String((await connectWalletBtn.textContent()) || '');
    if (/connect/i.test(label)) {
      await connectWalletBtn.click();
    }
  }

  await expect(page.locator('#townhallStepHuman')).toBeVisible();
  await page.locator('#townhallHumanName').fill(humanName);
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill(humanPrompt);
  await page.getByTestId('townhall-human-submit-btn').click();

  await expect(page.locator('#townhallStepAgent')).toBeVisible();
  await page.locator('#townhallAgentName').fill(agentName);
  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill(agentPrompt);
  await page.getByTestId('townhall-agent-submit-btn').click();

  await expect(page.locator('#townhallStepProcessing')).toBeVisible();
}

async function openTownhallPanel(page) {
  const panel = page.locator('#townhallRegisterPanel');
  const townhallVisible = async () => (
    await panel.isVisible()
    || await page.locator('#townhallStepHuman').isVisible()
    || await page.locator('#townhallStepAgent').isVisible()
    || await page.locator('#townhallStepProcessing').isVisible()
  );
  if (await townhallVisible()) return;

  const backdrop = page.locator('#districtModalBackdrop');
  if (await backdrop.isVisible()) {
    const closeBtn = page.locator('#districtModalClose');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      // Locked onboarding can open Town Hall immediately without a visible close button.
      await expect(page.locator('#townhallStepHuman')).toBeVisible();
      return;
    }
  }

  if (await townhallVisible()) return;
  const closeBtn = page.locator('#districtModalClose');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
  if (!(await townhallVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect.poll(async () => {
    const human = await page.locator('#townhallStepHuman').isVisible().catch(() => false);
    const agent = await page.locator('#townhallStepAgent').isVisible().catch(() => false);
    const processing = await page.locator('#townhallStepProcessing').isVisible().catch(() => false);
    return human || agent || processing;
  }, { timeout: 8000 }).toBe(true);
}

async function configureBrain(page, {
  provider = 'openai',
  model = 'gpt-4o-mini'
} = {}) {
  const response = await page.request.post('/api/agent/lite/llm/config', {
    headers: { 'content-type': 'application/json' },
    data: JSON.stringify({ provider, model })
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json().catch(() => ({}));
  expect(payload.ok).toBe(true);
  expect(payload.configured).toBe(true);
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town hall story enforces avatar prompts before advancing each onboarding step', async ({ page }) => {
  await page.goto('/app');
  await openTownhallPanel(page);

  await expect(page.locator('#townhallStepHuman')).toBeVisible();
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill('');
  await page.locator('#townhallHumanName').fill('Robin');
  await page.getByTestId('townhall-human-submit-btn').click();
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
  await expect(page.locator('#townhallRegisterError')).toContainText('human avatar prompt');

  await page.locator('#townhallHumanPrompt').fill('Hero avatar prompt');
  await page.getByTestId('townhall-human-submit-btn').click();
  await expect(page.locator('#townhallStepAgent')).toBeVisible();

  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill('');
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.getByTestId('townhall-agent-submit-btn').click();
  await expect(page.locator('#townhallStepAgent')).toBeVisible();
  await expect(page.locator('#townhallRegisterError')).toContainText('agent avatar prompt');
});

test('town hall one-click registration saves names/prompts/all ERC-8004 IDs to session state', async ({ page }) => {
  await mockTownhallMintFlow(page);
  await page.goto('/app');

  await openTownhallPanel(page);
  await completeTownhallStory(page);

  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');
  await expect(page.getByTestId('townhall-continue-btn')).toBeDisabled();
  await configureBrain(page);
  await expect(page.getByTestId('townhall-continue-btn')).toBeEnabled();
  await page.getByTestId('townhall-continue-btn').click();
  await expect(page.getByTestId('open-btn')).toBeVisible();

  const stateResp = await page.request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state.onboarding?.registrationComplete).toBe(true);
  expect(state.onboarding?.profile?.humanName).toBe('Robin');
  expect(state.onboarding?.profile?.agentName).toBe('OpenClaw');
  expect(state.onboarding?.profile?.humanAvatar?.prompt).toBe('Human prompt text');
  expect(state.onboarding?.profile?.agentAvatar?.prompt).toBe('Agent prompt text');
  expect(state.onboarding?.erc8004?.user?.evm?.id).toBe(MINT_IDS.userEvm);
  expect(state.onboarding?.erc8004?.user?.solana?.id).toBe(MINT_IDS.userSolana);
  expect(state.onboarding?.erc8004?.agent?.evm?.id).toBe(MINT_IDS.agentEvm);
  expect(state.onboarding?.erc8004?.agent?.solana?.id).toBe(MINT_IDS.agentSolana);
});

test('town hall completion persists across repeated refreshes and does not re-run registration steps', async ({ page }) => {
  await mockTownhallMintFlow(page);

  const requestCounts = {
    register: 0,
    evmPrepare: 0,
    solanaPrepare: 0
  };
  const recordTownhallRequests = (req) => {
    if (req.method() !== 'POST' && req.method() !== 'GET') return;
    const url = req.url();
    if (url.includes('/api/townhall/register') && req.method() === 'POST') {
      requestCounts.register += 1;
    }
    if (url.includes('/api/townhall/mint/evm/prepare')) {
      requestCounts.evmPrepare += 1;
    }
    if (url.includes('/api/townhall/mint/solana/prepare')) {
      requestCounts.solanaPrepare += 1;
    }
  };
  page.on('request', recordTownhallRequests);

  await page.goto('/app');
  await openTownhallPanel(page);
  await completeTownhallStory(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });
  await expect(page.locator('#townhallStepProcessing')).toBeVisible();

  const requestsAfterSetup = { ...requestCounts };

  const cookiesBefore = await page.context().cookies();
  const sessionCookieBefore = cookiesBefore.find((cookie) => cookie.name === 'et_session');
  expect(sessionCookieBefore?.value).toBeTruthy();

  const stateBefore = await page.request.get('/api/state');
  expect(stateBefore.ok()).toBeTruthy();
  const stateBeforeBody = await stateBefore.json();
  const teamCodeBefore = String(stateBeforeBody?.teamCode || '');
  expect(teamCodeBefore).toMatch(/^TEAM-/);

  const teamCodeHint = await page.evaluate(() => {
    try {
      return localStorage.getItem('agentTown:teamCodeHint') || '';
    } catch {
      return '';
    }
  });
  expect(teamCodeHint).toBe(teamCodeBefore);

  for (let i = 0; i < 3; i += 1) {
    if (i > 0) {
      await page.context().clearCookies();
    }

    await page.reload();
    await openTownhallPanel(page);
    await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });

    const cookiesAfter = await page.context().cookies();
    const sessionCookieAfter = cookiesAfter.find((cookie) => cookie.name === 'et_session');
    expect(sessionCookieAfter?.value).toBeTruthy();
    if (i === 0) {
      expect(sessionCookieAfter.value).toBe(sessionCookieBefore.value);
    }

    const stateResp = await page.request.get('/api/state');
    expect(stateResp.ok()).toBeTruthy();
    const state = await stateResp.json();
    expect(state.teamCode).toBe(teamCodeBefore);
    expect(state.onboarding?.registrationComplete).toBe(true);
    expect(state.onboarding?.profile?.humanName).toBe('Robin');
    expect(state.onboarding?.profile?.agentName).toBe('OpenClaw');
    expect(state.onboarding?.erc8004?.user?.evm?.id).toBe(MINT_IDS.userEvm);
    expect(state.onboarding?.erc8004?.user?.solana?.id).toBe(MINT_IDS.userSolana);
    expect(state.onboarding?.erc8004?.agent?.evm?.id).toBe(MINT_IDS.agentEvm);
    expect(state.onboarding?.erc8004?.agent?.solana?.id).toBe(MINT_IDS.agentSolana);
    expect(state.teamCode).toBe(teamCodeBefore);

    await openTownhallPanel(page);
    await expect(page.locator('#townhallStepHuman')).toBeHidden();
    await expect(page.locator('#townhallStepAgent')).toBeHidden();
    await expect(page.locator('#townhallStepProcessing')).toBeVisible();
    await expect(page.locator('#townhallRegisterState')).toContainText('Registered');
  }

  page.off('request', recordTownhallRequests);
  expect(requestCounts.register).toBe(requestsAfterSetup.register);
  expect(requestCounts.evmPrepare).toBe(requestsAfterSetup.evmPrepare);
  expect(requestCounts.solanaPrepare).toBe(requestsAfterSetup.solanaPrepare);
});

test('town hall completion is restored by wallet identity after cookie and hint reset', async ({ page }) => {
  await mockTownhallMintFlow(page);

  const requestCounts = {
    register: 0,
    evmPrepare: 0,
    solanaPrepare: 0
  };
  const recordTownhallRequests = (req) => {
    if (req.method() !== 'POST' && req.method() !== 'GET') return;
    const url = req.url();
    if (url.includes('/api/townhall/register') && req.method() === 'POST') {
      requestCounts.register += 1;
    }
    if (url.includes('/api/townhall/mint/evm/prepare')) {
      requestCounts.evmPrepare += 1;
    }
    if (url.includes('/api/townhall/mint/solana/prepare')) {
      requestCounts.solanaPrepare += 1;
    }
  };
  page.on('request', recordTownhallRequests);

  await page.goto('/app');
  await openTownhallPanel(page);
  await completeTownhallStory(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });
  await expect(page.locator('#townhallStepProcessing')).toBeVisible();

  const stateBefore = await page.request.get('/api/state');
  expect(stateBefore.ok()).toBeTruthy();
  const stateBeforeBody = await stateBefore.json();
  const teamCode = String(stateBeforeBody?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);
  const requestsAfterSetup = { ...requestCounts };

  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.removeItem('agentTown:teamCodeHint');
    } catch {
      // ignore localStorage errors
    }
  });

  await page.reload();
  await openTownhallPanel(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });

  const reopenedStateResp = await page.request.get('/api/state');
  expect(reopenedStateResp.ok()).toBeTruthy();
  const reopenedState = await reopenedStateResp.json();
  expect(String(reopenedState?.teamCode || '')).toBe(teamCode);
  expect(reopenedState?.onboarding?.registrationComplete).toBe(true);
  expect(reopenedState?.onboarding?.profile?.humanName).toBe('Robin');
  expect(reopenedState?.onboarding?.profile?.agentName).toBe('OpenClaw');
  expect(reopenedState?.onboarding?.erc8004?.user?.evm?.id).toBe(MINT_IDS.userEvm);
  expect(reopenedState?.onboarding?.erc8004?.user?.solana?.id).toBe(MINT_IDS.userSolana);
  expect(reopenedState?.onboarding?.erc8004?.agent?.evm?.id).toBe(MINT_IDS.agentEvm);
  expect(reopenedState?.onboarding?.erc8004?.agent?.solana?.id).toBe(MINT_IDS.agentSolana);

  await openTownhallPanel(page);
  await expect(page.locator('#townhallStepHuman')).toBeHidden();
  await expect(page.locator('#townhallStepAgent')).toBeHidden();
  await expect(page.locator('#townhallStepProcessing')).toBeVisible();
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');

  page.off('request', recordTownhallRequests);
  expect(requestCounts.register).toBe(requestsAfterSetup.register);
  expect(requestCounts.evmPrepare).toBe(requestsAfterSetup.evmPrepare);
  expect(requestCounts.solanaPrepare).toBe(requestsAfterSetup.solanaPrepare);
});

test('town hall completion recovers even if first session request misses wallet identity', async ({ page }) => {
  await mockTownhallMintFlow(page);

  const requestCounts = {
    register: 0,
    evmPrepare: 0,
    solanaPrepare: 0
  };
  const recordTownhallRequests = (req) => {
    if (req.method() !== 'POST' && req.method() !== 'GET') return;
    const url = req.url();
    if (url.includes('/api/townhall/register') && req.method() === 'POST') {
      requestCounts.register += 1;
    }
    if (url.includes('/api/townhall/mint/evm/prepare')) {
      requestCounts.evmPrepare += 1;
    }
    if (url.includes('/api/townhall/mint/solana/prepare')) {
      requestCounts.solanaPrepare += 1;
    }
  };
  page.on('request', recordTownhallRequests);

  await page.goto('/app');
  await openTownhallPanel(page);
  await completeTownhallStory(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });
  await expect(page.locator('#townhallStepProcessing')).toBeVisible();

  const requestsAfterSetup = { ...requestCounts };
  const stateBefore = await page.request.get('/api/state');
  expect(stateBefore.ok()).toBeTruthy();
  const stateBeforeBody = await stateBefore.json();
  const teamCode = String(stateBeforeBody?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);

  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.removeItem('agentTown:teamCodeHint');
    } catch {
      // ignore localStorage errors
    }
  });

  let strippedFirstSession = false;
  await page.route('**/api/session', async (route) => {
    if (route.request().method() !== 'GET' || strippedFirstSession) {
      await route.continue();
      return;
    }

    strippedFirstSession = true;
    const headers = route.request().headers();
    const sanitizedHeaders = {};
    for (const [name, value] of Object.entries(headers)) {
      const lower = String(name || '').toLowerCase();
      if ([
        'x-wallet-chain',
        'x-wallet-address',
        'x-wallet-evm-address',
        'x-wallet-solana-address'
      ].includes(lower)) {
        continue;
      }
      sanitizedHeaders[name] = value;
    }
    await route.continue({ headers: sanitizedHeaders });
  });

  await page.reload();
  await openTownhallPanel(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });

  const reopenedStateResp = await page.request.get('/api/state');
  expect(reopenedStateResp.ok()).toBeTruthy();
  const reopenedState = await reopenedStateResp.json();
  expect(String(reopenedState?.teamCode || '')).toBe(teamCode);
  expect(reopenedState?.onboarding?.registrationComplete).toBe(true);
  expect(reopenedState?.onboarding?.profile?.humanName).toBe('Robin');
  expect(reopenedState?.onboarding?.profile?.agentName).toBe('OpenClaw');
  expect(reopenedState?.onboarding?.erc8004?.user?.evm?.id).toBe(MINT_IDS.userEvm);
  expect(reopenedState?.onboarding?.erc8004?.user?.solana?.id).toBe(MINT_IDS.userSolana);
  expect(reopenedState?.onboarding?.erc8004?.agent?.evm?.id).toBe(MINT_IDS.agentEvm);
  expect(reopenedState?.onboarding?.erc8004?.agent?.solana?.id).toBe(MINT_IDS.agentSolana);

  await openTownhallPanel(page);
  await expect(page.locator('#townhallStepHuman')).toBeHidden();
  await expect(page.locator('#townhallStepAgent')).toBeHidden();
  await expect(page.locator('#townhallStepProcessing')).toBeVisible();
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');

  page.off('request', recordTownhallRequests);
  await page.unroute('**/api/session');
  expect(requestCounts.register).toBe(requestsAfterSetup.register);
  expect(requestCounts.evmPrepare).toBe(requestsAfterSetup.evmPrepare);
  expect(requestCounts.solanaPrepare).toBe(requestsAfterSetup.solanaPrepare);
});

test('town hall draft fields persist after blur before save', async ({ page }) => {
  await page.goto('/app');
  await openTownhallPanel(page);

  await page.locator('#townhallHumanName').fill('Draft Robin');
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill('Draft human prompt');
  await page.locator('#townhallStepHuman h2').click();
  await page.waitForTimeout(1800);

  await expect(page.locator('#townhallHumanName')).toHaveValue('Draft Robin');
  await expect(page.locator('#townhallHumanPrompt')).toHaveValue('Draft human prompt');

  await page.getByTestId('townhall-human-submit-btn').click();
  await expect(page.locator('#townhallStepAgent')).toBeVisible();
  await page.locator('#townhallAgentName').fill('Draft OpenClaw');
  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill('Draft agent prompt');
  await page.locator('#townhallStepAgent h2').click();
  await page.waitForTimeout(1800);

  await expect(page.locator('#townhallAgentName')).toHaveValue('Draft OpenClaw');
  await expect(page.locator('#townhallAgentPrompt')).toHaveValue('Draft agent prompt');
});

test('required town hall onboarding locks district switching until registration is saved', async ({ page }) => {
  await mockTownhallMintFlow(page);

  let mockedOnboarding = makeOnboarding(false);

  await page.route('**/api/session', async (route) => {
    const upstream = await route.fetch();
    const body = await upstream.json().catch(() => ({}));
    body.onboarding = deepClone(mockedOnboarding);
    body.lite = {
      ...(body.lite || {}),
      driver: 'vendor',
      llmConfigured: false
    };
    await route.fulfill({
      status: upstream.status(),
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });

  await page.route('**/api/state', async (route) => {
    const upstream = await route.fetch();
    const body = await upstream.json().catch(() => ({}));
    body.houseId = null;
    body.onboarding = deepClone(mockedOnboarding);
    body.lite = {
      ...(body.lite || {}),
      driver: 'vendor',
      llmConfigured: false
    };
    await route.fulfill({
      status: upstream.status(),
      contentType: 'application/json',
      body: JSON.stringify(body)
    });
  });

  await page.route('**/api/townhall/register', async (route) => {
    mockedOnboarding = makeOnboarding(true);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, onboarding: deepClone(mockedOnboarding) })
    });
  });

  await page.goto('/app');

  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();
  await expect(page.locator('#districtModalClose')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open Saloon' })).toHaveAttribute('aria-disabled', 'true');

  await completeTownhallStory(page, { humanPrompt: 'Human prompt', agentPrompt: 'Agent prompt' });

  await expect.poll(async () => page.evaluate(async () => {
    const stateResp = await fetch('/api/state', { credentials: 'include' });
    const state = await stateResp.json().catch(() => ({}));
    return state?.onboarding?.registrationComplete === true;
  }), { timeout: 8000 }).toBe(true);
  await expect(page.locator('#districtModalBackdrop')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Saloon' })).toHaveAttribute('aria-disabled', 'true');
  await configureBrain(page);
  await openTownhallPanel(page);
  await expect(page.getByTestId('townhall-continue-btn')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Open Saloon' })).toHaveAttribute('aria-disabled', 'true');
});

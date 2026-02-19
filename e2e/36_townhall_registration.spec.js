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
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
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

  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');
  await expect(page.getByTestId('townhall-continue-btn')).toBeEnabled();
  await expect(page.getByTestId('open-btn')).toBeHidden();
  await page.getByTestId('townhall-continue-btn').click();
  await expect(page.getByTestId('open-btn')).toBeVisible();
  await expect(page.locator('#townhallRegisterPanel')).toBeHidden();
  await expect(page.locator('#districtModalClose')).toBeHidden();
});

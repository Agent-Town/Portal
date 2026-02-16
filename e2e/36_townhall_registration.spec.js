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
        image: '/brand-kit/elizaos-sheriff.png',
        prompt: complete ? 'Human prompt' : '',
        source: 'default',
        updatedAt: complete ? '2026-02-16T00:00:00.000Z' : null
      },
      agentAvatar: {
        image: '/brand-kit/openclaw-sheriff.png',
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
          },
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
      : {
          user: {
            evm: { id: null, chain: 'sepolia', txHash: null, updatedAt: null },
            solana: { id: null, cluster: 'devnet', txSig: null, updatedAt: null }
          },
          agent: {
            evm: { id: null, chain: 'sepolia', txHash: null, updatedAt: null },
            solana: { id: null, cluster: 'devnet', txSig: null, updatedAt: null }
          },
          evm: { id: null, chain: 'sepolia', txHash: null, updatedAt: null },
          solana: { id: null, cluster: 'devnet', txSig: null, updatedAt: null }
        }
  };
}

async function mockTownhallMintFlow(page) {
  const evmAddress = '0x000000000000000000000000000000000000dEaD';
  const solAddress = 'So1anaWalletMint11111111111111111111111111111';

  await page.addInitScript(({ evmAddress: evmAddr, solAddress: solAddr, ids }) => {
    let evmMintIndex = 0;
    let solMintIndex = 0;

    const evmProvider = {
      request: async ({ method }) => {
        if (method === 'eth_requestAccounts') return [evmAddr];
        if (method === 'eth_chainId') return '0xaa36a7';
        if (method === 'wallet_switchEthereumChain') return null;
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
      getEvmProvider: () => evmProvider,
      getEvmChainId: async () => 11155111,
      switchEvmChain: async () => null
    };

    window.__AG0_SDK_MOCK = {
      SDK: class SDK {
        constructor() {}
        createAgent() {
          return {
            registerHTTP: async () => {
              const out = evmMintIndex === 0
                ? { id: ids.userEvm, txHash: '0xuser-evm-hash' }
                : { id: ids.agentEvm, txHash: '0xagent-evm-hash' };
              evmMintIndex += 1;
              return {
                hash: out.txHash,
                waitConfirmed: async () => ({
                  result: { agentId: out.id },
                  receipt: { transactionHash: out.txHash }
                })
              };
            }
          };
        }
      }
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
            sdkModuleUrl: 'mock://ag0'
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
        evm: { chainId: 11155111, network: 'sepolia', rpcUrl: 'https://sepolia.infura.io/v3/test' }
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

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town hall one-click registration saves names/prompts/all ERC-8004 IDs to session state', async ({ page }) => {
  await mockTownhallMintFlow(page);
  await page.goto('/app');

  await page.locator('#districtModalClose').click();
  await page.getByRole('button', { name: 'Open Town Hall' }).click();
  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();

  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallHumanPrompt').fill('Human prompt text');
  await page.locator('#townhallAgentPrompt').fill('Agent prompt text');

  await page.getByTestId('townhall-register-btn').click();
  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');

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

  if (!(await page.locator('#townhallRegisterPanel').isVisible())) {
    if (await page.locator('#districtModalClose').isVisible()) {
      await page.locator('#districtModalClose').click();
    }
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
    await expect(page.locator('#townhallRegisterPanel')).toBeVisible();
  }

  await page.locator('#townhallHumanName').fill('Draft Robin');
  await page.locator('#townhallAgentName').fill('Draft OpenClaw');
  await page.locator('#townhallHumanPrompt').fill('Draft human prompt');
  await page.locator('#townhallAgentPrompt').fill('Draft agent prompt');

  await page.locator('#townhallRegisterPanel h2').click();
  await page.waitForTimeout(1800);

  await expect(page.locator('#townhallHumanName')).toHaveValue('Draft Robin');
  await expect(page.locator('#townhallAgentName')).toHaveValue('Draft OpenClaw');
  await expect(page.locator('#townhallHumanPrompt')).toHaveValue('Draft human prompt');
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

  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallHumanPrompt').fill('Human prompt');
  await page.locator('#townhallAgentPrompt').fill('Agent prompt');
  await page.getByTestId('townhall-register-btn').click();

  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');
  await expect(page.getByTestId('open-btn')).toBeVisible();
  await expect(page.locator('#districtModalClose')).toBeHidden();
});

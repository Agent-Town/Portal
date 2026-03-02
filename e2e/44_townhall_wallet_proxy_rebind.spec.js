const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

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

async function installWalletProxyRebindMocks(page) {
  const evmAddress = '0x000000000000000000000000000000000000dEaD';
  const solAddress = 'So1anaWalletMint11111111111111111111111111111';

  await page.addInitScript(({ evmAddress: evmAddr, solAddress: solAddr }) => {
    window.__TOWNHALL_TEST_MOCKS_ENABLED__ = true;

    let evmMintIndex = 0;
    let solMintIndex = 0;
    let resetCalls = 0;
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

    const staleEvmProvider = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') {
          throw new Error('EMBEDDED WALLET PROXY NOT INITIALIZED');
        }
        if (method === 'eth_chainId') return '0xaa36a7';
        if (method === 'wallet_switchEthereumChain') return null;
        if (method === 'eth_getTransactionReceipt') {
          const txHash = Array.isArray(params) && params[0] ? String(params[0]).toLowerCase() : '';
          return evmReceipts.get(txHash) || null;
        }
        if (method === 'eth_sendTransaction') {
          const out = evmMintIndex === 0
            ? { agentId: '11155111:1001', txHash: '0x0000000000000000000000000000000000000000000000000000000000001001' }
            : { agentId: '11155111:1002', txHash: '0x0000000000000000000000000000000000000000000000000000000000001002' };
          const idx = evmMintIndex;
          evmMintIndex += 1;
          saveReceipt(out, idx);
          return out.txHash;
        }
        throw new Error(`unhandled stale EVM method ${method}`);
      }
    };

    const freshEvmProvider = {
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
            ? { agentId: '11155111:1001', txHash: '0x0000000000000000000000000000000000000000000000000000000000001001' }
            : { agentId: '11155111:1002', txHash: '0x0000000000000000000000000000000000000000000000000000000000001002' };
          const idx = evmMintIndex;
          evmMintIndex += 1;
          saveReceipt(out, idx);
          return out.txHash;
        }
        throw new Error(`unhandled fresh EVM method ${method}`);
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
      ensureLoggedIn: async () => ({ id: 'mock-user' }),
      resetWalletProxies: async () => {
        resetCalls += 1;
        return true;
      },
      connectSolana: async () => ({ address: solAddr, provider: solProvider, wallet: solProvider }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: new Uint8Array(64) }),
      connectEvm: async () => ({
        address: evmAddr,
        provider: resetCalls > 0 ? freshEvmProvider : staleEvmProvider
      }),
      disconnectEvm: async () => {},
      sendEvmTransaction: async () => {
        const out = evmMintIndex === 0
          ? { agentId: '11155111:1001', txHash: '0x0000000000000000000000000000000000000000000000000000000000001001' }
          : { agentId: '11155111:1002', txHash: '0x0000000000000000000000000000000000000000000000000000000000001002' };
        const idx = evmMintIndex;
        evmMintIndex += 1;
        saveReceipt(out, idx);
        return { hash: out.txHash };
      },
      getEvmProvider: () => (resetCalls > 0 ? freshEvmProvider : staleEvmProvider),
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
  }, { evmAddress, solAddress });

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
        erc8004Id: isHuman ? 'solana:user-asset-901' : 'solana:agent-asset-902',
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

async function completeTownhallStory(page) {
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill('Human prompt');
  await page.getByTestId('townhall-human-submit-btn').click();

  await expect(page.locator('#townhallStepAgent')).toBeVisible();
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill('Agent prompt');
  await page.getByTestId('townhall-agent-submit-btn').click();
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
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  if (!(await townhallVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
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

test('town hall registration rebinds wallet provider after proxy reset', async ({ page }) => {
  await installWalletProxyRebindMocks(page);
  await page.goto('/app');

  await openTownhallPanel(page);
  await completeTownhallStory(page);

  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done', { timeout: 15000 });
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallRegisterError')).toHaveText('');
  await expect(page.getByTestId('townhall-continue-btn')).toBeDisabled();
  await configureBrain(page);
  await expect(page.getByTestId('townhall-continue-btn')).toBeEnabled();
});

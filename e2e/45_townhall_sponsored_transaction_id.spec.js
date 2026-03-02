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

test('town hall registration resolves sponsored Sepolia transaction ids to hashes', async ({ page }) => {
  const evmAddress = '0x000000000000000000000000000000000000dEaD';
  const solAddress = 'So1anaWalletMint11111111111111111111111111111';
  const userTxHash = '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff11';
  const agentTxHash = '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff22';
  const transferTopic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const evmContract = '0x8004a818bfb912233c491871b3d84c89a494bd9e';
  const userSolSig = '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ1';
  const agentSolSig = '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ2';

  await page.addInitScript(
    ({ evmAddress: evmAddr, solAddress: solAddr, userTxHash: userTx, agentTxHash: agentTx, transferTopic0: topic0, evmContract: contract }) => {
      window.__TOWNHALL_TEST_MOCKS_ENABLED__ = true;

      const addressTopic = (address) => `0x${String(address || '').replace(/^0x/i, '').padStart(64, '0')}`;
      const tokenTopic = (tokenId) => `0x${BigInt(tokenId).toString(16).padStart(64, '0')}`;
      const receiptByHash = new Map([
        [String(userTx).toLowerCase(), {
          transactionHash: userTx,
          status: '0x1',
          logs: [{
            address: contract,
            topics: [
              topic0,
              '0x0000000000000000000000000000000000000000000000000000000000000000',
              addressTopic(evmAddr),
              tokenTopic(901)
            ],
            data: '0x'
          }]
        }],
        [String(agentTx).toLowerCase(), {
          transactionHash: agentTx,
          status: '0x1',
          logs: [{
            address: contract,
            topics: [
              topic0,
              '0x0000000000000000000000000000000000000000000000000000000000000000',
              addressTopic(evmAddr),
              tokenTopic(902)
            ],
            data: '0x'
          }]
        }]
      ]);

      let evmMintIndex = 0;
      let solMintIndex = 0;
      const solSignatures = [
        '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ1',
        '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ2'
      ];

      const evmProvider = {
        request: async ({ method, params }) => {
          if (method === 'eth_requestAccounts') return [evmAddr];
          if (method === 'eth_chainId') return '0xaa36a7';
          if (method === 'wallet_switchEthereumChain') return null;
          if (method === 'eth_sendTransaction') {
            throw new Error('unsponsored fallback should not be used');
          }
          if (method === 'eth_getTransactionReceipt') {
            const txHash = Array.isArray(params) && params[0] ? String(params[0]).toLowerCase() : '';
            return receiptByHash.get(txHash) || null;
          }
          if (method === 'eth_getUserOperationReceipt') {
            return null;
          }
          throw new Error(`unhandled EVM method ${method}`);
        }
      };

      const solProvider = {
        request: async ({ method }) => {
          if (method === 'signAndSendTransaction' || method === 'solana_signAndSendTransaction') {
            const signature = solSignatures[Math.min(solMintIndex, solSignatures.length - 1)] || solSignatures[0];
            solMintIndex += 1;
            return { signature };
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
          const idx = evmMintIndex;
          evmMintIndex += 1;
          return idx === 0
            ? { transactionId: 'tx-user-1' }
            : { transactionId: 'tx-agent-1' };
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
    },
    {
      evmAddress,
      solAddress,
      userTxHash,
      agentTxHash,
      transferTopic0,
      evmContract
    }
  );

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
            contractAddress: evmContract
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
        tokenUri: `ipfs://bafybeievmmock-${body.subject}`,
        metadataCid: `bafybeievmmock-${body.subject}`,
        subject: body.subject,
        evm: {
          chainId: 11155111,
          network: 'sepolia',
          rpcUrl: 'https://sepolia.infura.io/v3/test',
          contractAddress: evmContract
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

  const txPolls = { 'tx-user-1': 0, 'tx-agent-1': 0 };
  await page.route('**/api/privy/transactions/*', async (route) => {
    const url = new URL(route.request().url());
    const id = decodeURIComponent(url.pathname.split('/').pop() || '');
    txPolls[id] = (txPolls[id] || 0) + 1;
    if (id === 'tx-user-1') {
      if (txPolls[id] < 2) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, transaction: { id, status: 'pending', transactionHash: null } })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, transaction: { id, status: 'confirmed', transactionHash: userTxHash } })
      });
      return;
    }
    if (id === 'tx-agent-1') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, transaction: { id, status: 'confirmed', transactionHash: agentTxHash } })
      });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'NOT_FOUND' })
    });
  });

  await page.goto('/app');
  await openTownhallPanel(page);

  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill('Human prompt');
  await page.getByTestId('townhall-human-submit-btn').click();

  await expect(page.locator('#townhallStepAgent')).toBeVisible();
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill('Agent prompt');
  await page.getByTestId('townhall-agent-submit-btn').click();

  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done', { timeout: 15000 });
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallRegisterError')).toHaveText('');
  await configureBrain(page);
  await expect(page.getByTestId('townhall-continue-btn')).toBeEnabled();
  expect(txPolls['tx-user-1']).toBeGreaterThanOrEqual(2);
});

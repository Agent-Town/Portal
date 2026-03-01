const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function installTownhallWalletMocks(page, {
  evmAddress,
  solAddress,
  evmMints,
  solSignatures
}) {
  await page.addInitScript(
    ({ evmAddress: evmAddr, solAddress: solAddr, evmMints: evmMintResults, solSignatures: solSigs }) => {
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
            const idx = Math.min(evmMintIndex, evmMintResults.length - 1);
            const result = evmMintResults[idx];
            evmMintIndex += 1;
            saveReceipt(result, idx);
            return result.txHash;
          }
          throw new Error(`unhandled EVM method ${method}`);
        }
      };

      const solProvider = {
        request: async ({ method }) => {
          if (method === 'signAndSendTransaction' || method === 'solana_signAndSendTransaction') {
            const signature = solSigs[Math.min(solMintIndex, solSigs.length - 1)] || solSigs[0];
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
          const idx = Math.min(evmMintIndex, evmMintResults.length - 1);
          const result = evmMintResults[idx];
          evmMintIndex += 1;
          saveReceipt(result, idx);
          return { hash: result.txHash };
        },
        getEvmProvider: () => evmProvider,
        getEvmChainId: async () => 11155111,
        switchEvmChain: async () => null
      };

      window.__SOLANA_WEB3_MOCK = {
        Keypair: {
          generate: () => ({
            publicKey: { toBase58: () => 'AssetPubkeyMock1111111111111111111111111111111' }
          })
        },
        Transaction: {
          from: () => ({})
        },
        Connection: class {
          constructor() {}
          async sendRawTransaction() {
            return solSigs[0] || 'mock-sol-signature';
          }
          async confirmTransaction() {
            return { value: { err: null } };
          }
        }
      };
    },
    {
      evmAddress,
      solAddress,
      evmMints,
      solSignatures
    }
  );
}

async function completeTownhallStory(page, {
  humanName = 'Robin',
  agentName = 'OpenClaw',
  humanPrompt = 'Human image prompt used',
  agentPrompt = 'Agent image prompt used'
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

test('town hall one-click flow mints all 4 identities and saves registration', async ({ page }) => {
  const evmAddress = '0x000000000000000000000000000000000000dEaD';
  const solAddress = 'So1anaWalletMint11111111111111111111111111111';

  const userEvmId = '11155111:901';
  const agentEvmId = '11155111:902';
  const userEvmTx = '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff11';
  const agentEvmTx = '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff22';

  const userSolAsset = 'UserAssetPubkeyMock1111111111111111111111111111';
  const agentSolAsset = 'AgentAssetPubkeyMock111111111111111111111111111';
  const userSolId = `solana:${userSolAsset}`;
  const agentSolId = `solana:${agentSolAsset}`;
  const userSolSig = '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ1';
  const agentSolSig = '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ2';

  await installTownhallWalletMocks(page, {
    evmAddress,
    solAddress,
    evmMints: [
      { agentId: userEvmId, txHash: userEvmTx },
      { agentId: agentEvmId, txHash: agentEvmTx }
    ],
    solSignatures: [userSolSig, agentSolSig]
  });

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

  const evmSubjects = [];
  await page.route('**/api/townhall/mint/evm/prepare', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.walletAddress.toLowerCase()).toBe(evmAddress.toLowerCase());
    expect(body.profile.humanName).toBe('Robin');
    expect(body.profile.agentName).toBe('OpenClaw');
    evmSubjects.push(body.subject);
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
          contractAddress: '0x8004a818bfb912233c491871b3d84c89a494bd9e'
        }
      })
    });
  });

  const solSubjects = [];
  await page.route('**/api/townhall/mint/solana/prepare', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.walletAddress).toBe(solAddress);
    expect(typeof body.assetPubkey).toBe('string');
    solSubjects.push(body.subject);
    const isHuman = body.subject === 'human';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        tokenUri: `ipfs://bafybeisolmock-${body.subject}`,
        metadataCid: `bafybeisolmock-${body.subject}`,
        subject: body.subject,
        erc8004Id: isHuman ? userSolId : agentSolId,
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
          assetPubkey: isHuman ? userSolAsset : agentSolAsset
        }
      })
    });
  });

  await page.goto('/app');
  await openTownhallPanel(page);
  await completeTownhallStory(page);

  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');
  await expect(page.locator('#districtModalBackdrop')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Saloon' })).toHaveAttribute('aria-disabled', 'false');
  await configureBrain(page);
  await expect(page.getByTestId('townhall-continue-btn')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Open Saloon' })).toHaveAttribute('aria-disabled', 'false');

  expect(evmSubjects).toEqual(['human', 'agent']);
  expect(solSubjects).toEqual(['human', 'agent']);

  const stateResp = await page.request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state.onboarding?.registrationComplete).toBe(true);
  expect(state.onboarding?.erc8004?.user?.evm?.id).toBe(userEvmId);
  expect(state.onboarding?.erc8004?.user?.solana?.id).toBe(userSolId);
  expect(state.onboarding?.erc8004?.agent?.evm?.id).toBe(agentEvmId);
  expect(state.onboarding?.erc8004?.agent?.solana?.id).toBe(agentSolId);
});

test('town hall one-click flow stops on Solana signer mismatch', async ({ page }) => {
  const evmAddress = '0x000000000000000000000000000000000000dEaD';
  const solAddress = 'So1anaWalletMint11111111111111111111111111111';
  const mismatchedSigner = 'So1anaWalletMismatch11111111111111111111111111';

  await installTownhallWalletMocks(page, {
    evmAddress,
    solAddress,
    evmMints: [
      {
        agentId: '11155111:901',
        txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff11'
      }
    ],
    solSignatures: ['unused-sol-signature']
  });

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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        tokenUri: 'ipfs://bafybeievmmock-human',
        metadataCid: 'bafybeievmmock-human',
        subject: 'human',
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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        tokenUri: 'ipfs://bafybeisolmock-human',
        metadataCid: 'bafybeisolmock-human',
        subject: 'human',
        erc8004Id: 'solana:AssetLocal11111111111111111111111111111111',
        prepared: {
          transaction: 'AQID',
          blockhash: 'mock-blockhash',
          lastValidBlockHeight: 12345,
          signer: mismatchedSigner,
          signed: false
        },
        solana: {
          cluster: 'devnet',
          rpcUrl: 'https://api.devnet.solana.com',
          assetPubkey: 'AssetLocal11111111111111111111111111111111'
        }
      })
    });
  });

  await page.goto('/app');
  await openTownhallPanel(page);
  await completeTownhallStory(page);

  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Failed');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Pending');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Pending');
  await expect(page.locator('#townhallRegisterError')).toContainText('does not match');
  await expect(page.locator('#townhallRegisterState')).toContainText('Not registered');
  await expect(page.getByTestId('townhall-continue-btn')).toBeDisabled();
});

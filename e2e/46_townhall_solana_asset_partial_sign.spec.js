const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function installTownhallWalletMocks(page) {
  await page.addInitScript(() => {
    window.__TOWNHALL_TEST_MOCKS_ENABLED__ = true;
    window.__SOLANA_ASSET_SIGN_COUNT = 0;

    const evmAddress = '0x000000000000000000000000000000000000dEaD';
    const solAddress = 'So1anaWalletMint11111111111111111111111111111';
    const evmMints = [
      {
        agentId: '11155111:901',
        txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff11'
      },
      {
        agentId: '11155111:902',
        txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff22'
      }
    ];
    const evmReceipts = new Map();
    let evmMintIndex = 0;
    let solAssetSeed = 0;

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
            addressTopic(evmAddress),
            tokenTopic(result.agentId, fallbackIndex)
          ],
          data: '0x'
        }]
      });
    };

    const evmProvider = {
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts') return [evmAddress];
        if (method === 'eth_chainId') return '0xaa36a7';
        if (method === 'wallet_switchEthereumChain') return null;
        if (method === 'eth_getTransactionReceipt') {
          const txHash = Array.isArray(params) && params[0] ? String(params[0]).toLowerCase() : '';
          return evmReceipts.get(txHash) || null;
        }
        throw new Error(`unhandled EVM method ${method}`);
      }
    };

    const solProvider = {
      request: async ({ method, params }) => {
        if (method === 'signTransaction') {
          const tx = params && typeof params === 'object' ? params.transaction : null;
          if (!tx || tx.__assetSigned !== true) {
            throw new Error('Transaction did not pass signature verification.');
          }
          tx.__walletSigned = true;
          return { signedTransaction: tx };
        }
        if (method === 'signAndSendTransaction' || method === 'solana_signAndSendTransaction') {
          throw new Error('unexpected signAndSendTransaction usage');
        }
        throw new Error(`unhandled Solana method ${method}`);
      },
      on: () => {},
      off: () => {}
    };

    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: solAddress, provider: solProvider, wallet: solProvider }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: new Uint8Array(64) }),
      connectEvm: async () => ({ address: evmAddress, provider: evmProvider }),
      disconnectEvm: async () => {},
      sendEvmTransaction: async () => {
        const idx = Math.min(evmMintIndex, evmMints.length - 1);
        const result = evmMints[idx];
        evmMintIndex += 1;
        saveReceipt(result, idx);
        return { hash: result.txHash };
      },
      getEvmProvider: () => evmProvider,
      getEvmChainId: async () => 11155111,
      switchEvmChain: async () => null
    };

    const markSigned = (tx, maybeSigners) => {
      const signers = Array.isArray(maybeSigners) ? maybeSigners : [maybeSigners];
      const hasSigner = signers.some((entry) => entry && entry.secretKey instanceof Uint8Array);
      if (hasSigner) {
        tx.__assetSigned = true;
        window.__SOLANA_ASSET_SIGN_COUNT += 1;
      }
      return tx;
    };

    window.__SOLANA_WEB3_MOCK = {
      Keypair: {
        generate: () => {
          solAssetSeed += 1;
          return {
            publicKey: { toBase58: () => `AssetPubkeyMock${solAssetSeed}` },
            secretKey: new Uint8Array([solAssetSeed, 1, 2, 3])
          };
        }
      },
      Transaction: {
        from: () => ({
          __assetSigned: false,
          __walletSigned: false,
          sign: function (...signers) { return markSigned(this, signers.flat()); },
          partialSign: function (...signers) { return markSigned(this, signers); },
          serialize: function () { return this.__assetSigned ? new Uint8Array([9, 2, 3]) : new Uint8Array([1, 2, 3]); }
        })
      },
      Connection: class {
        constructor() {}
        async sendRawTransaction() {
          return 'sol-fallback-signature';
        }
        async confirmTransaction() {
          return { value: { err: null } };
        }
      }
    };
  });
}

async function completeTownhallStory(page) {
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill('Human image prompt used');
  await page.getByTestId('townhall-human-submit-btn').click();

  await expect(page.locator('#townhallStepAgent')).toBeVisible();
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill('Agent image prompt used');
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
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await expect(page.locator('#townhallStepHuman')).toBeVisible();
      return;
    }
  }

  if (await townhallVisible()) return;
  const closeBtn = page.locator('#districtModalClose');
  if (await closeBtn.isVisible()) await closeBtn.click();
  if (!(await townhallVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
}

test('town hall solana prepare flow partial-signs tx with local asset keypair before sponsor relay send', async ({ page }) => {
  await installTownhallWalletMocks(page);

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
            web3ModuleUrl: 'mock://solana-web3',
            sponsorSendEnabled: true,
            sponsorFeePayer: 'FeePayerMock1111111111111111111111111111111'
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
          signer: 'So1anaWalletMint11111111111111111111111111111',
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

  const sponsorSendBodies = [];
  await page.route('**/api/townhall/mint/solana/sponsor-send', async (route) => {
    const body = route.request().postDataJSON();
    sponsorSendBodies.push(body);
    const idx = Math.min(sponsorSendBodies.length - 1, 1);
    const signatures = ['sol-user-signature', 'sol-agent-signature'];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        signature: signatures[idx],
        solana: {
          signature: signatures[idx],
          cluster: 'devnet',
          rpcUrl: 'https://api.devnet.solana.com',
          feePayer: 'FeePayerMock1111111111111111111111111111111'
        }
      })
    });
  });

  await page.goto('/app');
  await openTownhallPanel(page);
  await completeTownhallStory(page);

  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done');
  await expect(page.getByTestId('townhall-continue-btn')).toBeVisible();

  const signCount = await page.evaluate(() => window.__SOLANA_ASSET_SIGN_COUNT || 0);
  expect(signCount).toBeGreaterThanOrEqual(2);
  expect(sponsorSendBodies.length).toBeGreaterThanOrEqual(2);
  for (const call of sponsorSendBodies) {
    expect(typeof call.transaction).toBe('string');
    expect(call.transaction.length).toBeGreaterThan(0);
    expect(call.walletAddress).toBe('So1anaWalletMint11111111111111111111111111111');
    expect(typeof call.assetPubkey).toBe('string');
  }
});

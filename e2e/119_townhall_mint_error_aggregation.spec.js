const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

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

  if (!(await townhallVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
}

async function completeTownhallStory(page) {
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

test('town hall surfaces both Sepolia and Solana mint failures together', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TOWNHALL_TEST_MOCKS_ENABLED__ = true;
    window.__TEST_EVM_SEND_CALLS = 0;

    const evmAddress = '0x000000000000000000000000000000000000dEaD';
    const solAddress = 'So1anaWalletMint11111111111111111111111111111';
    let solAssetSeed = 0;

    const evmProvider = {
      request: async ({ method }) => {
        if (method === 'eth_requestAccounts') return [evmAddress];
        if (method === 'eth_chainId') return '0xaa36a7';
        if (method === 'wallet_switchEthereumChain') return null;
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
        throw new Error(`unhandled Solana method ${method}`);
      },
      on: () => {},
      off: () => {}
    };

    const markSigned = (tx, maybeSigners) => {
      const signers = Array.isArray(maybeSigners) ? maybeSigners : [maybeSigners];
      const hasSigner = signers.some((entry) => entry && entry.secretKey instanceof Uint8Array);
      if (hasSigner) tx.__assetSigned = true;
      return tx;
    };

    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: solAddress, provider: solProvider, wallet: solProvider }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: new Uint8Array(64) }),
      connectEvm: async () => ({
        address: evmAddress,
        provider: evmProvider,
        executionMode: 'on-device',
        isUnifiedWallet: false
      }),
      disconnectEvm: async () => {},
      sendEvmTransaction: async () => {
        window.__TEST_EVM_SEND_CALLS += 1;
        throw new Error('sendEvmTransaction should not be called for on-device wallets');
      },
      getEvmProvider: () => evmProvider,
      getEvmChainId: async () => 11155111,
      switchEvmChain: async () => null
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
          partialSign: function (...signers) { return markSigned(this, signers); },
          serialize: function () { return this.__assetSigned ? new Uint8Array([9, 2, 3]) : new Uint8Array([1, 2, 3]); }
        })
      },
      Connection: class {
        constructor() {}
      }
    };
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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        tokenUri: `ipfs://bafybeisol-${body.subject}`,
        metadataCid: `bafybeisol-${body.subject}`,
        subject: body.subject,
        erc8004Id: `solana:${body.subject}-asset`,
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
          assetPubkey: body.subject === 'human' ? 'UserAssetPubkey' : 'AgentAssetPubkey'
        }
      })
    });
  });

  await page.route('**/api/townhall/mint/solana/sponsor-send', async (route) => {
    await route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: 'SOLANA_SPONSOR_FEEPAYER_UNFUNDED',
        detail: 'Sponsor fee payer has 0 lamports; at least 10000000 needed to top up owner wallet.'
      })
    });
  });

  await page.goto('/app');
  await openTownhallPanel(page);
  await completeTownhallStory(page);

  const error = page.locator('#townhallRegisterError');
  await expect(error).toContainText('This Privy EVM wallet is still using on-device execution.', { timeout: 15000 });
  await expect(error).toContainText('Sponsor fee payer has 0 lamports; at least 10000000 needed to top up owner wallet.');

  const evmSendCalls = await page.evaluate(() => window.__TEST_EVM_SEND_CALLS || 0);
  expect(evmSendCalls).toBe(0);
});

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
                const idx = Math.min(evmMintIndex, evmMintResults.length - 1);
                const result = evmMintResults[idx];
                evmMintIndex += 1;
                return {
                  hash: result.txHash,
                  waitConfirmed: async () => ({
                    result: { agentId: result.agentId },
                    receipt: { transactionHash: result.txHash }
                  })
                };
              }
            };
          }
        }
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
        evm: { chainId: 11155111, network: 'sepolia', rpcUrl: 'https://sepolia.infura.io/v3/test' }
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

  await page.locator('#districtModalClose').click();
  await page.getByRole('button', { name: 'Open Town Hall' }).click();
  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();
  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallHumanPrompt').fill('Human image prompt used');
  await page.locator('#townhallAgentPrompt').fill('Agent image prompt used');

  await page.getByTestId('townhall-register-btn').click();

  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done');
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered');

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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        tokenUri: 'ipfs://bafybeievmmock-human',
        metadataCid: 'bafybeievmmock-human',
        subject: 'human',
        evm: { chainId: 11155111, network: 'sepolia', rpcUrl: 'https://sepolia.infura.io/v3/test' }
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
  await page.locator('#districtModalClose').click();
  await page.getByRole('button', { name: 'Open Town Hall' }).click();
  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();

  await page.locator('#townhallHumanName').fill('Robin');
  await page.locator('#townhallAgentName').fill('OpenClaw');
  await page.locator('#townhallHumanPrompt').fill('Human image prompt used');
  await page.locator('#townhallAgentPrompt').fill('Agent image prompt used');

  await page.getByTestId('townhall-register-btn').click();

  await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done');
  await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Failed');
  await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Pending');
  await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Pending');
  await expect(page.locator('#townhallRegisterError')).toContainText('does not match');
  await expect(page.locator('#townhallRegisterState')).toContainText('Not registered');
});

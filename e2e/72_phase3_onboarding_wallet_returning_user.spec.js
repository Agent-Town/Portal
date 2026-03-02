const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const {
  makeCeremonyRevealPair,
  encryptCeremonyReveal
} = require('./helpers/ceremony_crypto');
const {
  unlockGateWithSigil,
  attachPathRecorder,
  triggerWalletProfileCheck
} = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

const TEST_SOLANA_WALLET_ADDRESS = 'So1anaMockToken1111111111111111111111111111';

const MINT_IDS = {
  userEvm: '11155111:456',
  userSolana: 'solana:user-asset-789',
  agentEvm: '11155111:457',
  agentSolana: 'solana:agent-asset-790'
};

function sha256(value) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(value).digest();
}

function hkdf(value, info, len = 32) {
  const crypto = require('crypto');
  return Buffer.from(crypto.hkdfSync('sha256', value, Buffer.alloc(0), Buffer.from(info, 'utf8'), len));
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  let out = '';
  while (num > 0n) {
    const mod = num % 58n;
    out = alphabet[Number(mod)] + out;
    num /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) {
    out = `1${out}`;
  }
  return out || '1';
}

function aesGcmEncrypt(key, plaintext) {
  const crypto = require('crypto');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    alg: 'AES-GCM',
    iv: iv.toString('base64'),
    ct: Buffer.concat([enc, tag]).toString('base64')
  };
}

function snapshotPathCounts(calls, paths) {
  const snapshot = {};
  for (const pathname of paths) {
    snapshot[pathname] = calls.filter((entry) => entry.pathname === pathname).length;
  }
  return snapshot;
}

async function postJson(page, path, body = {}) {
  return page.evaluate(async ({ targetPath, payload }) => {
    const resp = await fetch(targetPath, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    const data = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      status: resp.status,
      body: data
    };
  }, { targetPath: path, payload: body });
}

async function getJson(page, path) {
  return page.evaluate(async ({ targetPath }) => {
    const resp = await fetch(targetPath, { credentials: 'include' });
    const data = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      status: resp.status,
      body: data
    };
  }, { targetPath: path });
}

async function mockTownhallMintFlow(page) {
  const evmAddress = '0x000000000000000000000000000000000000dEaD';
  const solAddress = TEST_SOLANA_WALLET_ADDRESS;

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

async function openTownhallPanel(page) {
  const panel = page.locator('#townhallRegisterPanel');
  const isAnyTownhallStepVisible = async () => (
    (await page.locator('#townhallStepHuman').isVisible())
    || (await page.locator('#townhallStepAgent').isVisible())
    || (await page.locator('#townhallStepProcessing').isVisible())
  );
  const visible = async () => (
    (await panel.isVisible())
    || await page.locator('#townhallStepHuman').isVisible()
    || await page.locator('#townhallStepAgent').isVisible()
    || await page.locator('#townhallStepProcessing').isVisible()
  );
  if (await visible()) return;

  const backdrop = page.locator('#districtModalBackdrop');
  if (await backdrop.isVisible()) {
    const closeBtn = page.locator('#districtModalClose');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await expect.poll(() => isAnyTownhallStepVisible()).toBe(true);
      return;
    }
  }

  if (await visible()) return;
  const closeBtn = page.locator('#districtModalClose');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
  if (!(await visible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect.poll(() => isAnyTownhallStepVisible(), { timeout: 12000 }).toBe(true);
}

async function enterPortalAndVerifyWallet(page) {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        config: null,
        startPageEnabled: false,
        appPath: '/app'
      })
    });
  });

  await page.goto('/');
  const enterBtn = page.locator('#enterBtn');
  if (await enterBtn.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForURL((url) => /\/app$/.test(new URL(url).pathname), { timeout: 5000 }).catch(() => {}),
      enterBtn.click()
    ]);
    await page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  if (page.url().includes('/start') || page.url().endsWith('/')) {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
  }

  const authSignup = page.getByTestId('auth-signup');
  const hatchWalletBtn = page.getByTestId('hatch-wallet-check');

  if (await authSignup.isVisible().catch(() => false)) {
    await authSignup.click();
  }

  const townhallStepHuman = page.locator('#townhallStepHuman');
  if (await hatchWalletBtn.isVisible().catch(() => false)) {
    await hatchWalletBtn.click();
    const walletStatus = page.locator('#walletStatus');
    if (await walletStatus.count()) {
      await expect(walletStatus).toContainText('Wallet verified. Configure brain.', { timeout: 8000 });
      return;
    }
  }

  if (await townhallStepHuman.isVisible().catch(() => false)) {
    return;
  }

  await triggerWalletProfileCheck(page).catch(async (err) => {
    const connectHeroBtn = page.locator('#connectWalletHeroBtn');
    if (await connectHeroBtn.isVisible().catch(() => false)) {
      await connectHeroBtn.click();
      await hatchWalletBtn.first().waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
      if (await hatchWalletBtn.isVisible().catch(() => false)) {
        await hatchWalletBtn.click();
        const walletStatus = page.locator('#walletStatus');
        if (await walletStatus.count()) {
          await expect(walletStatus).toContainText('Wallet verified. Configure brain.', { timeout: 8000 });
        }
        return;
      }
    }
    if (await townhallStepHuman.isVisible().catch(() => false)) {
      return;
    }
    throw err;
  });

  if (await townhallStepHuman.isVisible().catch(() => false)) {
    return;
  }
  const walletStatus = page.locator('#walletStatus');
  await expect(walletStatus).toContainText('Wallet verified. Configure brain.', { timeout: 8000 });
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

async function connectAgentWithTeamCode(page) {
  const stateResp = await getJson(page, '/api/state');
  expect(stateResp.ok).toBe(true);
  const teamCode = String(stateResp.body?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);
  const connectResp = await postJson(page, '/api/agent/connect', { teamCode, agentName: 'OpenClaw' });
  expect(connectResp.ok).toBe(true);
  expect(connectResp.body?.ok).toBe(true);
  return teamCode;
}

async function completeCeremonyAndInitHouse(page) {
  const stateResp = await getJson(page, '/api/state');
  if (!stateResp.ok || !stateResp.body) {
    return {
      ok: false,
      error: 'STATE_FETCH_FAILED',
      status: stateResp.status,
      stateBody: stateResp.body || {}
    };
  }

  const teamCode = String(stateResp.body?.teamCode || '');
  if (!teamCode) {
    return {
      ok: false,
      error: 'MISSING_TEAM_CODE',
      stateBody: stateResp.body
    };
  }

  const humanReveal = require('crypto').randomBytes(32);
  const agentReveal = require('crypto').randomBytes(32);
  const humanCommit = sha256(humanReveal).toString('base64');
  const agentCommit = sha256(agentReveal).toString('base64');
  const humanPair = makeCeremonyRevealPair();
  const agentPair = makeCeremonyRevealPair();

  const humanCommitResp = await postJson(page, '/api/human/house/commit', {
    commit: humanCommit,
    revealPub: humanPair.publicKeyB64
  });
  if (!humanCommitResp.ok || !humanCommitResp.body?.ok) {
    return {
      ok: false,
      error: 'HUMAN_COMMIT_FAILED',
      detail: humanCommitResp.body
    };
  }

  const agentCommitResp = await postJson(page, '/api/agent/house/commit', {
    teamCode,
    commit: agentCommit,
    revealPub: agentPair.publicKeyB64
  });
  if (!agentCommitResp.ok || !agentCommitResp.body?.ok) {
    return {
      ok: false,
      error: 'AGENT_COMMIT_FAILED',
      detail: agentCommitResp.body
    };
  }

  const materialResp = await getJson(
    page,
    `/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`
  );
  if (!materialResp.ok || !materialResp.body) {
    return {
      ok: false,
      error: 'MATERIAL_FETCH_FAILED',
      detail: materialResp.body
    };
  }
  if (!materialResp.body?.agentRevealPub || !materialResp.body?.humanRevealPub) {
    return {
      ok: false,
      error: 'MATERIAL_MISSING_KEYS',
      detail: materialResp.body
    };
  }

  const humanRevealForAgent = encryptCeremonyReveal({
    revealBytes: humanReveal,
    recipientRevealPubB64: String(materialResp.body.agentRevealPub),
    direction: 'human_to_agent',
    teamCode
  });
  const humanRevealResp = await postJson(page, '/api/human/house/reveal', {
    sealedForAgent: humanRevealForAgent
  });
  if (!humanRevealResp.ok || !humanRevealResp.body?.ok) {
    return {
      ok: false,
      error: 'HUMAN_REVEAL_FAILED',
      detail: humanRevealResp.body
    };
  }

  const agentRevealForHuman = encryptCeremonyReveal({
    revealBytes: agentReveal,
    recipientRevealPubB64: String(materialResp.body.humanRevealPub),
    direction: 'agent_to_human',
    teamCode
  });
  const agentRevealResp = await postJson(page, '/api/agent/house/reveal', {
    teamCode,
    sealedForHuman: agentRevealForHuman
  });
  if (!agentRevealResp.ok || !agentRevealResp.body?.ok) {
    return {
      ok: false,
      error: 'AGENT_REVEAL_FAILED',
      detail: agentRevealResp.body
    };
  }

  const nonceResp = await getJson(page, '/api/house/nonce');
  if (!nonceResp.ok || !nonceResp.body?.nonce) {
    return {
      ok: false,
      error: 'MISSING_HOUSE_NONCE',
      detail: nonceResp.body
    };
  }

  const kroot = sha256(humanReveal);
  const houseId = base58Encode(kroot);
  const houseAuthKey = hkdf(kroot, 'elizatown-house-auth-v1', 32).toString('base64');
  const keyWrapSig = require('crypto').randomBytes(64);
  const keyWrap = aesGcmEncrypt(sha256(keyWrapSig), kroot);

  const initResp = await postJson(page, '/api/house/init', {
    houseId,
    housePubKey: houseId,
    nonce: String(nonceResp.body.nonce),
    keyMode: 'ceremony',
    unlock: {
      kind: 'solana-wallet-signature',
      address: String(stateResp.body?.signup?.address || TEST_SOLANA_WALLET_ADDRESS)
    },
    keyWrap,
    houseAuthKey
  });
  if (!initResp.ok || !initResp.body?.ok) {
    return {
      ok: false,
      error: 'HOUSE_INIT_FAILED',
      detail: initResp.body
    };
  }

  return {
    ok: true,
    teamCode,
    houseId,
    houseAuthKey,
    keyWrapSig: keyWrapSig.toString('base64')
  };
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('walleted returning user does not re-run townhall onboarding flow after full onboarding completion', async ({ page }) => {
  test.setTimeout(120000);

  await installMockSolanaWallet(page);
  await mockTownhallMintFlow(page);
  const pathsToTrack = [
    '/api/townhall/register',
    '/api/townhall/mint/evm/prepare',
    '/api/townhall/mint/solana/prepare'
  ];
  const calls = attachPathRecorder(page, pathsToTrack);
  page.on('request', (req) => {
    const url = req.url();
    if (!url.includes('/api/house/init')) return;
  });

  await enterPortalAndVerifyWallet(page);

  await openTownhallPanel(page);
  await completeTownhallStory(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });

  const brainResp = await postJson(page, '/api/agent/lite/llm/config', {
    provider: 'openai',
    model: 'gpt-4o-mini'
  });
  expect(brainResp.ok).toBe(true);
  expect(brainResp.body?.ok).toBe(true);

  const teamCode = await connectAgentWithTeamCode(page);
  await unlockGateWithSigil(page, 'key');

  const ceremonyResult = await completeCeremonyAndInitHouse(page);
  expect(ceremonyResult.ok).toBe(true);
  await expect.poll(async () => {
    const state = await getJson(page, '/api/state');
    return String(state.body?.onboarding?.step || '');
  }, { timeout: 12000 }).toBe('done');

  const completed = await getJson(page, '/api/state');
  expect(completed.ok).toBe(true);
  expect(completed.body?.onboarding?.step).toBe('done');
  expect(String(completed.body?.teamCode || '')).toBe(teamCode);
  const afterFirstRun = snapshotPathCounts(calls, pathsToTrack);

  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.removeItem('agentTown:teamCodeHint');
    } catch {}
  });

  await page.reload();
  await expect.poll(async () => {
    const state = await getJson(page, '/api/state');
    return String(state.body?.onboarding?.step || '');
  }, { timeout: 12000 }).toBe('done');

  const afterReload = snapshotPathCounts(calls, pathsToTrack);
  expect(afterReload).toEqual(afterFirstRun);

  const rehydratedState = await getJson(page, '/api/state');
  expect(rehydratedState.ok).toBe(true);
  expect(String(rehydratedState.body?.teamCode || '')).toBe(teamCode);
  expect(rehydratedState.body?.onboarding?.registrationComplete).toBe(true);
  expect(rehydratedState.body?.onboarding?.profile?.humanName).toBe('Robin');
  expect(rehydratedState.body?.onboarding?.profile?.agentName).toBe('OpenClaw');
});

const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const crypto = require('crypto');
const {
  makeCeremonyRevealPair,
  encryptCeremonyReveal
} = require('./helpers/ceremony_crypto');
const {
  unlockGateWithSigil,
  attachPathRecorder
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
  return crypto.createHash('sha256').update(value).digest();
}

function hkdf(value, info, len = 32) {
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

function countCalls(calls, pathname) {
  return calls.filter((entry) => entry.pathname === pathname).length;
}

function snapshotPathCounts(calls, paths) {
  const snapshot = {};
  for (const pathname of paths) {
    snapshot[pathname] = countCalls(calls, pathname);
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
  const townhallVisible = async () => (
    (await panel.isVisible())
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
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
  if (!(await townhallVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
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

  const humanReveal = crypto.randomBytes(32);
  const agentReveal = crypto.randomBytes(32);
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
  const keyWrapSig = crypto.randomBytes(64);
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

test('state endpoint does not emit Secure session cookies in local test mode', async ({ request }) => {
  const resp = await request.get('/api/state', {
    headers: {
      // Simulate reverse-proxy secure forwarding while still on local HTTP.
      'x-forwarded-proto': 'https',
      // Force a missing/invalid session so the server must mint a new cookie.
      cookie: 'et_session=bogus'
    }
  });
  expect(resp.ok()).toBe(true);

  const setCookie = String(resp.headers()['set-cookie'] || '');
  expect(setCookie).toContain('et_session=');
  expect(setCookie).not.toMatch(/;\s*Secure/i);

  const body = await resp.json();
  expect(String(body?.teamCode || '')).toMatch(/^TEAM-/);
});

test('state endpoint restores session via team code hint when cookie is missing', async ({ request }) => {
  const first = await request.get('/api/state', {
    headers: { cookie: 'et_session=missing' }
  });
  expect(first.ok()).toBe(true);
  const firstBody = await first.json();
  const hintedTeamCode = String(firstBody?.teamCode || '');
  expect(hintedTeamCode).toMatch(/^TEAM-/);

  const second = await request.get('/api/state', {
    headers: {
      cookie: 'et_session=missing',
      'x-team-code-hint': hintedTeamCode
    }
  });
  expect(second.ok()).toBe(true);
  const secondBody = await second.json();
  expect(String(secondBody?.teamCode || '')).toBe(hintedTeamCode);

  const third = await request.get('/api/state', {
    headers: {
      cookie: 'et_session=missing',
      'x-team-code-hint': hintedTeamCode
    }
  });
  expect(third.ok()).toBe(true);
  const thirdBody = await third.json();
  expect(String(thirdBody?.teamCode || '')).toBe(hintedTeamCode);
});

test('OpenAI Codex PKCE endpoints start, report status, and exchange code', async ({ request }) => {
  const startResp = await request.post('/api/agent/lite/llm/oauth/openai-codex/start', {
    data: { provider: 'openai-codex', originator: 'playwright' }
  });
  expect(startResp.ok()).toBe(true);
  const started = await startResp.json();
  expect(started?.ok).toBe(true);
  expect(String(started?.attemptId || '')).toMatch(/^ocx_/);
  expect(String(started?.state || '')).toMatch(/^[a-f0-9]{32}$/);
  expect(String(started?.authorizeUrl || '')).toContain('response_type=code');
  expect(String(started?.authorizeUrl || '')).toContain('code_challenge=');

  const statusResp = await request.get(`/api/agent/lite/llm/oauth/openai-codex/status?attemptId=${encodeURIComponent(started.attemptId)}`);
  expect(statusResp.ok()).toBe(true);
  const statusBody = await statusResp.json();
  expect(statusBody?.ok).toBe(true);
  expect(statusBody?.attempt?.status).toBe('pending');
  expect(statusBody?.attempt?.hasCode).toBe(false);

  const exchangeResp = await request.post('/api/agent/lite/llm/oauth/openai-codex/exchange', {
    data: {
      attemptId: started.attemptId,
      callbackInput: 'test-code-pkce'
    }
  });
  expect(exchangeResp.ok()).toBe(true);
  const exchanged = await exchangeResp.json();
  expect(exchanged?.ok).toBe(true);
  expect(String(exchanged?.credential?.provider || '')).toBe('openai-codex');
  expect(String(exchanged?.credential?.access || '')).toMatch(/^eyJ/);
  expect(String(exchanged?.credential?.accountId || '')).toBe('acct_test');
});

test('OpenAI Codex exchange resolves callback state even when attemptId is stale', async ({ request }) => {
  const startA = await request.post('/api/agent/lite/llm/oauth/openai-codex/start', {
    data: { provider: 'openai-codex', originator: 'playwright-state-a' }
  });
  expect(startA.ok()).toBe(true);
  const a = await startA.json();

  const startB = await request.post('/api/agent/lite/llm/oauth/openai-codex/start', {
    data: { provider: 'openai-codex', originator: 'playwright-state-b' }
  });
  expect(startB.ok()).toBe(true);
  const b = await startB.json();

  expect(String(a?.attemptId || '')).not.toBe(String(b?.attemptId || ''));
  expect(String(a?.state || '')).not.toBe(String(b?.state || ''));

  const callbackUrlForA = `http://localhost:1455/auth/callback?code=test-code-state-rebind&state=${encodeURIComponent(String(a?.state || ''))}`;
  const exchangeWithStaleAttemptId = await request.post('/api/agent/lite/llm/oauth/openai-codex/exchange', {
    data: {
      attemptId: b.attemptId,
      callbackInput: callbackUrlForA
    }
  });
  expect(exchangeWithStaleAttemptId.ok()).toBe(true);
  const exchanged = await exchangeWithStaleAttemptId.json();
  expect(exchanged?.ok).toBe(true);
  expect(String(exchanged?.attempt?.id || '')).toBe(String(a?.attemptId || ''));
  expect(String(exchanged?.credential?.access || '')).toMatch(/^eyJ/);
  expect(String(exchanged?.credential?.accountId || '')).toBe('acct_test');
});

test('hero wallet onboarding path opens setup and runs wallet profile check', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.locator('#connectWalletHeroBtn').click();

  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 1000 });
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await expect(page.locator('#step2')).not.toHaveClass(/disabled/);
});

test('full onboarding flow stores once-per-wallet completion and skips townhall/ceremony on reload', async ({ page }) => {
  await installMockSolanaWallet(page);
  await mockTownhallMintFlow(page);

  const pathsToTrack = [
    '/api/townhall/register',
    '/api/townhall/mint/evm/prepare',
    '/api/townhall/mint/solana/prepare',
    '/api/agent/connect',
    '/api/human/house/commit',
    '/api/agent/house/commit',
    '/api/human/house/reveal',
    '/api/agent/house/reveal',
    '/api/house/nonce',
    '/api/house/init'
  ];
  const calls = attachPathRecorder(page, pathsToTrack);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await openTownhallPanel(page);
  await completeTownhallStory(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 12000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  const stateWithTeam = await getJson(page, '/api/state');
  expect(stateWithTeam.ok).toBe(true);
  const teamCode = String(stateWithTeam.body?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);
  const connectResp = await postJson(page, '/api/agent/connect', {
    teamCode,
    agentName: 'OpenClaw'
  });
  expect(connectResp.ok).toBe(true);
  expect(connectResp.body?.ok).toBe(true);

  await expect(page.getByTestId('townhall-continue-btn')).toBeEnabled({ timeout: 10000 });
  await page.getByTestId('townhall-continue-btn').click();
  await expect(page.getByTestId('open-btn')).toBeVisible({ timeout: 8000 });
  await unlockGateWithSigil(page, 'key');

  const ceremonyResult = await completeCeremonyAndInitHouse(page);
  expect(ceremonyResult.ok).toBe(true);
  await expect.poll(async () => {
    const doneState = await getJson(page, '/api/state');
    return String(doneState.body?.onboarding?.step || '');
  }, { timeout: 12000 }).toBe('done');

  const doneState = await getJson(page, '/api/state');
  expect(doneState.ok).toBe(true);
  expect(doneState.body?.onboarding?.step).toBe('done');
  expect(doneState.body?.signup?.complete).toBe(true);
  expect(doneState.body?.houseId).toBe(ceremonyResult.houseId);
  const preservedTeamCode = String(doneState.body?.teamCode || '');
  expect(preservedTeamCode).toBe(teamCode);

  const endpointCountsAfterFlow = snapshotPathCounts(calls, pathsToTrack);
  await page.waitForTimeout(500);
  const stableEndpointCountsAfterFlow = snapshotPathCounts(calls, pathsToTrack);
  expect(stableEndpointCountsAfterFlow).toEqual(endpointCountsAfterFlow);

  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.removeItem('agentTown:teamCodeHint');
    } catch {
      // ignore localStorage access errors
    }
  });

  await page.reload();

  const rehydratedState = await getJson(page, '/api/state');
  expect(rehydratedState.ok).toBe(true);
  expect(rehydratedState.body?.teamCode).toBe(preservedTeamCode);
  expect(rehydratedState.body?.onboarding?.step).toBe('done');
  expect(rehydratedState.body?.signup?.complete).toBe(true);
  expect(rehydratedState.body?.houseId).toBe(ceremonyResult.houseId);

  const endpointCountsAfterReload = snapshotPathCounts(calls, pathsToTrack);
  expect(endpointCountsAfterReload).toEqual(stableEndpointCountsAfterFlow);
});

test('llm mind config is stored locally and restored after reload', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.reload();
  await expect(page.getByTestId('hatch-panel')).toHaveCount(1);
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai');
  await expect(page.getByTestId('lite-llm-model')).toHaveValue('gpt-4o-mini');
  await expect(page.getByTestId('lite-llm-api-key')).toHaveValue('local-test-key');
});

test('agent panel brain controls configure provider/model/thinking via the same setup pipeline', async ({ page }) => {
  await installMockSolanaWallet(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('agentTown:panel:minimized', '0');
    } catch {}
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);

  await page.getByTestId('agent-llm-provider').selectOption('openai-codex');
  await page.getByTestId('agent-llm-model').selectOption('gpt-5.3-codex');
  await page.getByTestId('agent-llm-thinking').selectOption('xhigh');
  await page.getByTestId('agent-llm-api-key').fill('local-test-key');
  await page.getByTestId('agent-llm-save').click();

  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai-codex');
  await expect(page.getByTestId('lite-llm-model')).toHaveValue('gpt-5.3-codex');
  await expect(page.locator('#llmThinkingInput')).toHaveValue('xhigh');
  await expect(page.getByTestId('agent-llm-thinking')).toHaveValue('xhigh');
});

test('agent panel brain completes OpenAI PKCE exchange and configures brain', async ({ page }) => {
  await installMockSolanaWallet(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('agentTown:panel:minimized', '0');
    } catch {}
    try {
      window.open = () => ({ closed: false, close() {} });
    } catch {}
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);

  await page.getByTestId('agent-llm-provider').selectOption('openai-codex');
  await page.getByTestId('agent-llm-model').selectOption('gpt-5.3-codex');
  await page.getByTestId('agent-llm-auth').selectOption('oauth-json');
  await page.getByTestId('agent-llm-oauth-complete').waitFor({ state: 'visible', timeout: 2000 });
  await page.locator('#agentLlmOauthLaunchBtn').click();
  await expect(page.getByTestId('agent-llm-status')).toContainText('OAuth started', { timeout: 3000 });

  await page.locator('#agentLlmOauthProfileInput').fill('test-code-agent');
  await page.getByTestId('agent-llm-oauth-complete').click();
  await expect(page.getByTestId('agent-llm-status')).toContainText('OAuth exchange complete', { timeout: 3000 });

  const exchanged = await page.getByTestId('agent-llm-api-key').inputValue();
  expect(exchanged).toMatch(/^eyJ/);
  await page.getByTestId('agent-llm-save').click();

  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai-codex');
  await expect(page.getByTestId('lite-llm-api-key')).toHaveValue(exchanged);
});

test('agent panel brain rejects OpenAI id_token callback URLs with clear guidance', async ({ page }) => {
  await installMockSolanaWallet(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('agentTown:panel:minimized', '0');
    } catch {}
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);

  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(JSON.stringify({
    iss: 'https://auth.openai.com',
    at_hash: 'test-at-hash',
    'https://api.openai.com/auth': { chatgpt_account_id: 'acct_test' },
  })).toString('base64url');
  const idToken = `${jwtHeader}.${jwtPayload}.signature`;
  const callbackUrl = `http://localhost:1455/success?id_token=${encodeURIComponent(idToken)}&needs_setup=false`;

  await page.getByTestId('agent-llm-provider').selectOption('openai-codex');
  await page.getByTestId('agent-llm-model').selectOption('gpt-5.3-codex');
  await page.getByTestId('agent-llm-api-key').fill(callbackUrl);
  await page.getByTestId('agent-llm-save').click();

  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain config failed: Detected OpenAI id_token callback URL.', { timeout: 2000 });
});

test('returning user auto-connects with saved brain without repeating wallet/brain setup', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const addr = 'So1anaMockToken1111111111111111111111111111';
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => addr } }),
      signMessage: async () => ({ signature: new Uint8Array(64) })
    };
  });

  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });
  await page.waitForFunction(async () => {
    if (!window.__openclawLiteTest || typeof window.__openclawLiteTest.skillState !== 'function') return false;
    const skill = await window.__openclawLiteTest.skillState().catch(() => null);
    const status = String(skill?.data?.status || skill?.status || '').trim().toLowerCase();
    return status === 'ready';
  }, null, { timeout: 10000 });

  await page.evaluate(() => {
    try {
      delete window.solana;
    } catch {
      window.solana = undefined;
    }
  });
  await page.reload();

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  await expect(page.locator('#step1')).toHaveClass(/done/);
  await expect(page.locator('#step2')).toHaveClass(/done/);
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai');
  await expect(page.getByTestId('lite-llm-model')).toHaveValue('gpt-4o-mini');
  await expect(page.locator('#hatchStatus')).toContainText('Agent ready.');
  await expect(page.locator('#welcomePanel')).toHaveClass(/is-hidden/);
  await expect(page.locator('#townPanel')).not.toHaveClass(/is-hidden/);
});

test('session reset reboots runtime and reconnects OpenClaw Lite with local LLM config', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  const previousTeamCode = await page.evaluate(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return String(state?.teamCode || '');
  });
  expect(previousTeamCode).toMatch(/^TEAM-/);

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  const reset = await page.evaluate(async () => {
    const res = await fetch('/api/session/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await res.json().catch(() => ({}));
    return {
      ok: !!body?.ok,
      teamCode: String(body?.teamCode || '')
    };
  });
  expect(reset.ok).toBe(true);
  expect(reset.teamCode).toMatch(/^TEAM-/);
  expect(reset.teamCode).not.toBe(previousTeamCode);

  await page.waitForFunction(async (oldCode) => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return typeof state?.teamCode === 'string' && state.teamCode !== oldCode;
  }, previousTeamCode, { timeout: 10000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  await expect(page.locator('#liteAgentStatus')).toContainText('Agent connected: OpenClaw Lite', { timeout: 5000 });
  await expect(page.locator('#hatchStatus')).not.toContainText('OpenClaw Lite runtime is starting…', { timeout: 5000 });
});

test('agent readiness status tracks skill import failure and recovery', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });
  await expect(page.locator('#hatchStatus')).toContainText('Agent ready.', { timeout: 10000 });

  await page.waitForFunction(() => {
    return !!(window.__openclawLiteTest && typeof window.__openclawLiteTest.visitExperience === 'function');
  }, null, { timeout: 5000 });

  const failedVisit = await page.evaluate(async () => {
    return await window.__openclawLiteTest.visitExperience({ url: 'https://example.invalid/skill.md' });
  });
  expect(failedVisit?.ok).toBe(false);
  expect(failedVisit?.error?.code).toBe('NOT_FOUND');

  await expect(page.locator('#liteAgentStatus')).toContainText('skill import failed', { timeout: 5000 });
  await expect(page.locator('#hatchStatus')).toContainText('Skill import failed.', { timeout: 5000 });

  const recoveredVisit = await page.evaluate(async () => {
    return await window.__openclawLiteTest.visitExperience({ url: '/skill.md' });
  });
  expect(recoveredVisit?.ok).toBe(true);

  await expect(page.locator('#liteAgentStatus')).toContainText('Agent connected: OpenClaw Lite', { timeout: 5000 });
  await expect(page.locator('#hatchStatus')).toContainText('Agent ready.', { timeout: 5000 });
});

test('wallet lookup/signature failure does not block brain setup for new onboarding', async ({ page }) => {
  await page.addInitScript(() => {
    const addr = 'So1anaMockToken1111111111111111111111111111';
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => addr } }),
      signMessage: async () => {
        throw new Error('USER_REJECTED');
      }
    };
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();

  await expect(page.locator('#walletStatus')).toContainText(
    'Wallet signature was cancelled.',
    { timeout: 2000 }
  );
  await expect(page.locator('#step2')).not.toHaveClass(/disabled/);
});

test('experience run no longer hard-fails with hatch-required when llm is configured before setup completion', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  const run = await page.evaluate(async () => {
    return await window.__openclawLiteTest.experienceRun({ prompt: 'Read SKILL.md and do the next step.' });
  });

  if (run?.ok === false) {
    expect(run?.error?.code).not.toBe('HATCH_REQUIRED');
    expect(run?.error?.details?.mode).toBe('agent-turn');
  } else {
    expect(run?.ok).toBe(true);
    expect(run?.data?.mode).toBe('agent-turn');
  }
});

test('onboarding visibility stays stable when agent source changes to external after local runtime connect', async ({ page, request }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  const session = await request.get('/api/session');
  expect(session.ok()).toBeTruthy();
  const sessionBody = await session.json();
  const teamCode = String(sessionBody?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);

  const externalConnect = await request.post('/api/agent/connect', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode, agentName: 'VisibilityWorker' }
  });
  expect(externalConnect.ok()).toBeTruthy();

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'external';
  }, null, { timeout: 10000 });

  await page.waitForTimeout(2200);
  await expect(page.locator('#townPanel')).not.toHaveClass(/is-hidden/);
  await expect(page.locator('#hatchPanel')).toHaveClass(/is-hidden/);
});

test('human sigil selection stays visible and persisted through town polling updates', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true;
  }, null, { timeout: 10000 });

  await page.getByTestId('sigil-key').click();
  await expect(page.getByTestId('sigil-key')).toHaveClass(/selected/, { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.human?.selected === 'key';
  }, null, { timeout: 4000 });

  await page.waitForTimeout(2200);
  await expect(page.getByTestId('sigil-key')).toHaveClass(/selected/);
});

test('refresh keeps team session, town panel visibility, and selected sigil', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true;
  }, null, { timeout: 10000 });

  const teamCodeBeforeReload = await page.evaluate(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return String(state?.teamCode || '');
  });
  expect(teamCodeBeforeReload).toMatch(/^TEAM-/);

  await page.getByTestId('sigil-key').click();
  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.human?.selected === 'key';
  }, null, { timeout: 4000 });

  await page.reload();

  await page.waitForFunction(async (expectedTeamCode) => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.teamCode === expectedTeamCode && state?.human?.selected === 'key';
  }, teamCodeBeforeReload, { timeout: 10000 });

  await expect(page.locator('#townPanel')).not.toHaveClass(/is-hidden/);
  await expect(page.locator('#hatchPanel')).toHaveClass(/is-hidden/);
  await expect(page.getByTestId('sigil-key')).toHaveClass(/selected/);
});

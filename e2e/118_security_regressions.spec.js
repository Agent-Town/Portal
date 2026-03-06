const { test, expect, request: pwRequest } = require('@playwright/test');
const path = require('path');
const { Wallet } = require('ethers');

const {
  DEFAULT_TEST_TOKEN_ADDRESS,
  seedRecoverableTokenHouse,
  houseAuthHeadersFromKeyB64
} = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const ACTIVE_TEST_STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

test.beforeEach(async ({ request }) => {
  const resetResp = await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  expect(resetResp.ok()).toBeTruthy();
});

async function createApiContext(testInfo) {
  return pwRequest.newContext({ baseURL: testInfo.project.use.baseURL });
}

async function getSession(api) {
  const resp = await api.get('/api/session');
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body?.ok).toBe(true);
  expect(typeof body?.teamCode).toBe('string');
  return body;
}

async function paintHumanCanvas(api, count = 3) {
  for (let i = 0; i < count; i += 1) {
    const paintResp = await api.post('/api/human/canvas/paint', {
      data: { x: i % 16, y: Math.floor(i / 16), color: (i % 7) + 1 }
    });
    expect(paintResp.ok()).toBeTruthy();
  }
}

async function createAuthedShare(api, houseId, houseAuthKeyB64) {
  const sharePath = `/api/house/${encodeURIComponent(houseId)}/share`;
  const headers = houseAuthHeadersFromKeyB64(houseId, 'POST', sharePath, '', houseAuthKeyB64);
  const shareResp = await api.post(sharePath, { data: '', headers });
  expect(shareResp.ok()).toBeTruthy();
  const share = await shareResp.json();
  expect(typeof share?.shareId).toBe('string');
  return share;
}

function buildAnchorLinkMessage({ houseId, erc8004Id, origin, nonce, createdAtMs }) {
  return [
    'AgentTown Anchor Link',
    `houseId: ${houseId}`,
    `erc8004Id: ${erc8004Id}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`,
    `createdAtMs: ${createdAtMs}`
  ].join('\n');
}

function buildErc8004OptOutMessage({ erc8004Id, nonce, mode = 'delete' }) {
  return [
    'AgentTown ERC-8004 Opt-Out',
    `erc8004Id: ${erc8004Id}`,
    `nonce: ${nonce}`,
    `mode: ${mode}`
  ].join('\n');
}

function withStoreModule(callback) {
  const modulePath = require.resolve('../server/store');
  const previousStorePath = process.env.STORE_PATH;
  delete require.cache[modulePath];
  process.env.STORE_PATH = ACTIVE_TEST_STORE_PATH;
  const storeModule = require('../server/store');
  try {
    return callback(storeModule);
  } finally {
    delete require.cache[modulePath];
    if (previousStorePath == null) delete process.env.STORE_PATH;
    else process.env.STORE_PATH = previousStorePath;
  }
}

async function enableClaimMode(api, agentId) {
  const nonceResp = await api.get(`/api/claim/erc8004/nonce?agentId=${encodeURIComponent(agentId)}`);
  expect(nonceResp.ok()).toBeTruthy();
  const nonceBody = await nonceResp.json();
  const verifyResp = await api.post('/api/claim/erc8004/verify', {
    data: {
      agentId,
      nonce: nonceBody.nonce,
      signature: 'test-claim-signature'
    }
  });
  expect(verifyResp.ok()).toBeTruthy();
}

async function initClaimHouse(api, label) {
  await enableClaimMode(api, `claim-agent-${label}`);
  const nonceResp = await api.get('/api/house/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;
  const houseId = `claim_house_${label}_${Date.now()}`;
  const initResp = await api.post('/api/house/init', {
    data: {
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address: DEFAULT_TEST_TOKEN_ADDRESS },
      houseAuthKey: Buffer.alloc(32, 7).toString('base64')
    }
  });
  expect(initResp.ok()).toBeTruthy();
  return houseId;
}

test('agent house reconnect rejects blind houseId mutation but still allows teamCode reconnect', async ({ request }, testInfo) => {
  const ownerApi = await createApiContext(testInfo);
  const externalApi = await createApiContext(testInfo);

  try {
    const ownerSession = await getSession(ownerApi);
    const seeded = await seedRecoverableTokenHouse(ownerApi);

    const blindResp = await externalApi.post('/api/agent/house/connect', {
      data: { houseId: seeded.houseId, agentName: 'BlindReconnect' }
    });
    expect(blindResp.status()).toBe(401);
    expect((await blindResp.json()).error).toBe('HOUSE_SESSION_REQUIRED');

    const cookieResp = await ownerApi.post('/api/agent/house/connect', {
      data: { houseId: seeded.houseId, agentName: 'CookieReconnect' }
    });
    expect(cookieResp.ok()).toBeTruthy();

    const teamCodeResp = await externalApi.post('/api/agent/house/connect', {
      data: { teamCode: ownerSession.teamCode, houseId: seeded.houseId, agentName: 'ExternalReconnect' }
    });
    expect(teamCodeResp.ok()).toBeTruthy();

    const stateResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(ownerSession.teamCode)}`);
    expect(stateResp.ok()).toBeTruthy();
    const state = await stateResp.json();
    expect(state?.ceremony?.houseId).toBe(seeded.houseId);
    expect(state?.agent?.connected).toBe(true);
    expect(state?.agent?.name).toBe('ExternalReconnect');
  } finally {
    await ownerApi.dispose();
    await externalApi.dispose();
  }
});

test('wallet lookup requires nonce and forged anchor opt-out chain is blocked without house auth', async ({ request }, testInfo) => {
  const ownerApi = await createApiContext(testInfo);
  const attackerApi = await createApiContext(testInfo);
  const origin = String(testInfo.project.use.baseURL || '');

  try {
    await getSession(ownerApi);
    const seeded = await seedRecoverableTokenHouse(ownerApi);
    const share = await createAuthedShare(ownerApi, seeded.houseId, seeded.houseAuthKey);

    const legacyLookupResp = await ownerApi.post('/api/wallet/lookup', {
      data: {
        address: DEFAULT_TEST_TOKEN_ADDRESS,
        signature: 'legacy-static-signature',
        houseId: seeded.houseId
      }
    });
    expect(legacyLookupResp.status()).toBe(400);
    expect((await legacyLookupResp.json()).error).toBe('MISSING_NONCE');

    const walletNonceResp = await ownerApi.get('/api/wallet/nonce');
    expect(walletNonceResp.ok()).toBeTruthy();
    const walletNonce = (await walletNonceResp.json()).nonce;
    const nonceLookupResp = await ownerApi.post('/api/wallet/lookup', {
      data: {
        address: DEFAULT_TEST_TOKEN_ADDRESS,
        nonce: walletNonce,
        signature: 'fresh-nonce-signature',
        houseId: seeded.houseId
      }
    });
    expect(nonceLookupResp.ok()).toBeTruthy();
    const lookup = await nonceLookupResp.json();
    expect(lookup.houseId).toBe(seeded.houseId);

    await getSession(attackerApi);
    const anchorNonceResp = await attackerApi.get('/api/anchors/nonce');
    expect(anchorNonceResp.ok()).toBeTruthy();
    const anchorNonce = (await anchorNonceResp.json()).nonce;

    const signer = Wallet.createRandom();
    const erc8004Id = '11155111:9911';
    const createdAtMs = Date.now();
    const anchorMessage = buildAnchorLinkMessage({
      houseId: seeded.houseId,
      erc8004Id,
      origin,
      nonce: anchorNonce,
      createdAtMs
    });
    const anchorSignature = await signer.signMessage(anchorMessage);

    const registerResp = await attackerApi.post('/api/anchors/register', {
      data: {
        houseId: seeded.houseId,
        erc8004Id,
        createdAtMs,
        nonce: anchorNonce,
        signer: signer.address,
        signature: anchorSignature,
        chainId: 11155111,
        origin
      }
    });
    expect(registerResp.status()).toBe(401);
    expect((await registerResp.json()).error).toBe('HOUSE_AUTH_REQUIRED');

    const optOutNonceResp = await attackerApi.get(`/api/erc8004/optout/nonce?erc8004Id=${encodeURIComponent(erc8004Id)}`);
    expect(optOutNonceResp.ok()).toBeTruthy();
    const optOutNonce = (await optOutNonceResp.json()).nonce;
    const optOutMessage = buildErc8004OptOutMessage({ erc8004Id, nonce: optOutNonce, mode: 'delete' });
    const optOutSignature = await signer.signMessage(optOutMessage);

    const optOutResp = await attackerApi.post('/api/erc8004/optout', {
      data: {
        erc8004Id,
        ownerAddress: signer.address,
        chainType: 'evm',
        signature: optOutSignature,
        nonce: optOutNonce,
        mode: 'delete'
      }
    });
    expect(optOutResp.status()).toBe(404);
    expect((await optOutResp.json()).error).toBe('NOT_FOUND');

    const shareResp = await request.get(`/api/share/${encodeURIComponent(share.shareId)}`);
    expect(shareResp.ok()).toBeTruthy();
    const shareJson = await shareResp.json();
    expect(shareJson.share?.id).toBe(share.shareId);
  } finally {
    await ownerApi.dispose();
    await attackerApi.dispose();
  }
});

test('share creation is idempotent, claim shares keep claim mode, and human posts stay owner-scoped', async ({}, testInfo) => {
  const ownerApi = await createApiContext(testInfo);
  const attackerApi = await createApiContext(testInfo);

  try {
    const houseId = await initClaimHouse(ownerApi, 'owner');
    await paintHumanCanvas(ownerApi);

    const firstCreateResp = await ownerApi.post('/api/share/create', { data: {} });
    expect(firstCreateResp.ok()).toBeTruthy();
    const firstCreate = await firstCreateResp.json();

    const secondCreateResp = await ownerApi.post('/api/share/create', { data: {} });
    expect(secondCreateResp.ok()).toBeTruthy();
    const secondCreate = await secondCreateResp.json();

    expect(secondCreate.shareId).toBe(firstCreate.shareId);

    const byHouseResp = await ownerApi.get(`/api/share/by-house/${encodeURIComponent(houseId)}`);
    expect(byHouseResp.ok()).toBeTruthy();
    expect((await byHouseResp.json()).shareId).toBe(firstCreate.shareId);

    const shareResp = await ownerApi.get(`/api/share/${encodeURIComponent(firstCreate.shareId)}`);
    expect(shareResp.ok()).toBeTruthy();
    const share = await shareResp.json();
    expect(share.share?.mode).toBe('claim');

    withStoreModule(({ readStore }) => {
      const store = readStore();
      const sharesForHouse = (store.shares || []).filter((row) => row && row.houseId === houseId);
      expect(sharesForHouse).toHaveLength(1);
    });

    const attackerPostResp = await attackerApi.post('/api/human/posts', {
      data: {
        shareId: firstCreate.shareId,
        xPostUrl: 'https://x.com/attacker/status/1'
      }
    });
    expect(attackerPostResp.status()).toBe(403);
    expect((await attackerPostResp.json()).error).toBe('SHARE_FORBIDDEN');

    const ownerPostResp = await ownerApi.post('/api/human/posts', {
      data: {
        shareId: firstCreate.shareId,
        xPostUrl: 'https://x.com/owner/status/1'
      }
    });
    expect(ownerPostResp.ok()).toBeTruthy();

    const shareAfterResp = await ownerApi.get(`/api/share/${encodeURIComponent(firstCreate.shareId)}`);
    expect(shareAfterResp.ok()).toBeTruthy();
    const shareAfter = await shareAfterResp.json();
    expect(shareAfter.share?.xPostUrl).toBe('https://x.com/owner/status/1');
    expect(shareAfter.share?.humanHandle).toBe('owner');
  } finally {
    await ownerApi.dispose();
    await attackerApi.dispose();
  }
});

test('x claim challenge rejects already-claimed handles before issuing a replayable challenge', async ({ request }) => {
  withStoreModule(({ writeStore }) => {
    writeStore({
      signups: [],
      shares: [],
      publicTeams: [],
      houses: [],
      claims: [
        {
          id: 'cl_existing_x',
          createdAt: new Date().toISOString(),
          kind: 'x',
          handle: 'replayguard',
          tweetUrl: 'https://x.com/replayguard/status/1',
          challenge: 'already verified'
        }
      ],
      reservations: [
        {
          id: 'res_existing_x',
          kind: 'x',
          key: '@replayguard',
          houseId: 'house_x_replay',
          status: 'verified',
          verifiedAt: new Date().toISOString()
        }
      ],
      milestones: [],
      rewardsLedger: [],
      anchors: [],
      inbox: [],
      erc8004OptOut: [],
      erc8004Registrations: []
    });
  });

  const challengeResp = await request.get('/api/claim/x/challenge?handle=replayguard');
  expect(challengeResp.status()).toBe(409);
  const challenge = await challengeResp.json();
  expect(challenge.error).toBe('CLAIM_UNAVAILABLE');
});

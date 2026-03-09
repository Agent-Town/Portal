const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const { Wallet } = require('ethers');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function hkdf(ikm, info, len = 32) {
  return Buffer.from(crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len));
}

function aesGcmEncrypt(key32, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key32, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, ct: Buffer.concat([enc, tag]) };
}

function houseAuthHeaders(houseId, method, path, body, key) {
  const ts = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('base64');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const auth = crypto.createHmac('sha256', key).update(msg).digest('base64');
  return { 'x-house-ts': ts, 'x-house-auth': auth };
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let x = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) out = `1${out}`;
  return out || '1';
}

function buildPonyInboxBundle(kroot) {
  const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const ponyInboxPub = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const ponyInboxPriv = pair.privateKey.export({ type: 'pkcs8', format: 'der' });

  const wrapKey = hkdf(kroot, 'elizatown-pony-inbox-wrap-v1', 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', wrapKey, iv);
  const enc = Buffer.concat([cipher.update(ponyInboxPriv), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ponyInboxPub,
    ponyInboxPrivWrap: {
      alg: 'AES-GCM',
      iv: iv.toString('base64'),
      ct: Buffer.concat([enc, tag]).toString('base64')
    }
  };
}

function encryptPonyMessageForTest({ fromHouseId, toHouseId, recipientPonyInboxPub, body }) {
  const recipientPub = crypto.createPublicKey({
    key: Buffer.from(recipientPonyInboxPub, 'base64'),
    format: 'der',
    type: 'spki'
  });
  const eph = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const shared = crypto.diffieHellman({ privateKey: eph.privateKey, publicKey: recipientPub });
  const key = Buffer.from(
    crypto.hkdfSync(
      'sha256',
      shared,
      Buffer.alloc(0),
      Buffer.from(`elizatown-pony-msg-v1|from=${fromHouseId || ''}|to=${toHouseId || ''}`, 'utf8'),
      32
    )
  );
  const iv = crypto.randomBytes(12);
  const aad = Buffer.from(JSON.stringify({
    v: 1,
    kind: 'msg.chat.v1',
    fromHouseId: fromHouseId || null,
    toHouseId,
    createdAt: new Date().toISOString()
  }), 'utf8');
  const plaintext = Buffer.from(JSON.stringify({ v: 1, body: String(body || '') }), 'utf8');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aad);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    alg: 'PONY_E2EE_P256_AESGCM_V1',
    epk: eph.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    iv: iv.toString('base64'),
    ct: Buffer.concat([enc, tag]).toString('base64'),
    aad: aad.toString('base64')
  };
}

async function createAgentSoloHouse(request, label, { withPonyInbox = true } = {}) {
  const sess = await request.post('/api/agent/session', { data: { agentName: `Agent-${label}` } });
  expect(sess.ok()).toBeTruthy();
  const teamCode = (await sess.json()).teamCode;

  for (let i = 0; i < 20; i += 1) {
    const x = i % 16;
    const y = Math.floor(i / 16);
    const color = (i % 7) + 1;
    const p = await request.post('/api/agent/canvas/paint', { data: { teamCode, x, y, color } });
    expect(p.ok()).toBeTruthy();
  }

  const ra = crypto.randomBytes(32);
  const commit = sha256(ra).toString('base64');

  const c = await request.post('/api/agent/house/commit', { data: { teamCode, commit } });
  expect(c.ok()).toBeTruthy();

  const nonceResp = await request.get('/api/house/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;

  const kroot = sha256(ra);
  const houseId = base58Encode(sha256(kroot));
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);
  const houseAuthKey = kauth.toString('base64');
  const ponyInbox = withPonyInbox ? buildPonyInboxBundle(kroot) : null;
  const walletAddress = `So1anaMock${label}11111111111111111111111111111`;
  const wrapSig = Buffer.alloc(64, String(label || 'A').charCodeAt(0) & 0xff);
  const wrapKey = sha256(wrapSig);
  const wrapped = aesGcmEncrypt(wrapKey, kroot);
  const keyWrap = {
    alg: 'AES-GCM',
    iv: wrapped.iv.toString('base64'),
    ct: wrapped.ct.toString('base64')
  };
  const initPayload = {
    teamCode,
    houseId,
    housePubKey: houseId,
    nonce,
    keyMode: 'ceremony',
    unlock: { kind: 'solana-wallet-signature', address: walletAddress },
    keyWrap,
    houseAuthKey
  };
  if (ponyInbox) {
    initPayload.ponyInboxPub = ponyInbox.ponyInboxPub;
    initPayload.ponyInboxPrivWrap = ponyInbox.ponyInboxPrivWrap;
  }

  const init = await request.post('/api/agent/house/init', {
    data: initPayload
  });
  expect(init.ok()).toBeTruthy();

  const resolvePath = `/api/pony/resolve?houseId=${encodeURIComponent(houseId)}`;
  await expect.poll(async () => {
    const resp = await request.get(resolvePath);
    return resp.status();
  }, { timeout: 3000 }).toBe(200);

  return {
    houseId,
    kauth,
    ponyInboxPub: ponyInbox?.ponyInboxPub || null,
    walletAddress,
    walletSigB64: wrapSig.toString('base64')
  };
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

async function completeTestBypassClaim({ request, agentId, address }) {
  const nonceResp = await request.get(`/api/claim/erc8004/nonce?agentId=${encodeURIComponent(agentId)}`);
  expect(nonceResp.ok()).toBeTruthy();
  const nonceJson = await nonceResp.json();
  const verifyResp = await request.post('/api/claim/erc8004/verify', {
    data: {
      agentId,
      nonce: nonceJson.nonce,
      signature: '0xtest-bypass-signature',
      address
    }
  });
  expect(verifyResp.ok()).toBeTruthy();
}

test('pony friends list derives from accepted + manual add; compose sends', async ({ page, request }) => {
  const houseA = await createAgentSoloHouse(request, 'A');
  const houseB = await createAgentSoloHouse(request, 'B');
  const houseC = await createAgentSoloHouse(request, 'C');

  // HouseA -> HouseB (request), then HouseB accepts. This should show up as a derived friend for B.
  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: houseB.houseId,
    fromHouseId: houseA.houseId,
    ciphertext: encryptPonyMessageForTest({
      fromHouseId: houseA.houseId,
      toHouseId: houseB.houseId,
      recipientPonyInboxPub: houseB.ponyInboxPub,
      body: 'hey B (from A)'
    })
  });
  const sendHeaders = houseAuthHeaders(houseA.houseId, 'POST', sendPath, sendBody, houseA.kauth);
  const sendResp = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(sendResp.ok()).toBeTruthy();

  const inboxPath = '/api/pony/inbox';
  const inboxHeadersB = houseAuthHeaders(houseB.houseId, 'GET', inboxPath, '', houseB.kauth);
  const inboxRespB = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseB.houseId)}`, { headers: inboxHeadersB });
  expect(inboxRespB.ok()).toBeTruthy();
  const inboxDataB = await inboxRespB.json();
  const pending = (inboxDataB.inbox || []).find((m) => m.fromHouseId === houseA.houseId && m.status === 'request');
  expect(pending).toBeTruthy();

  const acceptPath = `/api/pony/inbox/${pending.id}/accept`;
  const acceptBody = JSON.stringify({ houseId: houseB.houseId });
  const acceptHeaders = houseAuthHeaders(houseB.houseId, 'POST', acceptPath, acceptBody, houseB.kauth);
  const acceptResp = await request.post(acceptPath, {
    data: acceptBody,
    headers: { 'content-type': 'application/json', ...acceptHeaders }
  });
  expect(acceptResp.ok()).toBeTruthy();

  // Register anchor for houseC so manual add by erc8004Id can resolve.
  const sessionResp = await request.get('/api/session');
  expect(sessionResp.ok()).toBeTruthy();
  const origin = new URL(sessionResp.url()).origin;

  const anchorsNonceResp = await request.get('/api/anchors/nonce');
  expect(anchorsNonceResp.ok()).toBeTruthy();
  const nonce = (await anchorsNonceResp.json()).nonce;

  const signer = Wallet.createRandom();
  const erc8004Id = '11155111:777';
  await completeTestBypassClaim({ request, agentId: erc8004Id, address: signer.address });
  const createdAtMs = Date.now();
  const msg = buildAnchorLinkMessage({ houseId: houseC.houseId, erc8004Id, origin, nonce, createdAtMs });
  const signature = await signer.signMessage(msg);

  const register = await request.post('/api/anchors/register', {
    data: {
      houseId: houseC.houseId,
      erc8004Id,
      createdAtMs,
      nonce,
      signer: signer.address,
      signature,
      chainId: 11155111,
      origin
    }
  });
  expect(register.ok()).toBeTruthy();

  // Open inbox UI for houseB with its house-auth key in runtime memory.
  await page.addInitScript(
    ({ houseId, keyB64 }) => {
      window.__agentTownHouseAuthMemory = window.__agentTownHouseAuthMemory || Object.create(null);
      window.__agentTownHouseAuthMemory[`agentTownHouseAuth:${houseId}`] = keyB64;
    },
    { houseId: houseB.houseId, keyB64: houseB.kauth.toString('base64') }
  );

  await page.goto(`/inbox/${encodeURIComponent(houseB.houseId)}`);

  // Derived friend from accepted (houseA).
  await expect(page.locator('#friends')).toContainText(houseA.houseId);

  // Manual add by erc8004Id (houseC).
  await page.locator('#addFriendInput').fill(erc8004Id);
  await page.locator('#addFriendBtn').click();
  await expect(page.locator('#friends')).toContainText(houseC.houseId);

  // Compose to houseA by selecting friend, verify receiver prefill, send.
  await page.locator('#friendSelect').selectOption(houseA.houseId);
  await expect(page.locator('#toInput')).toHaveValue(houseA.houseId);
  await page.locator('#body').fill('hello A (from B via compose)');
  await page.locator('#sendBtn').click();
  await expect(page.locator('#sendStatus')).toContainText('Sent.');

  // Verify delivered to houseA inbox.
  const inboxHeadersA = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inboxRespA = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, { headers: inboxHeadersA });
  expect(inboxRespA.ok()).toBeTruthy();
  const inboxDataA = await inboxRespA.json();
  const received = (inboxDataA.inbox || []).find(
    (m) => m.fromHouseId === houseB.houseId && m.envelope?.ciphertext?.alg === 'PONY_E2EE_P256_AESGCM_V1'
  );
  expect(received).toBeTruthy();
  expect(received.envelope?.ciphertext?.ct).not.toBe('hello A (from B via compose)');
});

test('legacy house upgrades Pony keys from inbox and receives encrypted compose', async ({ page, request }) => {
  const sender = await createAgentSoloHouse(request, 'Sender');
  const legacyReceiver = await createAgentSoloHouse(request, 'LegacyReceiver', { withPonyInbox: false });

  await page.addInitScript(
    ({ houseId, houseAuthB64, walletAddress, walletSigB64 }) => {
      window.__agentTownHouseAuthMemory = window.__agentTownHouseAuthMemory || Object.create(null);
      const cacheKey = `agentTownHouseAuth:${houseId}`;
      window.__agentTownHouseAuthMemory[cacheKey] = houseAuthB64;
      localStorage.setItem(cacheKey, houseAuthB64);

      const bin = atob(walletSigB64);
      const sig = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) sig[i] = bin.charCodeAt(i);
      window.__PRIVY_WALLET_BRIDGE__ = {
        connectSolana: async () => ({ address: walletAddress }),
        disconnectSolana: async () => {},
        signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => walletAddress } })
      };
    },
    {
      houseId: legacyReceiver.houseId,
      houseAuthB64: legacyReceiver.kauth.toString('base64'),
      walletAddress: legacyReceiver.walletAddress,
      walletSigB64: legacyReceiver.walletSigB64
    }
  );

  await page.goto(`/inbox/${encodeURIComponent(legacyReceiver.houseId)}`);
  await page.evaluate(({ houseId, houseAuthB64, walletAddress, walletSigB64 }) => {
    window.__agentTownHouseAuthMemory = window.__agentTownHouseAuthMemory || Object.create(null);
    const cacheKey = `agentTownHouseAuth:${houseId}`;
    window.__agentTownHouseAuthMemory[cacheKey] = houseAuthB64;
    localStorage.setItem(cacheKey, houseAuthB64);

    const bin = atob(walletSigB64);
    const sig = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) sig[i] = bin.charCodeAt(i);
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: walletAddress }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => walletAddress } })
    };
  }, {
    houseId: legacyReceiver.houseId,
    houseAuthB64: legacyReceiver.kauth.toString('base64'),
    walletAddress: legacyReceiver.walletAddress,
    walletSigB64: legacyReceiver.walletSigB64
  });
  await page.reload();

  const resolvePath = `/api/pony/resolve?houseId=${encodeURIComponent(legacyReceiver.houseId)}`;
  await expect.poll(async () => {
    const resolve = await request.get(resolvePath);
    const data = await resolve.json();
    return typeof data.ponyInboxPub === 'string' && data.ponyInboxPub.length > 20;
  }).toBe(true);

  const resolved = await request.get(resolvePath);
  expect(resolved.ok()).toBeTruthy();
  const resolvedData = await resolved.json();
  expect(typeof resolvedData.ponyInboxPub).toBe('string');
  expect(resolvedData.ponyInboxPub.length).toBeGreaterThan(20);

  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: legacyReceiver.houseId,
    fromHouseId: sender.houseId,
    ciphertext: encryptPonyMessageForTest({
      fromHouseId: sender.houseId,
      toHouseId: legacyReceiver.houseId,
      recipientPonyInboxPub: resolvedData.ponyInboxPub,
      body: 'hello upgraded legacy'
    })
  });
  const sendHeaders = houseAuthHeaders(sender.houseId, 'POST', sendPath, sendBody, sender.kauth);
  const sendResp = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(sendResp.ok()).toBeTruthy();

  await expect(page.locator('#requests')).toContainText('E2EE decrypted');
  await expect(page.locator('#requests')).toContainText('hello upgraded legacy');
});

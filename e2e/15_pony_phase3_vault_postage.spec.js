const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}


function countLeadingZeroBitsHex(hexDigest) {
  let bits = 0;
  for (const ch of String(hexDigest || '').toLowerCase()) {
    const nibble = Number.parseInt(ch, 16);
    if (!Number.isFinite(nibble) || nibble < 0 || nibble > 15) return 0;
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    if ((nibble & 0b1000) === 0) bits += 1;
    if ((nibble & 0b0100) === 0) bits += 1;
    if ((nibble & 0b0010) === 0) bits += 1;
    break;
  }
  return bits;
}

function buildPowPostage(difficulty, seed = 'pow') {
  const target = Math.max(1, Math.floor(Number(difficulty) || 0));
  for (let i = 0; i < 1_000_000; i += 1) {
    const nonce = `${seed}-${i}`;
    const digest = crypto.createHash('sha256').update(`pony_pow_v1|${nonce}`, 'utf8').digest('hex');
    if (countLeadingZeroBitsHex(digest) >= target) {
      return { kind: 'pow.v1', nonce, digest, difficulty: target };
    }
  }
  throw new Error('POW_BUILD_FAILED');
}
function hkdf(ikm, info, len = 32) {
  return Buffer.from(crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len));
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

function buildPonyInboxBundle() {
  const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  return {
    ponyInboxPub: pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    ponyInboxPrivWrap: {
      alg: 'AES-GCM',
      iv: crypto.randomBytes(12).toString('base64'),
      ct: crypto.randomBytes(96).toString('base64')
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

async function createAgentSoloHouse(request, label) {
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
  const houseAuthKey = hkdf(kroot, 'elizatown-house-auth-v1', 32).toString('base64');
  const ponyInbox = buildPonyInboxBundle();

  const init = await request.post('/api/agent/house/init', {
    data: {
      teamCode,
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address: `So1anaMock${label}11111111111111111111111111111` },
      houseAuthKey,
      ponyInboxPub: ponyInbox.ponyInboxPub,
      ponyInboxPrivWrap: ponyInbox.ponyInboxPrivWrap
    }
  });
  expect(init.ok()).toBeTruthy();

  return {
    houseId,
    kauth: hkdf(kroot, 'elizatown-house-auth-v1', 32),
    ponyInboxPub: ponyInbox.ponyInboxPub
  };
}

test('pony phase3: postage policy + transport metadata + vault hash chain', async ({ request }) => {
  const houseA = await createAgentSoloHouse(request, 'A');
  const houseB = await createAgentSoloHouse(request, 'B');

  // Receiver policy requires anonymous postage.
  const policyPath = '/api/pony/policy';
  const policyBody = JSON.stringify({
    houseId: houseA.houseId,
    allowAnonymous: true,
    requirePostageAnonymous: true
  });
  const policyHeaders = houseAuthHeaders(houseA.houseId, 'POST', policyPath, policyBody, houseA.kauth);
  const setPolicy = await request.post(policyPath, {
    data: policyBody,
    headers: { 'content-type': 'application/json', ...policyHeaders }
  });
  expect(setPolicy.ok()).toBeTruthy();

  // Anonymous send without postage -> blocked.
  const anonNoPostage = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: encryptPonyMessageForTest({
        fromHouseId: '',
        toHouseId: houseA.houseId,
        recipientPonyInboxPub: houseA.ponyInboxPub,
        body: 'anon no stamp'
      })
    }
  });
  expect(anonNoPostage.status()).toBe(402);
  expect((await anonNoPostage.json()).error).toBe('POSTAGE_REQUIRED');

  // Anonymous send with postage + transport metadata -> accepted as request.
  const anonWithPostage = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: encryptPonyMessageForTest({
        fromHouseId: '',
        toHouseId: houseA.houseId,
        recipientPonyInboxPub: houseA.ponyInboxPub,
        body: 'anon stamped'
      }),
      transport: { kind: 'relay.http.v1', relayHints: ['relay://alpha', 'relay://beta'] },
      postage: buildPowPostage(10, 'n-1')
    }
  });
  expect(anonWithPostage.ok()).toBeTruthy();
  const anonWithPostageData = await anonWithPostage.json();

  // Authenticated send from B with transport hints.
  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: houseA.houseId,
    fromHouseId: houseB.houseId,
    ciphertext: encryptPonyMessageForTest({
      fromHouseId: houseB.houseId,
      toHouseId: houseA.houseId,
      recipientPonyInboxPub: houseA.ponyInboxPub,
      body: 'from B'
    }),
    transport: { kind: 'relay.http.v1', relayHints: ['relay://peer-b'] }
  });
  const sendHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, sendBody, houseB.kauth);
  const send = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(send.ok()).toBeTruthy();
  const sendData = await send.json();

  // Inbox should include transport + postage data.
  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, {
    headers: inboxHeaders
  });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();

  const stamped = inboxData.inbox.find((m) => m.id === anonWithPostageData.id);
  expect(stamped).toBeTruthy();
  expect(stamped.postage?.kind).toBe('pow.v1');
  expect(stamped.transport?.kind).toBe('relay.http.v1');
  expect(stamped.transport?.relayHints || []).toContain('relay://alpha');

  const fromB = inboxData.inbox.find((m) => m.id === sendData.id);
  expect(fromB).toBeTruthy();
  expect(fromB.fromHouseId).toBe(houseB.houseId);
  expect(fromB.transport?.relayHints || []).toContain('relay://peer-b');

  // House vault append + hash chain.
  const appendPath = '/api/pony/vault/append';
  const append1Body = JSON.stringify({
    houseId: houseA.houseId,
    ciphertext: { alg: 'AES-GCM', iv: 'iv-1', ct: 'ct-1' },
    refs: ['ipfs://cid-one'],
    postage: { kind: 'receipt.v1', receipts: ['rcpt-1'] }
  });
  const append1Headers = houseAuthHeaders(houseA.houseId, 'POST', appendPath, append1Body, houseA.kauth);
  const append1 = await request.post(appendPath, {
    data: append1Body,
    headers: { 'content-type': 'application/json', ...append1Headers }
  });
  expect(append1.ok()).toBeTruthy();
  const append1Data = await append1.json();

  const append2Body = JSON.stringify({
    houseId: houseA.houseId,
    ciphertext: { alg: 'AES-GCM', iv: 'iv-2', ct: 'ct-2' },
    refs: ['ipfs://cid-two']
  });
  const append2Headers = houseAuthHeaders(houseA.houseId, 'POST', appendPath, append2Body, houseA.kauth);
  const append2 = await request.post(appendPath, {
    data: append2Body,
    headers: { 'content-type': 'application/json', ...append2Headers }
  });
  expect(append2.ok()).toBeTruthy();
  const append2Data = await append2.json();
  expect(append2Data.prevHash).toBe(append1Data.hash);

  const vaultPath = '/api/pony/vault';
  const vaultHeaders = houseAuthHeaders(houseA.houseId, 'GET', vaultPath, '', houseA.kauth);
  const vault = await request.get(`${vaultPath}?houseId=${encodeURIComponent(houseA.houseId)}&limit=10`, {
    headers: vaultHeaders
  });
  expect(vault.ok()).toBeTruthy();
  const vaultData = await vault.json();

  expect(vaultData.items.length).toBe(2);
  expect(vaultData.items[0].hash).toBe(append1Data.hash);
  expect(vaultData.items[1].hash).toBe(append2Data.hash);
  expect(vaultData.items[1].prevHash).toBe(append1Data.hash);
  expect(vaultData.head).toBe(append2Data.hash);
});

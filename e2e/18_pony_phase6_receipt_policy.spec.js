const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

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


function countLeadingZeroBits(hex) {
  let bits = 0;
  for (const ch of String(hex || '')) {
    const nibble = Number.parseInt(ch, 16);
    if (Number.isNaN(nibble)) break;
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    if (nibble < 2) bits += 3;
    else if (nibble < 4) bits += 2;
    else if (nibble < 8) bits += 1;
    break;
  }
  return bits;
}

function buildPowPostage({ difficulty, fromHouseId = null, toHouseId }) {
  for (let i = 0; i < 2_000_000; i += 1) {
    const nonce = `pow-${difficulty}-${i}`;
    const digest = crypto.createHash('sha256').update(JSON.stringify({
      v: 1,
      nonce,
      fromHouseId: fromHouseId || null,
      toHouseId: toHouseId || null
    }), 'utf8').digest('hex');
    if (countLeadingZeroBits(digest) >= difficulty) {
      return { kind: 'pow.v1', nonce, digest, difficulty };
    }
  }
  throw new Error('FAILED_TO_BUILD_POW_POSTAGE');
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

test('pony phase6: receipt-required anonymous policy + receipt house binding', async ({ request }) => {
  const houseA = await createAgentSoloHouse(request, 'Phase6A');
  const houseB = await createAgentSoloHouse(request, 'Phase6B');
  const houseC = await createAgentSoloHouse(request, 'Phase6C');

  // Receiver policy now requires anonymous senders to present receipt postage.
  const policyPath = '/api/pony/policy';
  const policyBody = JSON.stringify({
    houseId: houseA.houseId,
    allowAnonymous: true,
    requirePostageAnonymous: true,
    requireReceiptAnonymous: true
  });
  const policyHeaders = houseAuthHeaders(houseA.houseId, 'POST', policyPath, policyBody, houseA.kauth);
  const setPolicy = await request.post(policyPath, {
    data: policyBody,
    headers: { 'content-type': 'application/json', ...policyHeaders }
  });
  expect(setPolicy.ok()).toBeTruthy();

  const policyGetPath = '/api/pony/policy';
  const policyGetHeaders = houseAuthHeaders(houseA.houseId, 'GET', policyGetPath, '', houseA.kauth);
  const gotPolicy = await request.get(`${policyGetPath}?houseId=${encodeURIComponent(houseA.houseId)}`, {
    headers: policyGetHeaders
  });
  expect(gotPolicy.ok()).toBeTruthy();
  expect((await gotPolicy.json()).policy.requireReceiptAnonymous).toBe(true);

  // Anonymous without postage remains blocked as before.
  const anonNone = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: encryptPonyMessageForTest({
        fromHouseId: '',
        toHouseId: houseA.houseId,
        recipientPonyInboxPub: houseA.ponyInboxPub,
        body: 'anon-none'
      })
    }
  });
  expect(anonNone.status()).toBe(402);
  expect((await anonNone.json()).error).toBe('POSTAGE_REQUIRED');

  // Anonymous with PoW postage now fails because receipts are required.
  const anonPow = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: encryptPonyMessageForTest({
        fromHouseId: '',
        toHouseId: houseA.houseId,
        recipientPonyInboxPub: houseA.ponyInboxPub,
        body: 'anon-pow'
      }),
      postage: buildPowPostage({ difficulty: 9, toHouseId: houseA.houseId })
    }
  });
  expect(anonPow.status()).toBe(402);
  expect((await anonPow.json()).error).toBe('POSTAGE_RECEIPT_REQUIRED');

  // Seed a valid dispatch receipt for houseA by sending an authenticated message from houseB.
  const sendPath = '/api/pony/send';
  const seedBody = JSON.stringify({
    toHouseId: houseA.houseId,
    fromHouseId: houseB.houseId,
    ciphertext: encryptPonyMessageForTest({
      fromHouseId: houseB.houseId,
      toHouseId: houseA.houseId,
      recipientPonyInboxPub: houseA.ponyInboxPub,
      body: 'seed-receipt-a'
    })
  });
  const seedHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, seedBody, houseB.kauth);
  const seedSend = await request.post(sendPath, {
    data: seedBody,
    headers: { 'content-type': 'application/json', ...seedHeaders }
  });
  expect(seedSend.ok()).toBeTruthy();
  const seedData = await seedSend.json();
  expect(seedData.dispatch?.receiptId).toMatch(/^dr_/);

  // Anonymous send succeeds when receipt postage references a dispatch receipt for target houseA.
  const anonReceipt = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: encryptPonyMessageForTest({
        fromHouseId: '',
        toHouseId: houseA.houseId,
        recipientPonyInboxPub: houseA.ponyInboxPub,
        body: 'anon-receipt-ok'
      }),
      postage: { kind: 'receipt.v1', receipts: [seedData.dispatch.receiptId] }
    }
  });
  expect(anonReceipt.ok()).toBeTruthy();
  const anonReceiptData = await anonReceipt.json();

  // Create a receipt for a different target houseC.
  const otherSeedBody = JSON.stringify({
    toHouseId: houseC.houseId,
    fromHouseId: houseB.houseId,
    ciphertext: encryptPonyMessageForTest({
      fromHouseId: houseB.houseId,
      toHouseId: houseC.houseId,
      recipientPonyInboxPub: houseC.ponyInboxPub,
      body: 'seed-receipt-c'
    })
  });
  const otherSeedHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, otherSeedBody, houseB.kauth);
  const otherSeedSend = await request.post(sendPath, {
    data: otherSeedBody,
    headers: { 'content-type': 'application/json', ...otherSeedHeaders }
  });
  expect(otherSeedSend.ok()).toBeTruthy();
  const otherSeedData = await otherSeedSend.json();

  // Reusing houseC receipt for houseA is rejected with explicit mismatch metadata.
  const wrongHouseReceipt = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: encryptPonyMessageForTest({
        fromHouseId: '',
        toHouseId: houseA.houseId,
        recipientPonyInboxPub: houseA.ponyInboxPub,
        body: 'anon-receipt-wrong-house'
      }),
      postage: { kind: 'receipt.v1', receipts: [otherSeedData.dispatch.receiptId] }
    }
  });
  expect(wrongHouseReceipt.status()).toBe(400);
  const wrongHouseData = await wrongHouseReceipt.json();
  expect(wrongHouseData.error).toBe('POSTAGE_RECEIPT_HOUSE_MISMATCH');
  expect(wrongHouseData.receiptId).toBe(otherSeedData.dispatch.receiptId);
  expect(wrongHouseData.expectedToHouseId).toBe(houseA.houseId);
  expect(wrongHouseData.receiptToHouseId).toBe(houseC.houseId);

  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, {
    headers: inboxHeaders
  });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();
  const anonDelivered = inboxData.inbox.find((m) => m.id === anonReceiptData.id);
  expect(anonDelivered).toBeTruthy();
  expect(anonDelivered.fromHouseId).toBeNull();
});

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
  const reveal = ra.toString('base64');

  const c = await request.post('/api/agent/house/commit', { data: { teamCode, commit } });
  expect(c.ok()).toBeTruthy();
  const r = await request.post('/api/agent/house/reveal', { data: { teamCode, reveal } });
  expect(r.ok()).toBeTruthy();

  const nonceResp = await request.get('/api/house/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;

  const kroot = sha256(ra);
  const houseId = base58Encode(sha256(kroot));
  const houseAuthKey = hkdf(kroot, 'elizatown-house-auth-v1', 32).toString('base64');

  const init = await request.post('/api/agent/house/init', {
    data: {
      teamCode,
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address: `So1anaMock${label}11111111111111111111111111111` },
      houseAuthKey
    }
  });
  expect(init.ok()).toBeTruthy();

  return {
    houseId,
    kauth: hkdf(kroot, 'elizatown-house-auth-v1', 32)
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
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anon-none' }
    }
  });
  expect(anonNone.status()).toBe(402);
  expect((await anonNone.json()).error).toBe('POSTAGE_REQUIRED');

  // Anonymous with PoW postage now fails because receipts are required.
  const anonPow = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anon-pow' },
      postage: { kind: 'pow.v1', nonce: 'pow-1', digest: '00abc123', difficulty: 9 }
    }
  });
  expect(anonPow.status()).toBe(402);
  expect((await anonPow.json()).error).toBe('POSTAGE_RECEIPT_REQUIRED');

  // Seed a valid dispatch receipt for houseA by sending an authenticated message from houseB.
  const sendPath = '/api/pony/send';
  const seedBody = JSON.stringify({
    toHouseId: houseA.houseId,
    fromHouseId: houseB.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'seed-receipt-a' }
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
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anon-receipt-ok' },
      postage: { kind: 'receipt.v1', receipts: [seedData.dispatch.receiptId] }
    }
  });
  expect(anonReceipt.ok()).toBeTruthy();

  // Create a receipt for a different target houseC.
  const otherSeedBody = JSON.stringify({
    toHouseId: houseC.houseId,
    fromHouseId: houseB.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'seed-receipt-c' }
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
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anon-receipt-wrong-house' },
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
  const anonDelivered = inboxData.inbox.find((m) => m.envelope?.ciphertext?.ct === 'anon-receipt-ok');
  expect(anonDelivered).toBeTruthy();
  expect(anonDelivered.fromHouseId).toBeNull();
});

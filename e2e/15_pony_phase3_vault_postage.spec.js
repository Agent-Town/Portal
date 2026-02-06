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
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anon no stamp' }
    }
  });
  expect(anonNoPostage.status()).toBe(402);
  expect((await anonNoPostage.json()).error).toBe('POSTAGE_REQUIRED');

  // Anonymous send with postage + transport metadata -> accepted as request.
  const anonWithPostage = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anon stamped' },
      transport: { kind: 'relay.http.v1', relayHints: ['relay://alpha', 'relay://beta'] },
      postage: { kind: 'pow.v1', nonce: 'n-1', digest: '00deadbeef', difficulty: 10 }
    }
  });
  expect(anonWithPostage.ok()).toBeTruthy();

  // Authenticated send from B with transport hints.
  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: houseA.houseId,
    fromHouseId: houseB.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'from B' },
    transport: { kind: 'relay.http.v1', relayHints: ['relay://peer-b'] }
  });
  const sendHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, sendBody, houseB.kauth);
  const send = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(send.ok()).toBeTruthy();

  // Inbox should include transport + postage data.
  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, {
    headers: inboxHeaders
  });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();

  const stamped = inboxData.inbox.find((m) => m.envelope?.ciphertext?.ct === 'anon stamped');
  expect(stamped).toBeTruthy();
  expect(stamped.postage?.kind).toBe('pow.v1');
  expect(stamped.transport?.kind).toBe('relay.http.v1');
  expect(stamped.transport?.relayHints || []).toContain('relay://alpha');

  const fromB = inboxData.inbox.find((m) => m.envelope?.ciphertext?.ct === 'from B');
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

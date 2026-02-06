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

test('pony phase4: transport abstraction + storage backend + postage verification hooks', async ({ request }) => {
  const houseA = await createAgentSoloHouse(request, 'Phase4A');

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

  // Concrete postage verification hook: anonymous PoW must meet minimum difficulty threshold.
  const weakPostage = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'weak pow' },
      postage: { kind: 'pow.v1', nonce: 'n-low', digest: '00abc123', difficulty: 2 }
    }
  });
  expect(weakPostage.status()).toBe(402);
  const weakBody = await weakPostage.json();
  expect(weakBody.error).toBe('POSTAGE_POW_DIFFICULTY_TOO_LOW');
  expect(weakBody.requiredDifficulty).toBe(8);
  expect(weakBody.actualDifficulty).toBe(2);

  // Unknown transport kinds should still dispatch through fallback transport adapter.
  const customTransport = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'phase4 custom transport' },
      transport: { kind: 'relay.mesh.v1', relayHints: ['mesh://west'] },
      postage: { kind: 'pow.v1', nonce: 'n-ok', digest: '00deadbeef', difficulty: 8 }
    }
  });
  expect(customTransport.ok()).toBeTruthy();

  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, {
    headers: inboxHeaders
  });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();
  const delivered = inboxData.inbox.find((m) => m.envelope?.ciphertext?.ct === 'phase4 custom transport');
  expect(delivered).toBeTruthy();
  expect(delivered.transport?.kind).toBe('relay.mesh.v1');
  expect(delivered.transport?.relayHints || []).toContain('mesh://west');

  // House vault endpoints still expose the same API surface via the backend interface.
  const appendPath = `/api/house/${houseA.houseId}/append`;
  const appendBody = JSON.stringify({
    author: 'phase4-agent',
    ciphertext: { alg: 'AES-GCM', iv: 'iv-phase4', ct: 'phase4-house-entry' }
  });
  const appendHeaders = houseAuthHeaders(houseA.houseId, 'POST', appendPath, appendBody, houseA.kauth);
  const appendResp = await request.post(appendPath, {
    data: appendBody,
    headers: { 'content-type': 'application/json', ...appendHeaders }
  });
  expect(appendResp.ok()).toBeTruthy();

  const logPath = `/api/house/${houseA.houseId}/log`;
  const logHeaders = houseAuthHeaders(houseA.houseId, 'GET', logPath, '', houseA.kauth);
  const logResp = await request.get(logPath, { headers: logHeaders });
  expect(logResp.ok()).toBeTruthy();
  const logData = await logResp.json();
  const appended = logData.entries.find((entry) => entry?.author === 'phase4-agent');
  expect(appended).toBeTruthy();
  expect(appended.ciphertext?.ct).toBe('phase4-house-entry');
});

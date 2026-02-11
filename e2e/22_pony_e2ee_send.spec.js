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

function makePonyInboxKeyBundle() {
  const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const ponyInboxPub = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const ponyInboxPriv = pair.privateKey.export({ type: 'pkcs8', format: 'der' });

  return {
    ponyInboxPub,
    ponyInboxPrivWrap: {
      alg: 'AES-GCM',
      iv: crypto.randomBytes(12).toString('base64'),
      // In phase-7 tests we only validate envelope shape on server side; no unwrap/decrypt yet.
      ct: ponyInboxPriv.toString('base64')
    }
  };
}

async function createAgentSoloHouse(request, label, opts = {}) {
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
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);
  const houseAuthKey = kauth.toString('base64');

  const body = {
    teamCode,
    houseId,
    housePubKey: houseId,
    nonce,
    keyMode: 'ceremony',
    unlock: { kind: 'solana-wallet-signature', address: `So1anaMock${label}11111111111111111111111111111` },
    houseAuthKey,
    ponyInboxPub: opts.ponyInboxPub,
    ponyInboxPrivWrap: opts.ponyInboxPrivWrap
  };

  const init = await request.post('/api/agent/house/init', { data: body });
  expect(init.ok()).toBeTruthy();

  return { houseId, kauth };
}

test('inbox compose sends E2EE envelope when receiver pony key exists', async ({ page, request }) => {
  const houseA = await createAgentSoloHouse(request, 'A', makePonyInboxKeyBundle());
  const houseB = await createAgentSoloHouse(request, 'B', makePonyInboxKeyBundle());

  await page.addInitScript(
    ({ houseId, keyB64 }) => {
      sessionStorage.setItem(`agentTownHouseAuth:${houseId}`, keyB64);
    },
    { houseId: houseB.houseId, keyB64: houseB.kauth.toString('base64') }
  );

  await page.goto(`/inbox/${encodeURIComponent(houseB.houseId)}`);
  await page.locator('#toInput').fill(houseA.houseId);
  await page.locator('#body').fill('top secret pony payload');
  await page.locator('#sendBtn').click();
  await expect(page.locator('#sendStatus')).toContainText('Sent.');

  const inboxPath = '/api/pony/inbox';
  const inboxHeadersA = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inboxRespA = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, { headers: inboxHeadersA });
  expect(inboxRespA.ok()).toBeTruthy();
  const inboxDataA = await inboxRespA.json();

  const received = (inboxDataA.inbox || []).find((m) => m.fromHouseId === houseB.houseId);
  expect(received).toBeTruthy();
  expect(received.envelope?.ciphertext?.alg).toBe('PONY_E2EE_P256_AESGCM_V1');
  expect(typeof received.envelope?.ciphertext?.epk).toBe('string');
  expect(typeof received.envelope?.ciphertext?.aad).toBe('string');
  expect(received.envelope?.ciphertext?.ct).not.toBe('top secret pony payload');
});

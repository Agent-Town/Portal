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
  return {
    ponyInboxPub: crypto.randomBytes(91).toString('base64'),
    ponyInboxPrivWrap: {
      alg: 'AES-GCM',
      iv: crypto.randomBytes(12).toString('base64'),
      ct: crypto.randomBytes(96).toString('base64')
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

  const c = await request.post('/api/agent/house/commit', { data: { teamCode, commit } });
  expect(c.ok()).toBeTruthy();

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
    houseAuthKey
  };

  if (opts?.ponyInboxPub) body.ponyInboxPub = opts.ponyInboxPub;
  if (opts?.ponyInboxPrivWrap) body.ponyInboxPrivWrap = opts.ponyInboxPrivWrap;

  const init = await request.post('/api/agent/house/init', { data: body });
  expect(init.ok()).toBeTruthy();

  return { houseId, kauth };
}

test('pony resolve/inbox include key metadata when set during house init', async ({ request }) => {
  const pony = makePonyInboxKeyBundle();
  const house = await createAgentSoloHouse(request, 'A', pony);

  const resolve = await request.get(`/api/pony/resolve?houseId=${encodeURIComponent(house.houseId)}`);
  expect(resolve.ok()).toBeTruthy();
  const resolveData = await resolve.json();
  expect(resolveData.houseId).toBe(house.houseId);
  expect(resolveData.ponyInboxPub).toBe(pony.ponyInboxPub);
  expect(resolveData.ponyInboxKeyVersion).toBe(1);

  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(house.houseId, 'GET', inboxPath, '', house.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(house.houseId)}`, { headers: inboxHeaders });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();
  expect(inboxData.ponyInboxKeyVersion).toBe(1);
  expect(inboxData.ponyInboxPrivWrap).toEqual(pony.ponyInboxPrivWrap);
});

test('pony key register allows adding keys to an existing house via house-auth', async ({ request }) => {
  const house = await createAgentSoloHouse(request, 'B');

  const resolveBefore = await request.get(`/api/pony/resolve?houseId=${encodeURIComponent(house.houseId)}`);
  expect(resolveBefore.ok()).toBeTruthy();
  const resolveBeforeData = await resolveBefore.json();
  expect(resolveBeforeData.ponyInboxPub).toBeNull();
  expect(resolveBeforeData.ponyInboxKeyVersion).toBeNull();

  const pony = makePonyInboxKeyBundle();
  const registerPath = '/api/pony/keys/register';
  const registerBody = JSON.stringify({
    houseId: house.houseId,
    ponyInboxPub: pony.ponyInboxPub,
    ponyInboxPrivWrap: pony.ponyInboxPrivWrap
  });

  const unauth = await request.post(registerPath, {
    data: registerBody,
    headers: { 'content-type': 'application/json' }
  });
  expect(unauth.status()).toBe(401);

  const registerHeaders = houseAuthHeaders(house.houseId, 'POST', registerPath, registerBody, house.kauth);
  const register = await request.post(registerPath, {
    data: registerBody,
    headers: { 'content-type': 'application/json', ...registerHeaders }
  });
  expect(register.ok()).toBeTruthy();
  const registerData = await register.json();
  expect(registerData.houseId).toBe(house.houseId);
  expect(registerData.ponyInboxPub).toBe(pony.ponyInboxPub);
  expect(registerData.ponyInboxKeyVersion).toBe(1);

  const resolveAfter = await request.get(`/api/pony/resolve?houseId=${encodeURIComponent(house.houseId)}`);
  expect(resolveAfter.ok()).toBeTruthy();
  const resolveAfterData = await resolveAfter.json();
  expect(resolveAfterData.ponyInboxPub).toBe(pony.ponyInboxPub);
  expect(resolveAfterData.ponyInboxKeyVersion).toBe(1);

  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(house.houseId, 'GET', inboxPath, '', house.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(house.houseId)}`, { headers: inboxHeaders });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();
  expect(inboxData.ponyInboxPrivWrap).toEqual(pony.ponyInboxPrivWrap);
  expect(inboxData.ponyInboxKeyVersion).toBe(1);
});

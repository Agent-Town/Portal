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

async function createAgentSoloHouse(request, label, { withPonyInbox = false } = {}) {
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

  const payload = {
    teamCode,
    houseId,
    housePubKey: houseId,
    nonce,
    keyMode: 'ceremony',
    unlock: { kind: 'solana-wallet-signature', address: `So1anaMock${label}11111111111111111111111111111` },
    houseAuthKey
  };

  if (withPonyInbox) {
    const ponyInbox = buildPonyInboxBundle(kroot);
    payload.ponyInboxPub = ponyInbox.ponyInboxPub;
    payload.ponyInboxPrivWrap = ponyInbox.ponyInboxPrivWrap;
  }

  const init = await request.post('/api/agent/house/init', { data: payload });
  expect(init.ok()).toBeTruthy();

  return { houseId, kauth };
}

test('phase7 cutover: plaintext rejection default + policy override + payload limits', async ({ request }) => {
  const strictHouse = await createAgentSoloHouse(request, 'Strict', { withPonyInbox: true });
  const legacyHouse = await createAgentSoloHouse(request, 'Legacy', { withPonyInbox: false });

  const policyPath = '/api/pony/policy';
  const strictPolicyHeaders = houseAuthHeaders(strictHouse.houseId, 'GET', policyPath, '', strictHouse.kauth);
  const strictPolicyGet = await request.get(`${policyPath}?houseId=${encodeURIComponent(strictHouse.houseId)}`, {
    headers: strictPolicyHeaders
  });
  expect(strictPolicyGet.ok()).toBeTruthy();
  const strictPolicy = await strictPolicyGet.json();
  expect(strictPolicy.policy.allowLegacyPlaintext).toBe(false);

  const legacyPolicyHeaders = houseAuthHeaders(legacyHouse.houseId, 'GET', policyPath, '', legacyHouse.kauth);
  const legacyPolicyGet = await request.get(`${policyPath}?houseId=${encodeURIComponent(legacyHouse.houseId)}`, {
    headers: legacyPolicyHeaders
  });
  expect(legacyPolicyGet.ok()).toBeTruthy();
  const legacyPolicy = await legacyPolicyGet.json();
  expect(legacyPolicy.policy.allowLegacyPlaintext).toBe(true);

  const tightenPolicyBody = JSON.stringify({ houseId: strictHouse.houseId, autoAcceptAllowlist: true });
  const tightenPolicyHeaders = houseAuthHeaders(strictHouse.houseId, 'POST', policyPath, tightenPolicyBody, strictHouse.kauth);
  const tightenPolicy = await request.post(policyPath, {
    data: tightenPolicyBody,
    headers: { 'content-type': 'application/json', ...tightenPolicyHeaders }
  });
  expect(tightenPolicy.ok()).toBeTruthy();
  expect((await tightenPolicy.json()).policy.allowLegacyPlaintext).toBe(false);

  const sendPath = '/api/pony/send';
  const rejectedPlain = await request.post(sendPath, {
    data: {
      toHouseId: strictHouse.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'plaintext should be rejected' }
    }
  });
  expect(rejectedPlain.status()).toBe(400);
  expect((await rejectedPlain.json()).error).toBe('PONY_CIPHERTEXT_REQUIRED');

  const setPolicyBody = JSON.stringify({ houseId: strictHouse.houseId, allowLegacyPlaintext: true });
  const setPolicyHeaders = houseAuthHeaders(strictHouse.houseId, 'POST', policyPath, setPolicyBody, strictHouse.kauth);
  const setPolicy = await request.post(policyPath, {
    data: setPolicyBody,
    headers: { 'content-type': 'application/json', ...setPolicyHeaders }
  });
  expect(setPolicy.ok()).toBeTruthy();
  expect((await setPolicy.json()).policy.allowLegacyPlaintext).toBe(true);

  const allowedPlain = await request.post(sendPath, {
    data: {
      toHouseId: strictHouse.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'plaintext allowed temporarily by policy' }
    }
  });
  expect(allowedPlain.ok()).toBeTruthy();

  const oversized = await request.post(sendPath, {
    data: {
      toHouseId: strictHouse.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'x'.repeat(5000) }
    }
  });
  expect(oversized.status()).toBe(400);
  expect((await oversized.json()).error).toBe('PONY_CIPHERTEXT_TOO_LARGE');
});

test('policy patch keeps allowLegacyPlaintext disabled for key-enabled houses', async ({ request }) => {
  const strictHouse = await createAgentSoloHouse(request, 'StrictPolicyMerge', { withPonyInbox: true });

  const policyPath = '/api/pony/policy';
  const getHeaders = houseAuthHeaders(strictHouse.houseId, 'GET', policyPath, '', strictHouse.kauth);
  let getPolicy = await request.get(`${policyPath}?houseId=${encodeURIComponent(strictHouse.houseId)}`, {
    headers: getHeaders
  });
  expect(getPolicy.ok()).toBeTruthy();
  expect((await getPolicy.json()).policy.allowLegacyPlaintext).toBe(false);

  const patchBody = JSON.stringify({ houseId: strictHouse.houseId, requirePostageAnonymous: true });
  const patchHeaders = houseAuthHeaders(strictHouse.houseId, 'POST', policyPath, patchBody, strictHouse.kauth);
  const patchPolicy = await request.post(policyPath, {
    data: patchBody,
    headers: { 'content-type': 'application/json', ...patchHeaders }
  });
  expect(patchPolicy.ok()).toBeTruthy();
  expect((await patchPolicy.json()).policy.allowLegacyPlaintext).toBe(false);

  getPolicy = await request.get(`${policyPath}?houseId=${encodeURIComponent(strictHouse.houseId)}`, {
    headers: getHeaders
  });
  expect(getPolicy.ok()).toBeTruthy();
  expect((await getPolicy.json()).policy.allowLegacyPlaintext).toBe(false);

  const sendPlain = await request.post('/api/pony/send', {
    data: {
      toHouseId: strictHouse.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'plaintext should remain blocked' }
    }
  });
  expect(sendPlain.status()).toBe(400);
  expect((await sendPlain.json()).error).toBe('PONY_CIPHERTEXT_REQUIRED');
});

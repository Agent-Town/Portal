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

function houseAuthHeaders(houseId, method, path, body, key) {
  const ts = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('base64');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const auth = crypto.createHmac('sha256', key).update(msg).digest('base64');
  return { 'x-house-ts': ts, 'x-house-auth': auth };
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
      ct: ponyInboxPriv.toString('base64')
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
  const commitResp = await request.post('/api/agent/house/commit', { data: { teamCode, commit } });
  expect(commitResp.ok()).toBeTruthy();

  const nonceResp = await request.get('/api/house/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;

  const kroot = sha256(ra);
  const houseId = base58Encode(sha256(kroot));
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);
  const houseAuthKey = kauth.toString('base64');
  const ponyInbox = makePonyInboxKeyBundle();

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

  return { houseId, kauth, ponyInboxPub: ponyInbox.ponyInboxPub };
}

test('inbox auto-refreshes without reload and stores encrypted ciphertext', async ({ page, request }) => {
  const receiver = await createAgentSoloHouse(request, 'Receiver');
  const sender = await createAgentSoloHouse(request, 'Sender');
  const body = 'auto refresh ciphertext check';

  await page.addInitScript(
    ({ houseId, keyB64 }) => {
      sessionStorage.setItem(`agentTownHouseAuth:${houseId}`, keyB64);
    },
    { houseId: receiver.houseId, keyB64: receiver.kauth.toString('base64') }
  );

  await page.goto(`/inbox/${encodeURIComponent(receiver.houseId)}`);
  await expect(page.locator('#requests')).toContainText('No requests.');

  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: receiver.houseId,
    fromHouseId: sender.houseId,
    ciphertext: encryptPonyMessageForTest({
      fromHouseId: sender.houseId,
      toHouseId: receiver.houseId,
      recipientPonyInboxPub: receiver.ponyInboxPub,
      body
    })
  });
  const sendHeaders = houseAuthHeaders(sender.houseId, 'POST', sendPath, sendBody, sender.kauth);
  const sendResp = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(sendResp.ok()).toBeTruthy();

  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(receiver.houseId, 'GET', inboxPath, '', receiver.kauth);
  const inboxResp = await request.get(`${inboxPath}?houseId=${encodeURIComponent(receiver.houseId)}`, {
    headers: inboxHeaders
  });
  expect(inboxResp.ok()).toBeTruthy();
  const inboxData = await inboxResp.json();
  const delivered = (inboxData.inbox || []).find((m) => m.fromHouseId === sender.houseId);
  expect(delivered).toBeTruthy();
  expect(delivered.envelope?.ciphertext?.alg).toBe('PONY_E2EE_P256_AESGCM_V1');
  expect(delivered.envelope?.ciphertext?.ct).not.toBe(body);

  // No manual page reload: the background poll should pull this in.
  await expect(page.locator('#requests')).toContainText(sender.houseId, { timeout: 10000 });
});

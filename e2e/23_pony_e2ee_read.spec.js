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
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);
  const houseAuthKey = kauth.toString('base64');
  const ponyInbox = buildPonyInboxBundle(kroot);

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

  return { houseId, kroot, kauth };
}

test('inbox decrypts E2EE payloads and labels legacy plaintext', async ({ page, request }) => {
  const houseA = await createAgentSoloHouse(request, 'A');
  const houseB = await createAgentSoloHouse(request, 'B');

  const legacySend = await request.post('/api/pony/send', {
    data: {
      toHouseId: houseA.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'legacy plaintext migration note' }
    }
  });
  expect(legacySend.ok()).toBeTruthy();

  await page.addInitScript(
    ({ houseId, houseAuthB64 }) => {
      sessionStorage.setItem(`agentTownHouseAuth:${houseId}`, houseAuthB64);
    },
    {
      houseId: houseB.houseId,
      houseAuthB64: houseB.kauth.toString('base64')
    }
  );

  await page.goto(`/inbox/${encodeURIComponent(houseB.houseId)}`);
  await page.locator('#toInput').fill(houseA.houseId);
  await page.locator('#body').fill('pony e2ee read body');
  await page.locator('#sendBtn').click();
  await expect(page.locator('#sendStatus')).toContainText('Sent.');

  await page.evaluate(
    ({ houseId, houseAuthB64, krootB64 }) => {
      sessionStorage.setItem(`agentTownHouseAuth:${houseId}`, houseAuthB64);
      sessionStorage.setItem(`agentTownHouseKroot:${houseId}`, krootB64);
    },
    {
      houseId: houseA.houseId,
      houseAuthB64: houseA.kauth.toString('base64'),
      krootB64: houseA.kroot.toString('base64')
    }
  );

  await page.goto(`/inbox/${encodeURIComponent(houseA.houseId)}`);

  await expect(page.locator('#requests')).toContainText('E2EE decrypted');
  await expect(page.locator('#requests')).toContainText('pony e2ee read body');
  await expect(page.locator('#requests')).toContainText('Legacy plaintext');
  await expect(page.locator('#requests')).toContainText('legacy plaintext migration note');
});

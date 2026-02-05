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
  return crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len);
}

function houseAuthHeaders(houseId, method, path, body, key) {
  const ts = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('base64');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const auth = crypto.createHmac('sha256', key).update(msg).digest('base64');
  return { 'x-house-ts': ts, 'x-house-auth': auth };
}

function base58Encode(buf) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  if (!buf || !buf.length) return '';
  let x = BigInt('0x' + buf.toString('hex'));
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  for (let i = 0; i < buf.length && buf[i] === 0; i++) out = '1' + out;
  return out || '1';
}

function aesGcmEncrypt(key32, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key32, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, ct: Buffer.concat([ct, tag]) };
}

test('agent solo can create house, share, and upload public media', async ({ request }) => {
  const sessionResp = await request.post('/api/agent/session', { data: { agentName: 'SoloClaw' } });
  expect(sessionResp.ok()).toBeTruthy();
  const session = await sessionResp.json();
  expect(session.ok).toBeTruthy();
  const teamCode = session.teamCode;
  expect(teamCode).toBeTruthy();

  // Paint 20 pixels
  for (let i = 0; i < 20; i++) {
    const x = i % 16;
    const y = Math.floor(i / 16);
    const color = (i % 7) + 1;
    const paint = await request.post('/api/agent/canvas/paint', {
      data: { teamCode, x, y, color }
    });
    expect(paint.ok()).toBeTruthy();
  }

  // Agent entropy
  const ra = crypto.randomBytes(32);
  const raB64 = ra.toString('base64');
  const raCommit = sha256(ra).toString('base64');
  await request.post('/api/agent/house/commit', { data: { teamCode, commit: raCommit } });
  await request.post('/api/agent/house/reveal', { data: { teamCode, reveal: raB64 } });

  const kroot = sha256(ra);
  const houseId = base58Encode(sha256(kroot));
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);
  const houseAuthKey = Buffer.from(kauth).toString('base64');

  // Wrap K_root with a mock wallet signature
  const sig = Buffer.alloc(64, 7);
  const wrapKey = sha256(sig);
  const wrapped = aesGcmEncrypt(wrapKey, kroot);
  const keyWrap = {
    alg: 'AES-GCM',
    iv: wrapped.iv.toString('base64'),
    ct: wrapped.ct.toString('base64')
  };

  const nonceResp = await request.get('/api/house/nonce');
  const nonceJson = await nonceResp.json();
  const nonce = nonceJson.nonce;

  const initBody = JSON.stringify({
    teamCode,
    houseId,
    housePubKey: houseId,
    nonce,
    keyMode: 'ceremony',
    unlock: { kind: 'solana-wallet-signature', address: 'So1anaMockSolo11111111111111111111111111' },
    keyWrap,
    houseAuthKey
  });
  const initResp = await request.post('/api/agent/house/init', {
    data: initBody,
    headers: { 'content-type': 'application/json' }
  });
  expect(initResp.ok()).toBeTruthy();
  const initJson = await initResp.json();
  expect(initJson.ok).toBeTruthy();
  expect(initJson.houseId).toBe(houseId);

  // Create share (house-auth)
  const sharePath = `/api/house/${houseId}/share`;
  const shareHeaders = houseAuthHeaders(houseId, 'POST', sharePath, '', kauth);
  const shareResp = await request.post(sharePath, { data: '', headers: shareHeaders });
  expect(shareResp.ok()).toBeTruthy();
  const share = await shareResp.json();
  expect(share.ok).toBeTruthy();
  expect(share.shareId).toBeTruthy();

  // Use canvas image as public media
  const imgResp = await request.get(`/api/agent/canvas/image?teamCode=${encodeURIComponent(teamCode)}`);
  expect(imgResp.ok()).toBeTruthy();
  const img = await imgResp.json();
  expect(img.ok).toBeTruthy();
  expect(img.image.startsWith('data:image/png;base64,')).toBeTruthy();

  const mediaBody = JSON.stringify({ image: img.image, prompt: 'solo agent banner' });
  const mediaPath = `/api/house/${houseId}/public-media`;
  const mediaHeaders = houseAuthHeaders(houseId, 'POST', mediaPath, mediaBody, kauth);
  const mediaResp = await request.post(mediaPath, {
    data: mediaBody,
    headers: { 'content-type': 'application/json', ...mediaHeaders }
  });
  expect(mediaResp.ok()).toBeTruthy();
  const mediaJson = await mediaResp.json();
  expect(mediaJson.ok).toBeTruthy();

  const shareLookup = await request.get(`/api/share/by-house/${encodeURIComponent(houseId)}`);
  expect(shareLookup.ok()).toBeTruthy();
  const shareLookupJson = await shareLookup.json();
  expect(shareLookupJson.shareId).toBe(share.shareId);

  const leaderboard = await request.get('/api/leaderboard');
  const leaderboardJson = await leaderboard.json();
  expect(leaderboardJson.signups).toBe(1);
});

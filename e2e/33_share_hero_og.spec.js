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

function base58Encode(buf) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  if (!buf || !buf.length) return '';
  let x = BigInt(`0x${buf.toString('hex')}`);
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x /= 58n;
  }
  for (let i = 0; i < buf.length && buf[i] === 0; i += 1) out = `1${out}`;
  return out || '1';
}

async function createAgentSoloHouse(request, agentName = 'ShareHeroAgent') {
  const sessionResp = await request.post('/api/agent/session', { data: { agentName } });
  expect(sessionResp.ok()).toBeTruthy();
  const session = await sessionResp.json();
  const teamCode = session.teamCode;

  for (let i = 0; i < 20; i += 1) {
    const x = i % 16;
    const y = Math.floor(i / 16);
    const color = (i % 7) + 1;
    const paint = await request.post('/api/agent/canvas/paint', { data: { teamCode, x, y, color } });
    expect(paint.ok()).toBeTruthy();
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

  const initResp = await request.post('/api/agent/house/init', {
    data: {
      teamCode,
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address: 'So1anaMockShareHero1111111111111111111111111' },
      houseAuthKey: kauth.toString('base64')
    }
  });
  expect(initResp.ok()).toBeTruthy();

  return { teamCode, houseId, kauth };
}

async function createShare(request, houseId, kauth) {
  const path = `/api/house/${houseId}/share`;
  const body = '';
  const headers = houseAuthHeaders(houseId, 'POST', path, body, kauth);
  const shareResp = await request.post(path, { data: body, headers });
  expect(shareResp.ok()).toBeTruthy();
  const share = await shareResp.json();
  expect(share.shareId).toBeTruthy();
  return share;
}

test('share page renders share hero image and OG metadata uses share hero', async ({ page, request }) => {
  const { teamCode, houseId, kauth } = await createAgentSoloHouse(request);
  const share = await createShare(request, houseId, kauth);

  const imageResp = await request.get(`/api/agent/canvas/image?teamCode=${encodeURIComponent(teamCode)}`);
  expect(imageResp.ok()).toBeTruthy();
  const imageJson = await imageResp.json();
  expect(imageJson.ok).toBeTruthy();

  const mediaPath = `/api/house/${houseId}/media`;
  const mediaBody = JSON.stringify({
    slot: 'share-hero',
    image: imageJson.image,
    prompt: 'share hero og prompt',
    source: 'uploaded',
    version: 'v1'
  });
  const mediaHeaders = houseAuthHeaders(houseId, 'POST', mediaPath, mediaBody, kauth);
  const mediaWriteResp = await request.post(mediaPath, {
    data: mediaBody,
    headers: { 'content-type': 'application/json', ...mediaHeaders }
  });
  expect(mediaWriteResp.ok()).toBeTruthy();

  const sharePageResp = await request.get(`/s/${encodeURIComponent(share.shareId)}`);
  expect(sharePageResp.ok()).toBeTruthy();
  const html = await sharePageResp.text();
  expect(html).toContain(`/api/house/${houseId}/media/share-hero/image`);

  await page.goto(`/s/${encodeURIComponent(share.shareId)}`);
  const hero = page.getByTestId('share-hero-image');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveAttribute('src', new RegExp(`/api/house/${houseId}/media/share-hero/image`));
});

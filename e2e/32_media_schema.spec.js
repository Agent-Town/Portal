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

async function createAgentSoloHouse(request, agentName = 'MediaSchemaAgent') {
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
      unlock: { kind: 'solana-wallet-signature', address: 'So1anaMockMedia1111111111111111111111111111' },
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

test('media schema endpoints expose shareHero and share/leaderboard return media', async ({ request }) => {
  const { teamCode, houseId, kauth } = await createAgentSoloHouse(request);
  const share = await createShare(request, houseId, kauth);

  const imageResp = await request.get(`/api/agent/canvas/image?teamCode=${encodeURIComponent(teamCode)}`);
  expect(imageResp.ok()).toBeTruthy();
  const imageJson = await imageResp.json();
  expect(imageJson.ok).toBeTruthy();
  expect(imageJson.image.startsWith('data:image/png;base64,')).toBeTruthy();

  const mediaPath = `/api/house/${houseId}/media`;
  const mediaBody = JSON.stringify({
    slot: 'share-hero',
    image: imageJson.image,
    prompt: 'atlas hero test',
    source: 'uploaded',
    version: 'v1'
  });
  const mediaHeaders = houseAuthHeaders(houseId, 'POST', mediaPath, mediaBody, kauth);
  const mediaWriteResp = await request.post(mediaPath, {
    data: mediaBody,
    headers: { 'content-type': 'application/json', ...mediaHeaders }
  });
  expect(mediaWriteResp.ok()).toBeTruthy();
  const mediaWriteJson = await mediaWriteResp.json();
  expect(mediaWriteJson.ok).toBeTruthy();
  expect(mediaWriteJson.media?.shareHero?.imageUrl).toContain(`/api/house/${houseId}/media/share-hero/image`);
  expect(mediaWriteJson.media?.shareHero?.prompt).toBe('atlas hero test');

  const mediaReadResp = await request.get(`/api/house/${houseId}/media`);
  expect(mediaReadResp.ok()).toBeTruthy();
  const mediaReadJson = await mediaReadResp.json();
  expect(mediaReadJson.media?.shareHero?.imageUrl).toContain(`/api/house/${houseId}/media/share-hero/image`);
  expect(mediaReadJson.media?.agentAvatar?.imageUrl).toBeNull();
  expect(mediaReadJson.media?.humanAvatar?.imageUrl).toBeNull();

  const slotImageResp = await request.get(`/api/house/${houseId}/media/share-hero/image`);
  expect(slotImageResp.ok()).toBeTruthy();
  expect(slotImageResp.headers()['content-type']).toContain('image/png');

  const privateSlotBody = JSON.stringify({
    slot: 'agent-avatar',
    image: imageJson.image,
    source: 'uploaded',
    version: 'v1'
  });
  const privateSlotHeaders = houseAuthHeaders(houseId, 'POST', mediaPath, privateSlotBody, kauth);
  const privateSlotWriteResp = await request.post(mediaPath, {
    data: privateSlotBody,
    headers: { 'content-type': 'application/json', ...privateSlotHeaders }
  });
  expect(privateSlotWriteResp.ok()).toBeTruthy();

  const privateSlotImageResp = await request.get(`/api/house/${houseId}/media/agent-avatar/image`);
  expect(privateSlotImageResp.status()).toBe(401);

  const shareResp = await request.get(`/api/share/${encodeURIComponent(share.shareId)}`);
  expect(shareResp.ok()).toBeTruthy();
  const shareJson = await shareResp.json();
  expect(shareJson.share?.media?.shareHero?.imageUrl).toContain(`/api/house/${houseId}/media/share-hero/image`);
  expect(shareJson.share?.media?.agentAvatar?.imageUrl).toBeNull();
  expect(shareJson.share?.media?.shareHero?.source).toBeNull();
  expect(shareJson.share?.media?.shareHero?.version).toBeNull();

  const leaderboardResp = await request.get('/api/leaderboard');
  expect(leaderboardResp.ok()).toBeTruthy();
  const leaderboardJson = await leaderboardResp.json();
  const team = (leaderboardJson.teams || []).find((t) => t.shareId === share.shareId);
  expect(team).toBeTruthy();
  expect(team.media?.shareHero?.imageUrl).toContain(`/api/house/${houseId}/media/share-hero/image`);
  expect(team.media?.agentAvatar?.imageUrl).toBeNull();

  const publicMediaResp = await request.get(`/api/house/${houseId}/public-media`);
  expect(publicMediaResp.ok()).toBeTruthy();
  const publicMedia = await publicMediaResp.json();
  expect(publicMedia.publicMedia?.imageUrl).toContain(`/api/house/${houseId}/public-media/image`);
  expect(Object.prototype.hasOwnProperty.call(publicMedia, 'media')).toBe(false);
});

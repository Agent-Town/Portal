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
  const c = await request.post('/api/agent/house/commit', { data: { teamCode, commit } });
  expect(c.ok()).toBeTruthy();

  const nonceResp = await request.get('/api/house/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;

  const kroot = sha256(ra);
  const houseId = base58Encode(sha256(kroot));
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);

  const init = await request.post('/api/agent/house/init', {
    data: {
      teamCode,
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address: `So1anaMock${label}11111111111111111111111111111` },
      houseAuthKey: kauth.toString('base64')
    }
  });
  expect(init.ok()).toBeTruthy();

  return { teamCode, houseId, kauth };
}

async function createShareForHouse(request, house) {
  const path = `/api/house/${house.houseId}/share`;
  const body = '';
  const headers = houseAuthHeaders(house.houseId, 'POST', path, body, house.kauth);
  const resp = await request.post(path, { data: body, headers });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  expect(data.shareId).toBeTruthy();
  return data;
}

async function uploadShareHero(request, house) {
  const imageResp = await request.get(`/api/agent/canvas/image?teamCode=${encodeURIComponent(house.teamCode)}`);
  expect(imageResp.ok()).toBeTruthy();
  const imageJson = await imageResp.json();
  expect(imageJson.ok).toBeTruthy();
  const mediaPath = `/api/house/${house.houseId}/media`;
  const body = JSON.stringify({
    slot: 'share-hero',
    image: imageJson.image,
    prompt: 'leaderboard hero',
    source: 'uploaded',
    version: 'v1'
  });
  const headers = houseAuthHeaders(house.houseId, 'POST', mediaPath, body, house.kauth);
  const writeResp = await request.post(mediaPath, {
    data: body,
    headers: { 'content-type': 'application/json', ...headers }
  });
  expect(writeResp.ok()).toBeTruthy();
}

test('leaderboard cards render share hero from media and keep add-as-friend action', async ({ page, request }) => {
  const selfHouse = await createAgentSoloHouse(request, 'SelfBoardHero');
  const targetHouse = await createAgentSoloHouse(request, 'TargetBoardHero');
  await uploadShareHero(request, targetHouse);
  const targetShare = await createShareForHouse(request, targetHouse);

  await page.addInitScript(
    ({ houseId, keyB64 }) => {
      window.__agentTownHouseAuthMemory = window.__agentTownHouseAuthMemory || Object.create(null);
      window.__agentTownHouseAuthMemory[`agentTownHouseAuth:${houseId}`] = keyB64;
      localStorage.setItem('agentTownWallet', JSON.stringify({
        address: 'So1anaMockBoardHero111111111111111111111111111',
        houseId
      }));
    },
    { houseId: selfHouse.houseId, keyB64: selfHouse.kauth.toString('base64') }
  );

  const leaderboardResp = await request.get('/api/leaderboard');
  expect(leaderboardResp.ok()).toBeTruthy();
  const leaderboard = await leaderboardResp.json();
  const team = (leaderboard.teams || []).find((row) => row.shareId === targetShare.shareId);
  expect(team).toBeTruthy();
  expect(team.media?.shareHero?.imageUrl).toContain(`/api/house/${targetHouse.houseId}/media/share-hero/image`);

  await page.goto('/leaderboard');
  const card = page.locator('.card').filter({ hasText: targetShare.shareId }).first();
  await expect(card).toBeVisible();

  const hero = page.locator(`[data-testid="leaderboard-share-hero-${targetShare.shareId}"]`);
  await expect(hero).toBeVisible();
  await expect(hero).toHaveAttribute('src', team.media.shareHero.imageUrl);

  await card.getByRole('button', { name: 'Add as friend' }).click();
  await expect(card.locator(`[data-friend-add-status="${targetShare.shareId}"]`))
    .toContainText('Added to Pony friends.');
});

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

function buildHouseKeyWrap(kroot, signatureBytes) {
  const wrapKey = sha256(signatureBytes);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', wrapKey, iv);
  const enc = Buffer.concat([cipher.update(kroot), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    alg: 'AES-GCM',
    iv: iv.toString('base64'),
    ct: Buffer.concat([enc, tag]).toString('base64')
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
  const c = await request.post('/api/agent/house/commit', { data: { teamCode, commit } });
  expect(c.ok()).toBeTruthy();

  const nonceResp = await request.get('/api/house/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;

  const kroot = sha256(ra);
  const houseId = base58Encode(sha256(kroot));
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);
  const ponyInbox = buildPonyInboxBundle(kroot);
  const unlockAddress = `So1anaMock${label}11111111111111111111111111111`;
  const keyWrapSig = crypto.randomBytes(64);
  const keyWrap = buildHouseKeyWrap(kroot, keyWrapSig);

  const init = await request.post('/api/agent/house/init', {
    data: {
      teamCode,
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address: unlockAddress },
      keyWrap,
      houseAuthKey: kauth.toString('base64'),
      ponyInboxPub: ponyInbox.ponyInboxPub,
      ponyInboxPrivWrap: ponyInbox.ponyInboxPrivWrap
    }
  });
  expect(init.ok()).toBeTruthy();

  return { houseId, kauth, unlockAddress, keyWrapSig };
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

test('share page and leaderboard can add houses into Pony friends', async ({ page, request }) => {
  const selfHouse = await createAgentSoloHouse(request, 'SelfFriend');
  const shareTarget = await createAgentSoloHouse(request, 'ShareTarget');
  const leaderboardTarget = await createAgentSoloHouse(request, 'BoardTarget');

  const shareTargetShare = await createShareForHouse(request, shareTarget);
  const leaderboardTargetShare = await createShareForHouse(request, leaderboardTarget);

  await page.addInitScript(
    ({ houseId, keyB64, address, keyWrapSigB64 }) => {
      const sigBytes = Uint8Array.from(atob(keyWrapSigB64), (c) => c.charCodeAt(0));
      const publicKey = { toString: () => address };
      window.solana = {
        isConnected: false,
        publicKey: null,
        async connect() {
          this.isConnected = true;
          this.publicKey = publicKey;
          return { publicKey };
        },
        async signMessage() {
          return { signature: sigBytes };
        }
      };
      sessionStorage.setItem(`agentTownHouseAuth:${houseId}`, keyB64);
      localStorage.setItem('agentTownWallet', JSON.stringify({
        address,
        houseId
      }));
    },
    {
      houseId: selfHouse.houseId,
      keyB64: selfHouse.kauth.toString('base64'),
      address: selfHouse.unlockAddress,
      keyWrapSigB64: selfHouse.keyWrapSig.toString('base64')
    }
  );

  await page.goto(`/s/${encodeURIComponent(shareTargetShare.shareId)}`);
  await page.getByRole('button', { name: 'Add as friend' }).click();
  await expect(page.locator('#friendAddStatus')).toContainText('Added to Pony friends.');

  await page.goto(`/inbox/${encodeURIComponent(selfHouse.houseId)}`);
  await expect(page.locator('#friends')).toContainText(shareTarget.houseId);

  await page.evaluate((houseId) => {
    sessionStorage.removeItem(`agentTownHouseAuth:${houseId}`);
  }, selfHouse.houseId);

  await page.goto('/leaderboard');
  const targetCard = page.locator('.card').filter({ hasText: leaderboardTargetShare.shareId }).first();
  await expect(targetCard).toBeVisible();
  await targetCard.getByRole('button', { name: 'Add as friend' }).click();
  await expect(targetCard.locator(`[data-friend-add-status="${leaderboardTargetShare.shareId}"]`))
    .toContainText('Added to Pony friends.');

  await page.goto(`/inbox/${encodeURIComponent(selfHouse.houseId)}`);
  await expect(page.locator('#friends')).toContainText(leaderboardTarget.houseId);
});

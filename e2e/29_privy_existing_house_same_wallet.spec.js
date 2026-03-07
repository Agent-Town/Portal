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

function aesGcmEncrypt(key32, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key32, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, ct: Buffer.concat([enc, tag]) };
}

async function createLegacyUnlockHouse(request, { label = 'PrivyMigration' } = {}) {
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
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32).toString('base64');

  const walletAddress = `So1anaMock${label}11111111111111111111111111111`;
  const wrapSig = Buffer.alloc(64, 0x5a);
  const wrapKey = sha256(wrapSig);
  const wrapped = aesGcmEncrypt(wrapKey, kroot);
  const keyWrap = {
    alg: 'AES-GCM',
    iv: wrapped.iv.toString('base64'),
    ct: wrapped.ct.toString('base64')
  };

  const init = await request.post('/api/agent/house/init', {
    data: {
      teamCode,
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      // Legacy shape intentionally used to validate migration compatibility.
      unlock: { kind: 'solana-wallet-signature', address: walletAddress },
      keyWrap,
      houseAuthKey: kauth
    }
  });
  expect(init.ok()).toBeTruthy();

  return {
    houseId,
    walletAddress,
    walletSigB64: wrapSig.toString('base64')
  };
}

test('existing legacy-unlock house remains unlockable via Privy wallet mock with same address', async ({ page, request }) => {
  const legacyHouse = await createLegacyUnlockHouse(request, { label: 'PrivyCompat' });

  await page.addInitScript(
    ({ walletAddress, walletSigB64 }) => {
      const bin = atob(walletSigB64);
      const sig = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) sig[i] = bin.charCodeAt(i);

      window.__PRIVY_WALLET_BRIDGE__ = {
        connectSolana: async () => ({ address: walletAddress }),
        disconnectSolana: async () => {},
        signSolanaMessage: async () => ({ signature: sig })
      };
    },
    { walletAddress: legacyHouse.walletAddress, walletSigB64: legacyHouse.walletSigB64 }
  );

  await page.goto(`/house?house=${encodeURIComponent(legacyHouse.houseId)}`);
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();
});

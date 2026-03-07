const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes) {
  let x = BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = B58[Number(mod)] + out;
    x /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) out = `1${out}`;
  return out || '1';
}

function makeSolanaOwner() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const prefix = Buffer.from('302a300506032b6570032100', 'hex');
  if (!Buffer.from(spki.subarray(0, prefix.length)).equals(prefix)) {
    throw new Error('unexpected ed25519 key format');
  }
  const rawPub = spki.subarray(prefix.length);
  return {
    address: base58Encode(rawPub),
    signMessage: (message) =>
      crypto.sign(null, Buffer.from(String(message || ''), 'utf8'), privateKey).toString('base64')
  };
}

async function resetAll(request) {
  const res = await request.post('/__test__/reset', {
    headers: { 'x-test-reset': resetToken }
  });
  expect(res.ok()).toBeTruthy();
}

async function forceClaimMode(request) {
  const nonceRes = await request.get('/api/claim/erc8004/nonce?agentId=test-claim-agent');
  expect(nonceRes.ok()).toBeTruthy();
  const nonceJson = await nonceRes.json();
  expect(nonceJson.ok).toBeTruthy();

  const verifyRes = await request.post('/api/claim/erc8004/verify', {
    data: {
      agentId: 'test-claim-agent',
      nonce: nonceJson.nonce,
      signature: 'test-bypass-signature',
      address: 'So1anaMockClaim1111111111111111111111111111'
    }
  });
  expect(verifyRes.ok()).toBeTruthy();
  const verifyJson = await verifyRes.json();
  expect(verifyJson.ok).toBeTruthy();
}

test('house init requires wallet proof when unlock address is provided', async ({ request }) => {
  await resetAll(request);
  await forceClaimMode(request);

  const owner = makeSolanaOwner();
  const houseId = base58Encode(crypto.randomBytes(32));
  const houseAuthKey = crypto.randomBytes(32).toString('base64');

  const nonceRes = await request.get('/api/house/nonce');
  expect(nonceRes.ok()).toBeTruthy();
  const nonceJson = await nonceRes.json();

  const payload = {
    houseId,
    housePubKey: houseId,
    nonce: nonceJson.nonce,
    keyMode: 'ceremony',
    unlock: {
      kind: 'wallet-signature',
      chain: 'solana',
      address: owner.address
    },
    houseAuthKey
  };

  const missingSigRes = await request.post('/api/house/init', { data: payload });
  expect(missingSigRes.status()).toBe(400);
  await expect(missingSigRes.json()).resolves.toMatchObject({ ok: false, error: 'MISSING_UNLOCK_SIGNATURE' });

  const badSigRes = await request.post('/api/house/init', {
    data: { ...payload, keyWrapSig: Buffer.alloc(64, 1).toString('base64') }
  });
  expect(badSigRes.status()).toBe(400);
  await expect(badSigRes.json()).resolves.toMatchObject({ ok: false, error: 'INVALID_UNLOCK_SIGNATURE' });

  const wrapMessage = ['ElizaTown House Key Wrap', `houseId: ${houseId}`].join('\n');
  const keyWrapSig = owner.signMessage(wrapMessage);
  const okRes = await request.post('/api/house/init', {
    data: { ...payload, keyWrapSig }
  });
  expect(okRes.ok()).toBeTruthy();
  await expect(okRes.json()).resolves.toMatchObject({ ok: true, houseId });
});

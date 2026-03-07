const { test, expect } = require('@playwright/test');
const { Wallet } = require('ethers');
const crypto = require('crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const adminToken = process.env.ADMIN_TOKEN || 'test-admin';
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

async function createErc8004Reservation(request, data) {
  const res = await request.post('/api/reservations/erc8004', {
    headers: { 'x-admin-token': adminToken },
    data
  });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.ok).toBeTruthy();
  expect(json.houseId).toBeTruthy();
  return json;
}

test('ERC-8004 claim verifies EVM owner signature and returns reserved house', async ({ request }) => {
  await resetAll(request);

  const owner = Wallet.createRandom();
  const chainId = 11155111;
  const contract = '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432';
  const tokenId = '947';
  const canonicalAgentId = `${chainId}:${contract}:${tokenId}`.toLowerCase();
  const shortAlias = `${chainId}:${tokenId}`;

  const reservation = await createErc8004Reservation(request, {
    agentId: canonicalAgentId,
    claimChain: 'evm',
    ownerAddress: owner.address,
    aliases: [shortAlias]
  });

  const nonceRes = await request.get(
    `/api/claim/erc8004/nonce?agentId=${encodeURIComponent(shortAlias)}&real=1`,
  );
  expect(nonceRes.ok()).toBeTruthy();
  const nonceJson = await nonceRes.json();
  expect(nonceJson.ok).toBeTruthy();
  expect(nonceJson.claimChain).toBe('evm');
  expect(nonceJson.agentId).toBe(canonicalAgentId);
  expect(typeof nonceJson.message).toBe('string');

  const signature = await owner.signMessage(nonceJson.message);
  const verifyRes = await request.post('/api/claim/erc8004/verify', {
    data: {
      agentId: nonceJson.agentId,
      nonce: nonceJson.nonce,
      signature,
      address: owner.address
    }
  });
  expect(verifyRes.ok()).toBeTruthy();
  const verifyJson = await verifyRes.json();
  expect(verifyJson.ok).toBeTruthy();
  expect(verifyJson.verified).toBeTruthy();
  expect(verifyJson.claimChain).toBe('evm');
  expect(verifyJson.houseId).toBe(reservation.houseId);
  expect(verifyJson.nextUrl).toContain('/create?reserved=');
});

test('ERC-8004 claim rejects invalid EVM signature for owner', async ({ request }) => {
  await resetAll(request);

  const owner = Wallet.createRandom();
  const attacker = Wallet.createRandom();
  const canonicalAgentId = '11155111:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:948';

  await createErc8004Reservation(request, {
    agentId: canonicalAgentId,
    claimChain: 'evm',
    ownerAddress: owner.address
  });

  const nonceRes = await request.get(
    `/api/claim/erc8004/nonce?agentId=${encodeURIComponent(canonicalAgentId)}&real=1`,
  );
  expect(nonceRes.ok()).toBeTruthy();
  const nonceJson = await nonceRes.json();

  // Sign with attacker key but claim owner address -> must fail signature verification.
  const badSignature = await attacker.signMessage(nonceJson.message);
  const verifyRes = await request.post('/api/claim/erc8004/verify', {
    data: {
      agentId: nonceJson.agentId,
      nonce: nonceJson.nonce,
      signature: badSignature,
      address: owner.address
    }
  });
  expect(verifyRes.ok()).toBeFalsy();
  expect(verifyRes.status()).toBe(401);
  const verifyJson = await verifyRes.json();
  expect(verifyJson.error).toBe('BAD_SIGNATURE');
});

test('ERC-8004 claim verifies Solana owner signature and returns reserved house', async ({ request }) => {
  await resetAll(request);

  const owner = makeSolanaOwner();
  const asset = base58Encode(crypto.randomBytes(32));
  const canonicalAgentId = `solana:${asset}`;

  const reservation = await createErc8004Reservation(request, {
    agentId: canonicalAgentId,
    claimChain: 'solana',
    ownerAddress: owner.address,
    aliases: [asset]
  });

  const nonceRes = await request.get(
    `/api/claim/erc8004/nonce?agentId=${encodeURIComponent(asset)}&real=1`,
  );
  expect(nonceRes.ok()).toBeTruthy();
  const nonceJson = await nonceRes.json();
  expect(nonceJson.ok).toBeTruthy();
  expect(nonceJson.claimChain).toBe('solana');
  expect(nonceJson.agentId).toBe(canonicalAgentId);
  expect(typeof nonceJson.message).toBe('string');

  const signature = owner.signMessage(nonceJson.message);
  const verifyRes = await request.post('/api/claim/erc8004/verify', {
    data: {
      agentId: nonceJson.agentId,
      nonce: nonceJson.nonce,
      signature,
      address: owner.address
    }
  });
  expect(verifyRes.ok()).toBeTruthy();
  const verifyJson = await verifyRes.json();
  expect(verifyJson.ok).toBeTruthy();
  expect(verifyJson.verified).toBeTruthy();
  expect(verifyJson.claimChain).toBe('solana');
  expect(verifyJson.houseId).toBe(reservation.houseId);
  expect(verifyJson.nextUrl).toContain('/create?reserved=');
});

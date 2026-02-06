const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const { Wallet } = require('ethers');

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
  const sessData = await sess.json();
  const teamCode = sessData.teamCode;

  // Paint minimum required pixels (>=20)
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
  const houseAuthKey = hkdf(kroot, 'elizatown-house-auth-v1', 32).toString('base64');

  const init = await request.post('/api/agent/house/init', {
    data: {
      teamCode,
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: 'ceremony',
      unlock: { kind: 'solana-wallet-signature', address: `So1anaMock${label}11111111111111111111111111111` },
      houseAuthKey
    }
  });
  expect(init.ok()).toBeTruthy();

  return {
    houseId,
    kauth: hkdf(kroot, 'elizatown-house-auth-v1', 32)
  };
}

function buildAnchorLinkMessage({ houseId, erc8004Id, origin, nonce, createdAtMs }) {
  return [
    'AgentTown Anchor Link',
    `houseId: ${houseId}`,
    `erc8004Id: ${erc8004Id}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`,
    `createdAtMs: ${createdAtMs}`
  ].join('\n');
}

test('pony phase2: anchor routing + policy controls + rate limiting', async ({ request }) => {
  const houseA = await createAgentSoloHouse(request, 'A');
  const houseB = await createAgentSoloHouse(request, 'B');

  // Create a human session to register an anchor mapping for houseA.
  const sessionResp = await request.get('/api/session');
  expect(sessionResp.ok()).toBeTruthy();
  const origin = new URL(sessionResp.url()).origin;

  const nonceResp = await request.get('/api/anchors/nonce');
  expect(nonceResp.ok()).toBeTruthy();
  const nonce = (await nonceResp.json()).nonce;

  const signer = Wallet.createRandom();
  const erc8004Id = '11155111:4242';
  const createdAtMs = Date.now();
  const msg = buildAnchorLinkMessage({ houseId: houseA.houseId, erc8004Id, origin, nonce, createdAtMs });
  const signature = await signer.signMessage(msg);

  const register = await request.post('/api/anchors/register', {
    data: {
      houseId: houseA.houseId,
      erc8004Id,
      createdAtMs,
      nonce,
      signer: signer.address,
      signature,
      chainId: 11155111,
      origin
    }
  });
  expect(register.ok()).toBeTruthy();

  const resolve = await request.get(`/api/pony/resolve?erc8004Id=${encodeURIComponent(erc8004Id)}`);
  expect(resolve.ok()).toBeTruthy();
  const resolved = await resolve.json();
  expect(resolved.houseId).toBe(houseA.houseId);
  expect(resolved.source).toBe('anchor');

  // Update receiver policy on houseA: allow only houseB, no anonymous.
  const policyPath = '/api/pony/policy';
  const policyBody = JSON.stringify({
    houseId: houseA.houseId,
    allowAnonymous: false,
    autoAcceptAllowlist: true,
    allowlist: [houseB.houseId],
    blocklist: []
  });
  const policyHeaders = houseAuthHeaders(houseA.houseId, 'POST', policyPath, policyBody, houseA.kauth);
  const setPolicy = await request.post(policyPath, {
    data: policyBody,
    headers: { 'content-type': 'application/json', ...policyHeaders }
  });
  expect(setPolicy.ok()).toBeTruthy();

  // Anonymous send should be blocked.
  const anonSend = await request.post('/api/pony/send', {
    data: {
      toErc8004Id: erc8004Id,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anon attempt' }
    }
  });
  expect(anonSend.status()).toBe(403);
  expect((await anonSend.json()).error).toBe('ANONYMOUS_NOT_ALLOWED');

  const sendPath = '/api/pony/send';
  const firstSendBody = JSON.stringify({
    toErc8004Id: erc8004Id,
    fromHouseId: houseB.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'allowlisted hello' }
  });
  const firstSendHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, firstSendBody, houseB.kauth);
  const firstSend = await request.post(sendPath, {
    data: firstSendBody,
    headers: { 'content-type': 'application/json', ...firstSendHeaders }
  });
  expect(firstSend.ok()).toBeTruthy();
  expect((await firstSend.json()).status).toBe('accepted');

  // Receiver inbox should show accepted message.
  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, {
    headers: inboxHeaders
  });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();
  const accepted = inboxData.inbox.find((m) => m.envelope?.ciphertext?.ct === 'allowlisted hello');
  expect(accepted).toBeTruthy();
  expect(accepted.status).toBe('accepted');

  // Rate-limit check (20 per sender->receiver window). First send already consumed one.
  for (let i = 0; i < 19; i += 1) {
    const body = JSON.stringify({
      toErc8004Id: erc8004Id,
      fromHouseId: houseB.houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: `burst-${i}` }
    });
    const headers = houseAuthHeaders(houseB.houseId, 'POST', sendPath, body, houseB.kauth);
    const ok = await request.post(sendPath, {
      data: body,
      headers: { 'content-type': 'application/json', ...headers }
    });
    expect(ok.ok()).toBeTruthy();
  }

  const overBody = JSON.stringify({
    toErc8004Id: erc8004Id,
    fromHouseId: houseB.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'over-limit' }
  });
  const overHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, overBody, houseB.kauth);
  const over = await request.post(sendPath, {
    data: overBody,
    headers: { 'content-type': 'application/json', ...overHeaders }
  });
  expect(over.status()).toBe(429);
  expect((await over.json()).error).toBe('RATE_LIMITED_PONY');

  // Blocklist check should supersede send attempts.
  const blockBody = JSON.stringify({
    houseId: houseA.houseId,
    blocklist: [houseB.houseId]
  });
  const blockHeaders = houseAuthHeaders(houseA.houseId, 'POST', policyPath, blockBody, houseA.kauth);
  const setBlock = await request.post(policyPath, {
    data: blockBody,
    headers: { 'content-type': 'application/json', ...blockHeaders }
  });
  expect(setBlock.ok()).toBeTruthy();

  const blockedBody = JSON.stringify({
    toErc8004Id: erc8004Id,
    fromHouseId: houseB.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'blocked' }
  });
  const blockedHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, blockedBody, houseB.kauth);
  const blocked = await request.post(sendPath, {
    data: blockedBody,
    headers: { 'content-type': 'application/json', ...blockedHeaders }
  });
  expect(blocked.status()).toBe(403);
  expect((await blocked.json()).error).toBe('SENDER_BLOCKED');
});

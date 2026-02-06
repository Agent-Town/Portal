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

  return { houseId, kauth };
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

test('pony friends list derives from accepted + manual add; compose sends', async ({ page, request }) => {
  const houseA = await createAgentSoloHouse(request, 'A');
  const houseB = await createAgentSoloHouse(request, 'B');
  const houseC = await createAgentSoloHouse(request, 'C');

  // HouseA -> HouseB (request), then HouseB accepts. This should show up as a derived friend for B.
  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: houseB.houseId,
    fromHouseId: houseA.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'hey B (from A)' }
  });
  const sendHeaders = houseAuthHeaders(houseA.houseId, 'POST', sendPath, sendBody, houseA.kauth);
  const sendResp = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(sendResp.ok()).toBeTruthy();

  const inboxPath = '/api/pony/inbox';
  const inboxHeadersB = houseAuthHeaders(houseB.houseId, 'GET', inboxPath, '', houseB.kauth);
  const inboxRespB = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseB.houseId)}`, { headers: inboxHeadersB });
  expect(inboxRespB.ok()).toBeTruthy();
  const inboxDataB = await inboxRespB.json();
  const pending = (inboxDataB.inbox || []).find((m) => m.fromHouseId === houseA.houseId && m.status === 'request');
  expect(pending).toBeTruthy();

  const acceptPath = `/api/pony/inbox/${pending.id}/accept`;
  const acceptBody = JSON.stringify({ houseId: houseB.houseId });
  const acceptHeaders = houseAuthHeaders(houseB.houseId, 'POST', acceptPath, acceptBody, houseB.kauth);
  const acceptResp = await request.post(acceptPath, {
    data: acceptBody,
    headers: { 'content-type': 'application/json', ...acceptHeaders }
  });
  expect(acceptResp.ok()).toBeTruthy();

  // Register anchor for houseC so manual add by erc8004Id can resolve.
  const sessionResp = await request.get('/api/session');
  expect(sessionResp.ok()).toBeTruthy();
  const origin = new URL(sessionResp.url()).origin;

  const anchorsNonceResp = await request.get('/api/anchors/nonce');
  expect(anchorsNonceResp.ok()).toBeTruthy();
  const nonce = (await anchorsNonceResp.json()).nonce;

  const signer = Wallet.createRandom();
  const erc8004Id = '11155111:777';
  const createdAtMs = Date.now();
  const msg = buildAnchorLinkMessage({ houseId: houseC.houseId, erc8004Id, origin, nonce, createdAtMs });
  const signature = await signer.signMessage(msg);

  const register = await request.post('/api/anchors/register', {
    data: {
      houseId: houseC.houseId,
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

  // Open inbox UI for houseB with its house-auth key in sessionStorage.
  await page.addInitScript(
    ({ houseId, keyB64 }) => {
      sessionStorage.setItem(`agentTownHouseAuth:${houseId}`, keyB64);
    },
    { houseId: houseB.houseId, keyB64: houseB.kauth.toString('base64') }
  );

  await page.goto(`/inbox/${encodeURIComponent(houseB.houseId)}`);

  // Derived friend from accepted (houseA).
  await expect(page.locator('#friends')).toContainText(houseA.houseId);

  // Manual add by erc8004Id (houseC).
  await page.locator('#addFriendInput').fill(erc8004Id);
  await page.locator('#addFriendBtn').click();
  await expect(page.locator('#friends')).toContainText(houseC.houseId);

  // Compose to houseA by selecting friend, verify receiver prefill, send.
  await page.locator('#friendSelect').selectOption(houseA.houseId);
  await expect(page.locator('#toInput')).toHaveValue(houseA.houseId);
  await page.locator('#body').fill('hello A (from B via compose)');
  await page.locator('#sendBtn').click();
  await expect(page.locator('#sendStatus')).toContainText('Sent.');

  // Verify delivered to houseA inbox.
  const inboxHeadersA = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inboxRespA = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, { headers: inboxHeadersA });
  expect(inboxRespA.ok()).toBeTruthy();
  const inboxDataA = await inboxRespA.json();
  const received = (inboxDataA.inbox || []).find(
    (m) => m.fromHouseId === houseB.houseId && m.envelope?.ciphertext?.ct === 'hello A (from B via compose)'
  );
  expect(received).toBeTruthy();
});


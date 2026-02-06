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

test('pony phase5: dispatch receipts + receipt-backed postage + refs metadata hardening', async ({ request }) => {
  const houseA = await createAgentSoloHouse(request, 'Phase5A');
  const houseB = await createAgentSoloHouse(request, 'Phase5B');

  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: houseA.houseId,
    fromHouseId: houseB.houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'phase5 receipt seed' },
    transport: { kind: 'relay.mesh.v2', relayHints: ['mesh://north'] }
  });
  const sendHeaders = houseAuthHeaders(houseB.houseId, 'POST', sendPath, sendBody, houseB.kauth);
  const send = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(send.ok()).toBeTruthy();
  const sendData = await send.json();
  expect(sendData.dispatch?.receiptId).toMatch(/^dr_/);
  expect(sendData.dispatch?.adapter).toBe('relay.fallback.v1');
  expect(sendData.dispatch?.transportKind).toBe('relay.mesh.v2');

  const inboxPath = '/api/pony/inbox';
  const inboxHeaders = houseAuthHeaders(houseA.houseId, 'GET', inboxPath, '', houseA.kauth);
  const inbox = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseA.houseId)}`, {
    headers: inboxHeaders
  });
  expect(inbox.ok()).toBeTruthy();
  const inboxData = await inbox.json();
  const delivered = inboxData.inbox.find((m) => m.id === sendData.id);
  expect(delivered).toBeTruthy();
  expect(delivered.dispatch?.receiptId).toBe(sendData.dispatch.receiptId);
  expect(delivered.dispatch?.adapter).toBe('relay.fallback.v1');
  expect(delivered.dispatch?.transportKind).toBe('relay.mesh.v2');

  const appendPath = '/api/pony/vault/append';
  const refSha = crypto.createHash('sha256').update('phase5-ref').digest('hex');
  const appendBody = JSON.stringify({
    houseId: houseA.houseId,
    ciphertext: { alg: 'AES-GCM', iv: 'iv-phase5', ct: 'ct-phase5' },
    refs: ['ipfs://phase5-cid'],
    refsMeta: [
      {
        ref: 'ipfs://phase5-cid',
        mediaType: 'application/json',
        bytes: 321,
        sha256: refSha
      }
    ],
    postage: { kind: 'receipt.v1', receipts: [sendData.dispatch.receiptId] }
  });
  const appendHeaders = houseAuthHeaders(houseA.houseId, 'POST', appendPath, appendBody, houseA.kauth);
  const append = await request.post(appendPath, {
    data: appendBody,
    headers: { 'content-type': 'application/json', ...appendHeaders }
  });
  expect(append.ok()).toBeTruthy();
  const appendData = await append.json();

  const vaultPath = '/api/pony/vault';
  const vaultHeaders = houseAuthHeaders(houseA.houseId, 'GET', vaultPath, '', houseA.kauth);
  const vault = await request.get(`${vaultPath}?houseId=${encodeURIComponent(houseA.houseId)}&limit=10`, {
    headers: vaultHeaders
  });
  expect(vault.ok()).toBeTruthy();
  const vaultData = await vault.json();
  const appended = vaultData.items.find((entry) => entry?.id === appendData.id);
  expect(appended).toBeTruthy();
  expect(appended.refsMeta || []).toEqual([
    {
      ref: 'ipfs://phase5-cid',
      mediaType: 'application/json',
      bytes: 321,
      sha256: refSha
    }
  ]);

  const badReceiptBody = JSON.stringify({
    houseId: houseA.houseId,
    ciphertext: { alg: 'AES-GCM', iv: 'iv-bad-receipt', ct: 'ct-bad-receipt' },
    refs: ['ipfs://phase5-bad-receipt'],
    postage: { kind: 'receipt.v1', receipts: ['dr_missing_receipt_123456'] }
  });
  const badReceiptHeaders = houseAuthHeaders(houseA.houseId, 'POST', appendPath, badReceiptBody, houseA.kauth);
  const badReceipt = await request.post(appendPath, {
    data: badReceiptBody,
    headers: { 'content-type': 'application/json', ...badReceiptHeaders }
  });
  expect(badReceipt.status()).toBe(400);
  const badReceiptData = await badReceipt.json();
  expect(badReceiptData.error).toBe('POSTAGE_RECEIPT_NOT_FOUND');
  expect(badReceiptData.receiptId).toBe('dr_missing_receipt_123456');

  const dupReceiptBody = JSON.stringify({
    houseId: houseA.houseId,
    ciphertext: { alg: 'AES-GCM', iv: 'iv-dup-receipt', ct: 'ct-dup-receipt' },
    refs: ['ipfs://phase5-dup-receipt'],
    postage: { kind: 'receipt.v1', receipts: [sendData.dispatch.receiptId, sendData.dispatch.receiptId] }
  });
  const dupReceiptHeaders = houseAuthHeaders(houseA.houseId, 'POST', appendPath, dupReceiptBody, houseA.kauth);
  const dupReceipt = await request.post(appendPath, {
    data: dupReceiptBody,
    headers: { 'content-type': 'application/json', ...dupReceiptHeaders }
  });
  expect(dupReceipt.status()).toBe(400);
  expect((await dupReceipt.json()).error).toBe('POSTAGE_RECEIPT_DUPLICATE');

  const badRefsMetaBody = JSON.stringify({
    houseId: houseA.houseId,
    ciphertext: { alg: 'AES-GCM', iv: 'iv-bad-meta', ct: 'ct-bad-meta' },
    refs: ['ipfs://phase5-good-ref'],
    refsMeta: [{ ref: 'ipfs://phase5-missing-ref', bytes: 1 }],
    postage: { kind: 'receipt.v1', receipts: [sendData.dispatch.receiptId] }
  });
  const badRefsMetaHeaders = houseAuthHeaders(houseA.houseId, 'POST', appendPath, badRefsMetaBody, houseA.kauth);
  const badRefsMeta = await request.post(appendPath, {
    data: badRefsMetaBody,
    headers: { 'content-type': 'application/json', ...badRefsMetaHeaders }
  });
  expect(badRefsMeta.status()).toBe(400);
  expect((await badRefsMeta.json()).error).toBe('VAULT_REF_META_REF_UNKNOWN');
});

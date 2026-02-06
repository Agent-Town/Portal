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
  return crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len);
}

function houseAuthHeaders(houseId, method, path, body, key) {
  const ts = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('base64');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const auth = crypto.createHmac('sha256', key).update(msg).digest('base64');
  return { 'x-house-ts': ts, 'x-house-auth': auth };
}

test('pony inbox uses canonical house ids and house-auth on protected actions', async ({ page, request }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 23) & 0xff;
    window.solana = {
      connect: async () => ({ publicKey: { toString: () => 'So1anaMockPony1111111111111111111111111111111' } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMockPony1111111111111111111111111111111' } })
    };
  });

  await page.goto('/');
  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

  await request.post('/api/agent/connect', { data: { teamCode, agentName: 'ClawTest' } });
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode, elementId: 'key' } });
  await page.getByTestId('open-btn').click();
  await request.post('/api/agent/open/press', { data: { teamCode } });
  await page.waitForURL('**/create');

  const ra = crypto.randomBytes(32);
  await request.post('/api/agent/house/commit', { data: { teamCode, commit: sha256(ra).toString('base64') } });
  await request.post('/api/agent/house/reveal', { data: { teamCode, reveal: ra.toString('base64') } });

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  const matResp = await request.get(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`);
  const mat = await matResp.json();
  const rh = Buffer.from(mat.humanReveal, 'base64');
  const kroot = sha256(Buffer.concat([rh, ra]));
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);

  // Create share so we can verify legacy share-id alias -> canonical house-id mapping.
  const createSharePath = `/api/house/${houseId}/share`;
  const createShareBody = JSON.stringify({});
  const createShareHeaders = houseAuthHeaders(houseId, 'POST', createSharePath, createShareBody, kauth);
  const createShareResp = await request.post(createSharePath, {
    data: createShareBody,
    headers: { 'content-type': 'application/json', ...createShareHeaders }
  });
  expect(createShareResp.ok()).toBeTruthy();
  const createShare = await createShareResp.json();
  const shareId = createShare.shareId;
  expect(shareId).toBeTruthy();

  // Send to share id alias; server should normalize destination to canonical house id.
  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: shareId,
    fromHouseId: houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'hello from canonical sender' }
  });
  const sendHeaders = houseAuthHeaders(houseId, 'POST', sendPath, sendBody, kauth);
  const sendResp = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(sendResp.ok()).toBeTruthy();

  // Inbox read now requires house-auth.
  const inboxPath = '/api/pony/inbox';
  const inboxNoAuth = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseId)}`);
  expect(inboxNoAuth.status()).toBe(401);

  const inboxHeaders = houseAuthHeaders(houseId, 'GET', inboxPath, '', kauth);
  const inboxResp = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseId)}`, {
    headers: inboxHeaders
  });
  expect(inboxResp.ok()).toBeTruthy();
  const inboxData = await inboxResp.json();
  const canonicalMsg = inboxData.inbox.find((m) => m.fromHouseId === houseId && m.envelope?.ciphertext?.ct === 'hello from canonical sender');
  expect(canonicalMsg).toBeTruthy();
  expect(canonicalMsg.toHouseId).toBe(houseId);

  // Anonymous request is allowed but accept/reject is house-auth protected.
  const anonSend = await request.post(sendPath, {
    data: {
      toHouseId: houseId,
      ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'anonymous hello' }
    }
  });
  expect(anonSend.ok()).toBeTruthy();

  const inboxResp2 = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseId)}`, {
    headers: inboxHeaders
  });
  const inboxData2 = await inboxResp2.json();
  const pending = inboxData2.inbox.find((m) => !m.fromHouseId && m.envelope?.ciphertext?.ct === 'anonymous hello');
  expect(pending).toBeTruthy();
  expect(pending.status).toBe('request');

  const acceptPath = `/api/pony/inbox/${pending.id}/accept`;
  const acceptBody = JSON.stringify({ houseId });

  // Missing house-auth should be rejected.
  const acceptNoAuth = await request.post(acceptPath, {
    data: acceptBody,
    headers: { 'content-type': 'application/json' }
  });
  expect(acceptNoAuth.status()).toBe(401);

  // With house-auth it succeeds.
  const acceptHeaders = houseAuthHeaders(houseId, 'POST', acceptPath, acceptBody, kauth);
  const acceptOk = await request.post(acceptPath, {
    data: acceptBody,
    headers: { 'content-type': 'application/json', ...acceptHeaders }
  });
  expect(acceptOk.ok()).toBeTruthy();

  const inboxResp3 = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseId)}`, {
    headers: inboxHeaders
  });
  const inboxData3 = await inboxResp3.json();
  const accepted = inboxData3.inbox.find((m) => m.id === pending.id);
  expect(accepted.status).toBe('accepted');
});

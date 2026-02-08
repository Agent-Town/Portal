const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('pony express v0: mayor welcome + send + accept/reject', async ({ page, request }) => {
  // Mock a Solana wallet (Phantom-style) for create.js (house init uses wallet signatures for key-wrap).
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 17) & 0xff;
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => 'So1anaMockPony111111111111111111111111111111' } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMockPony111111111111111111111111111111' } })
    };
  });

  await page.goto('/');
  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

  // Connect agent + unlock the flow.
  await request.post('/api/agent/connect', { data: { teamCode, agentName: 'PonyClaw' } });
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode, elementId: 'key' } });
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');
  await page.getByTestId('open-btn').click();
  await request.post('/api/agent/open/press', { data: { teamCode } });
  await page.waitForURL('**/create');

  // Agent contributes to the ceremony so share creation is allowed.
  const ra = crypto.randomBytes(32);
  const raB64 = ra.toString('base64');
  const raCommit = crypto.createHash('sha256').update(ra).digest('base64');
  await request.post('/api/agent/house/commit', { data: { teamCode, commit: raCommit } });
  await request.post('/api/agent/house/reveal', { data: { teamCode, reveal: raB64 } });

  // Paint + generate a house.
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/);

  // Create a share *without unlocking the house UI* (forces /api/share/create, not house-auth share).
  const createShareBtn = page.getByRole('button', { name: 'Generate share link' });
  await expect(createShareBtn).toBeEnabled();
  await createShareBtn.click();
  await expect(page.locator('#sharePublic')).toContainText('/s/');

  // Read shareId from session state (cookie-auth).
  const stateResp = await page.request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state.ok).toBeTruthy();
  const shareId = state.share?.id || null;
  expect(shareId).toBeTruthy();

  // Pony inbox should contain an auto-accepted mayor welcome for the share.
  const inboxResp = await request.get(`/api/pony/inbox?houseId=${encodeURIComponent(shareId)}`);
  expect(inboxResp.ok()).toBeTruthy();
  const inboxJson = await inboxResp.json();
  expect(inboxJson.ok).toBeTruthy();
  expect(Array.isArray(inboxJson.inbox)).toBeTruthy();
  const mayor = (inboxJson.inbox || []).find((m) => m && m.fromHouseId === 'npc_mayor');
  expect(mayor).toBeTruthy();
  expect(mayor.status).toBe('accepted');
  expect(String(mayor.ciphertext || '')).toContain(`Welcome, House ${shareId}.`);

  // Send a message (non-mayor => request), then accept it.
  const sendA = await request.post('/api/pony/send', {
    data: { toHouseId: shareId, fromHouseId: 'sh_senderA', body: 'hello pony' }
  });
  expect(sendA.ok()).toBeTruthy();
  const sendAJson = await sendA.json();
  expect(sendAJson.ok).toBeTruthy();
  expect(sendAJson.id).toBeTruthy();

  const inboxAfterSend = await (await request.get(`/api/pony/inbox?houseId=${encodeURIComponent(shareId)}`)).json();
  const msgA = (inboxAfterSend.inbox || []).find((m) => m && m.id === sendAJson.id);
  expect(msgA).toBeTruthy();
  expect(msgA.status).toBe('request');
  expect(msgA.ciphertext).toBe('hello pony');

  const accept = await request.post(`/api/pony/inbox/${encodeURIComponent(sendAJson.id)}/accept`, { data: {} });
  expect(accept.ok()).toBeTruthy();

  const inboxAfterAccept = await (await request.get(`/api/pony/inbox?houseId=${encodeURIComponent(shareId)}`)).json();
  const msgAAccepted = (inboxAfterAccept.inbox || []).find((m) => m && m.id === sendAJson.id);
  expect(msgAAccepted).toBeTruthy();
  expect(msgAAccepted.status).toBe('accepted');

  // Send another message and reject it.
  const sendB = await request.post('/api/pony/send', {
    data: { toHouseId: shareId, fromHouseId: 'sh_senderB', body: 'goodbye pony' }
  });
  expect(sendB.ok()).toBeTruthy();
  const sendBJson = await sendB.json();
  expect(sendBJson.ok).toBeTruthy();
  expect(sendBJson.id).toBeTruthy();

  const reject = await request.post(`/api/pony/inbox/${encodeURIComponent(sendBJson.id)}/reject`, { data: {} });
  expect(reject.ok()).toBeTruthy();

  const inboxAfterReject = await (await request.get(`/api/pony/inbox?houseId=${encodeURIComponent(shareId)}`)).json();
  const msgBRejected = (inboxAfterReject.inbox || []).find((m) => m && m.id === sendBJson.id);
  expect(msgBRejected).toBeTruthy();
  expect(msgBRejected.status).toBe('rejected');
});


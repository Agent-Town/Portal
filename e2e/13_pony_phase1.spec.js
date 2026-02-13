const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet, houseAuthHeadersFromKeyB64 } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('pony inbox uses canonical house ids and house-auth on protected actions', async ({ page, request }) => {
  await installMockSolanaWallet(page, {
    address: 'So1anaMockPony1111111111111111111111111111111',
    multiplier: 29
  });
  await reachCreateViaLite(page);

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  const houseAuthKeyB64 = await page.evaluate((id) => {
    return sessionStorage.getItem(`agentTownHouseAuth:${id}`);
  }, houseId);
  expect(houseAuthKeyB64).toBeTruthy();

  const createSharePath = `/api/house/${houseId}/share`;
  const createShareBody = JSON.stringify({});
  const createShareHeaders = houseAuthHeadersFromKeyB64(houseId, 'POST', createSharePath, createShareBody, houseAuthKeyB64);
  const createShareResp = await request.post(createSharePath, {
    data: createShareBody,
    headers: { 'content-type': 'application/json', ...createShareHeaders }
  });
  expect(createShareResp.ok()).toBeTruthy();
  const createShare = await createShareResp.json();
  const shareId = createShare.shareId;
  expect(shareId).toBeTruthy();

  const policyPath = '/api/pony/policy';
  const policyBody = JSON.stringify({ houseId, allowLegacyPlaintext: true });
  const policyHeaders = houseAuthHeadersFromKeyB64(houseId, 'POST', policyPath, policyBody, houseAuthKeyB64);
  const policyResp = await request.post(policyPath, {
    data: policyBody,
    headers: { 'content-type': 'application/json', ...policyHeaders }
  });
  expect(policyResp.ok()).toBeTruthy();

  const sendPath = '/api/pony/send';
  const sendBody = JSON.stringify({
    toHouseId: shareId,
    fromHouseId: houseId,
    ciphertext: { alg: 'PLAINTEXT', iv: '', ct: 'hello from canonical sender' }
  });
  const sendHeaders = houseAuthHeadersFromKeyB64(houseId, 'POST', sendPath, sendBody, houseAuthKeyB64);
  const sendResp = await request.post(sendPath, {
    data: sendBody,
    headers: { 'content-type': 'application/json', ...sendHeaders }
  });
  expect(sendResp.ok()).toBeTruthy();

  const inboxPath = '/api/pony/inbox';
  const inboxNoAuth = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseId)}`);
  expect(inboxNoAuth.status()).toBe(401);

  const inboxHeaders = houseAuthHeadersFromKeyB64(houseId, 'GET', inboxPath, '', houseAuthKeyB64);
  const inboxResp = await request.get(`${inboxPath}?houseId=${encodeURIComponent(houseId)}`, {
    headers: inboxHeaders
  });
  expect(inboxResp.ok()).toBeTruthy();
  const inboxData = await inboxResp.json();
  const canonicalMsg = inboxData.inbox.find((m) => m.fromHouseId === houseId && m.envelope?.ciphertext?.ct === 'hello from canonical sender');
  expect(canonicalMsg).toBeTruthy();
  expect(canonicalMsg.toHouseId).toBe(houseId);

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
  const acceptNoAuth = await request.post(acceptPath, {
    data: acceptBody,
    headers: { 'content-type': 'application/json' }
  });
  expect(acceptNoAuth.status()).toBe(401);

  const acceptHeaders = houseAuthHeadersFromKeyB64(houseId, 'POST', acceptPath, acceptBody, houseAuthKeyB64);
  const acceptOk = await request.post(acceptPath, {
    data: acceptBody,
    headers: { 'content-type': 'application/json', ...acceptHeaders }
  });
  expect(acceptOk.ok()).toBeTruthy();
});

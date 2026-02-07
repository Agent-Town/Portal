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
  // Node >= 15
  return crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len);
}

function houseAuthHeaders(houseId, method, path, body, key) {
  const ts = String(Date.now());
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('base64');
  const msg = `${houseId}.${ts}.${method}.${path}.${bodyHash}`;
  const auth = crypto.createHmac('sha256', key).update(msg).digest('base64');
  return { 'x-house-ts': ts, 'x-house-auth': auth };
}

function aesGcmEncrypt(key32, plaintext, aad) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key32, iv);
  if (aad) cipher.setAAD(aad);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // WebCrypto AES-GCM returns ciphertext||tag as one buffer; mirror that.
  return { iv, ct: Buffer.concat([ct, tag]) };
}

test('agent derives ceremony key and appends; human can decrypt in house UI', async ({ page, request }) => {
  // Mock Solana wallet for unlock UX.
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 19) & 0xff;
    window.solana = {
      connect: async () => ({ publicKey: { toString: () => 'So1anaMockAgentAppend11111111111111111111111' } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMockAgentAppend11111111111111111111111' } })
    };
  });

  await page.goto('/');
  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

  // Connect agent
  await request.post('/api/agent/connect', { data: { teamCode, agentName: 'ClawTest' } });

  // Match
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode, elementId: 'key' } });

  // Press open (wait for enable to avoid flake under parallel workers)
  await expect(page.getByTestId('open-btn')).toBeEnabled();
  await page.getByTestId('open-btn').click();
  await request.post('/api/agent/open/press', { data: { teamCode } });
  await page.waitForURL('**/create');

  // Agent ceremony
  // Use randomness to avoid deterministic houseId collisions when tests run in parallel workers.
  const ra = crypto.randomBytes(32);
  const raB64 = ra.toString('base64');
  const raCommit = sha256(ra).toString('base64');
  await request.post('/api/agent/house/commit', { data: { teamCode, commit: raCommit } });
  await request.post('/api/agent/house/reveal', { data: { teamCode, reveal: raB64 } });

  // Human paints + lock in
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  // Agent derives K_root from ceremony material.
  const matResp = await request.get(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`);
  expect(matResp.ok()).toBeTruthy();
  const mat = await matResp.json();
  expect(mat.ok).toBeTruthy();
  expect(mat.houseId).toBe(houseId);
  expect(mat.humanReveal).toBeTruthy();

  const rh = Buffer.from(mat.humanReveal, 'base64');
  const combo = Buffer.concat([rh, ra]);
  const kroot = sha256(combo);
  const kenc = hkdf(kroot, 'elizatown-house-enc-v1', 32);
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);

  // Encrypt an entry as the agent.
  const payload = {
    v: 1,
    id: `e_${Date.now()}_agent`,
    ts: Date.now(),
    author: 'agent',
    type: 'note',
    body: { text: 'hello from agent (ceremony-derived)' }
  };
  const pt = Buffer.from(JSON.stringify(payload), 'utf8');
  const aad = Buffer.from(`house=${houseId}`, 'utf8');
  const enc = aesGcmEncrypt(kenc, pt, aad);

  const ciphertext = {
    alg: 'AES-GCM',
    iv: enc.iv.toString('base64'),
    ct: enc.ct.toString('base64')
  };

  const appendPath = `/api/house/${houseId}/append`;
  const appendBody = JSON.stringify({ ciphertext, author: 'agent' });
  const headers = houseAuthHeaders(houseId, 'POST', appendPath, appendBody, kauth);
  const appendResp = await request.post(appendPath, {
    data: appendBody,
    headers: { 'content-type': 'application/json', ...headers }
  });
  expect(appendResp.ok()).toBeTruthy();

  // Human unlocks and can decrypt it.
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.locator('#entries')).toContainText('hello from agent (ceremony-derived)');
});

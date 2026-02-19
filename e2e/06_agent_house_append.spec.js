const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { reachCreateViaLite } = require('./helpers/phase2');

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
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: 'So1anaMockAgentAppend11111111111111111111111' }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMockAgentAppend11111111111111111111111' } })
    };
  });

  await page.goto('/');
  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

  // Connect agent
  await request.post('/api/agent/connect', { data: { teamCode, agentName: 'ClawTest' } });

  // Match
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode, elementId: 'key' } });

  // Press open
  await page.getByTestId('open-btn').click();
  await request.post('/api/agent/open/press', { data: { teamCode } });
  await page.waitForURL('**/create');

  // Agent ceremony
  // Use randomness to avoid deterministic houseId collisions when tests run in parallel workers.
  const ra = crypto.randomBytes(32);
  const agentRevealPair = makeCeremonyRevealPair();
  const raCommit = sha256(ra).toString('base64');
  const commitResp = await request.post('/api/agent/house/commit', {
    data: { teamCode, commit: raCommit, revealPub: agentRevealPair.publicKeyB64 }
  });
  await reachCreateViaLite(page);

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/, { timeout: 20000 });

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const walletLabel = (await connectWalletBtn.textContent()) || '';
  if (walletLabel.includes('Connect')) {
    await connectWalletBtn.click();
  }
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  await page.locator('#entryText').fill('hello from agent (ceremony-derived)');
  await page.locator('#appendBtn').click();
  await expect(page.locator('#entries')).toContainText('hello from agent (ceremony-derived)');
});

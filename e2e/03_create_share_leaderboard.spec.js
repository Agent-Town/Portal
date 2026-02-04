const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

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

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('co-op open -> co-create -> generate house -> unlock with wallet signature', async ({ page, request }) => {
  // Mock a Solana wallet (Phantom-style) for Playwright.
  await page.addInitScript(() => {
    // Minimal mock matching usage in create.js/house.js
    const sig = new Uint8Array(64);
    // Deterministic but non-zero
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 13) & 0xff;
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => 'So1anaMock111111111111111111111111111111111' } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMock111111111111111111111111111111111' } })
    };
  });

  await page.goto('/');
  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

  // Connect agent
  await request.post('/api/agent/connect', { data: { teamCode, agentName: 'ClawTest' } });

  // Match
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode, elementId: 'key' } });
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');

  // Press open (human), then agent presses
  await page.getByTestId('open-btn').click();
  await expect(page.getByTestId('open-waiting')).toBeVisible();

  await request.post('/api/agent/open/press', { data: { teamCode } });

  // Should auto-navigate to /create
  await page.waitForURL('**/create');

  // Human paints one pixel
  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', '1');

  // Agent paints another pixel
  await request.post('/api/agent/canvas/paint', { data: { teamCode, x: 1, y: 0, color: 2 } });
  await expect(page.getByTestId('px-1-0')).toHaveAttribute('data-color', '2');

  // Agent contributes to house ceremony (commit+reveal).
  // Use randomness to avoid deterministic houseId collisions when tests run in parallel workers.
  const ra = crypto.randomBytes(32);
  const raB64 = ra.toString('base64');
  const raCommit = crypto.createHash('sha256').update(ra).digest('base64');
  await request.post('/api/agent/house/commit', { data: { teamCode, commit: raCommit } });
  await request.post('/api/agent/house/reveal', { data: { teamCode, reveal: raB64 } });

  await expect(page.getByTestId('share-btn')).toBeEnabled();

  // Generate house (creates + redirects to /house?house=...)
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/);

  const houseId = new URL(page.url()).searchParams.get('house');
  expect(houseId).toBeTruthy();

  // /api/house/:id/meta should exist (house-authenticated)
  const matResp = await request.get(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`);
  const mat = await matResp.json();
  const rh = Buffer.from(mat.humanReveal, 'base64');
  const kroot = sha256(Buffer.concat([rh, ra]));
  const kauth = hkdf(kroot, 'elizatown-house-auth-v1', 32);
  const metaPath = `/api/house/${houseId}/meta`;
  const metaHeaders = houseAuthHeaders(houseId, 'GET', metaPath, '', kauth);
  const meta = await request.get(metaPath, { headers: metaHeaders });
  expect(meta.ok()).toBeTruthy();

  // Now unlock descriptor rendering.
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await page.getByRole('button', { name: 'Sign to unlock' }).click();

  // Panels stay closed until toggled.
  await expect(page.locator('#descriptorPanel')).toBeHidden();
  await expect(page.locator('#erc8004Panel')).toBeHidden();

  // House page should render a descriptor textarea after toggle.
  await page.getByRole('button', { name: 'Show house QR' }).click();
  await expect(page.locator('#descriptor')).toBeVisible();
  await expect(page.locator('#descriptor')).toHaveValue(/"kind":\s*"agent-town-house"/);
  await expect(page.locator('#descriptor')).toHaveValue(/"id":\s*"[A-Za-z0-9]+"/);

  // Phase 2 hook: ERC-8004 statement exists after toggle.
  await page.getByRole('button', { name: 'Show ERC-8004' }).click();
  await expect(page.locator('#erc8004')).toBeVisible();
  await expect(page.locator('#erc8004')).toHaveValue(/erc8004\.link_house/);

  // Phase 3 hook: mint UI exists.
  await expect(page.getByRole('button', { name: 'Mint ERC-8004 identity' })).toBeVisible();
});

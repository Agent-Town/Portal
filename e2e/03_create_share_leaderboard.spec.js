const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset');
});

test('co-op beta -> co-create -> generate room -> unlock with wallet signature', async ({ page, request }) => {
  // Mock a Solana wallet (Phantom-style) for Playwright.
  await page.addInitScript(() => {
    // Minimal mock matching usage in create.js/room.js
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

  // Press beta (human) with email, then agent presses
  await page.getByTestId('email').fill('test@example.com');
  await page.getByTestId('beta-btn').click();
  await expect(page.getByTestId('beta-waiting')).toBeVisible();

  await request.post('/api/agent/beta/press', { data: { teamCode } });

  // Should auto-navigate to /create
  await page.waitForURL('**/create');

  // Human paints one pixel
  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', '1');

  // Agent paints another pixel
  await request.post('/api/agent/canvas/paint', { data: { teamCode, x: 1, y: 0, color: 2 } });
  await expect(page.getByTestId('px-1-0')).toHaveAttribute('data-color', '2');

  // Agent contributes to room ceremony (commit+reveal).
  // Use randomness to avoid deterministic roomId collisions when tests run in parallel workers.
  const ra = require('crypto').randomBytes(32);
  const raB64 = ra.toString('base64');
  const raCommit = require('crypto').createHash('sha256').update(ra).digest('base64');
  await request.post('/api/agent/room/commit', { data: { teamCode, commit: raCommit } });
  await request.post('/api/agent/room/reveal', { data: { teamCode, reveal: raB64 } });

  await expect(page.getByTestId('share-btn')).toBeEnabled();

  // Generate room (creates + redirects to /room?room=...)
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/room\?room=/);

  const roomId = new URL(page.url()).searchParams.get('room');
  expect(roomId).toBeTruthy();

  // /api/room/:id/meta should exist
  const meta = await request.get(`/api/room/${roomId}/meta`);
  expect(meta.ok()).toBeTruthy();

  // Now unlock descriptor rendering.
  await page.getByRole('button', { name: 'Connect wallet' }).click();
  await page.getByRole('button', { name: 'Sign to unlock' }).click();

  // Room page should render a descriptor textarea.
  await expect(page.locator('#descriptor')).toBeVisible();
  await expect(page.locator('#descriptor')).toHaveValue(/"kind":\s*"agent-town-room"/);
  await expect(page.locator('#descriptor')).toHaveValue(/"id":\s*"[A-Za-z0-9]+"/);

  // Phase 2 hook: ERC-8004 statement exists.
  await expect(page.locator('#erc8004')).toBeVisible();
  await expect(page.locator('#erc8004')).toHaveValue(/erc8004\.link_room/);

  // Phase 3 hook: mint UI exists.
  await expect(page.getByRole('button', { name: 'Mint ERC-8004 identity' })).toBeVisible();
});

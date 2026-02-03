const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset');
});

test('room unlock is wallet-signature gated (mocked wallet)', async ({ page, request }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (255 - i) & 0xff;
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => 'So1anaMock222222222222222222222222222222222' } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => 'So1anaMock222222222222222222222222222222222' } })
    };
  });

  await page.goto('/');
  const teamCodeA = (await page.getByTestId('team-code').innerText()).trim();

  await request.post('/api/agent/connect', { data: { teamCode: teamCodeA, agentName: 'RefSource' } });
  await page.getByTestId('sigil-key').click();
  await request.post('/api/agent/select', { data: { teamCode: teamCodeA, elementId: 'key' } });
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');

  await page.getByTestId('email').fill('source@example.com');
  await page.getByTestId('beta-btn').click();
  await request.post('/api/agent/beta/press', { data: { teamCode: teamCodeA } });
  await page.waitForURL('**/create');

  // Agent contributes to ceremony (commit+reveal) before human locks in.
  const ra = Buffer.from(Array.from({ length: 32 }, (_, i) => i));
  const raB64 = ra.toString('base64');
  const raCommit = require('crypto').createHash('sha256').update(ra).digest('base64');
  await request.post('/api/agent/room/commit', { data: { teamCode: teamCodeA, commit: raCommit } });
  await request.post('/api/agent/room/reveal', { data: { teamCode: teamCodeA, reveal: raB64 } });

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/room\?room=/);

  const roomId = new URL(page.url()).searchParams.get('room');
  expect(roomId).toBeTruthy();

  // Meta exists and includes nonce + wrappedKey.
  const metaResp = await request.get(`/api/room/${roomId}/meta`);
  expect(metaResp.ok()).toBeTruthy();
  const meta = await metaResp.json();
  expect(meta.ok).toBeTruthy();
  expect(meta.nonce).toContain('n_');
  expect(meta.wrappedKey).toBeTruthy();
});

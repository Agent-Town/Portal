const { test, expect } = require('@playwright/test');

// This test runs in NODE_ENV=test. The server supports shortcuts to avoid real RPC/signature.
// Goal: claim an ERC-8004 identity in solo mode -> proceed to create -> house unlock works.

test('ERC-8004 claim (solo) -> create -> house unlock', async ({ page }) => {
  // Reset all state (test-only endpoint).
  await page.request.post('/__test__/reset', {
    headers: { 'x-test-reset': process.env.TEST_RESET_TOKEN || 'test-reset' }
  });

  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 7) & 0xff;
    const address = 'So1anaMockToken1111111111111111111111111111';
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => address } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => address } })
    };
  });

  await page.goto('/');

  // Go to claim page.
  await page.goto('/claim');

  // Request a nonce for a known claimable (in test mode we will accept an address provided).
  const agentId = '11155111:947';
  const nonceRes = await page.request.get(`/api/claim/erc8004/nonce?agentId=${encodeURIComponent(agentId)}`);
  expect(nonceRes.ok()).toBeTruthy();
  const nonceJson = await nonceRes.json();
  expect(nonceJson.ok).toBeTruthy();
  expect(nonceJson.nonce).toBeTruthy();

  // Verify claim (test mode accepts provided address and skips crypto/RPC).
  // Must match the mocked Phantom address used below.
  const address = 'So1anaMockToken1111111111111111111111111111';
  const verifyRes = await page.request.post('/api/claim/erc8004/verify', {
    data: {
      agentId,
      nonce: nonceJson.nonce,
      signature: '0xtest',
      address,
      coop: false
    }
  });
  expect(verifyRes.ok()).toBeTruthy();
  const verifyJson = await verifyRes.json();
  expect(verifyJson.ok).toBeTruthy();
  expect(verifyJson.nextUrl).toBe('/create');

  // Continue to create flow.
  await page.goto('/create');

  // Continue with the standard create flow UI.
  // Seed the entropy grid so the "Generate house key" button becomes enabled.
  const grid = page.getByTestId('canvas');
  await expect(grid).toBeVisible();
  // Click actual pixel buttons so /api/human/canvas/paint runs and enables the share button.
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('px-1-1').click();

  const shareBtn = page.getByTestId('share-btn');
  await expect(shareBtn).toBeEnabled();

  await shareBtn.click();

  // Debug if we didn't navigate.
  const errText = await page.locator('#err').textContent().catch(() => '');
  if (errText && errText.trim()) {
    throw new Error(`create error: ${errText.trim()}`);
  }

  // After key generation, the app navigates to /house.
  await page.waitForURL(/\/house/, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /house/i })).toBeVisible();
});

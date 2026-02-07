const { test, expect } = require('@playwright/test');

// This test runs in NODE_ENV=test. The server supports shortcuts to avoid real RPC/signature.
// Goal: claim an ERC-8004 identity in solo mode -> proceed to create -> house unlock works.

test('ERC-8004 claim (solo) -> create -> house unlock', async ({ page }) => {
  // Reset all state (test-only endpoint).
  await page.request.post('/api/test/reset-all', {
    headers: { 'x-test-reset': process.env.TEST_RESET_TOKEN || 'test-reset-token' }
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
  const address = '0x1111111111111111111111111111111111111111';
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

  // In solo flow, we can complete human reveal and lock.
  await page.getByRole('button', { name: /open press/i }).click();

  // The UI uses a pixel canvas; just click a few times to seed.
  const canvas = page.locator('#createCanvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 10, box.y + 10);
  await page.mouse.click(box.x + 20, box.y + 20);

  await page.getByRole('button', { name: /lock/i }).click();

  // After locking, user should be able to navigate to house.
  await page.waitForURL(/\/house/);
  await expect(page.locator('text=House')).toBeVisible();
});

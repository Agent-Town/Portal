const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('disconnecting wallet after unlocking resets to a fresh session (shared device)', async ({ page }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 11) & 0xff;
    const address = 'So1anaMockToken1111111111111111111111111111';
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: sig, publicKey: { toString: () => address } })
    };
  });

  await page.goto('/');
  const teamBefore = (await page.getByTestId('team-code').innerText()).trim();
  expect(teamBefore).toMatch(/^TEAM-/);

  // Human token-holder flow to create a house.
  await page.getByTestId('path-human').click();
  await page.getByRole('button', { name: 'Check wallet' }).click();
  await expect(page.getByTestId('token-status')).toContainText('Verified');

  await page.getByRole('link', { name: 'Create house' }).click();
  await page.waitForURL('**/create?mode=token');
  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL(/\/house\?house=/);

  // Unlock, then disconnect wallet.
  const connectBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/ });
  const label = (await connectBtn.textContent()) || '';
  if (label.includes('Connect')) await connectBtn.click();
  await page.getByRole('button', { name: 'Sign to unlock' }).click();
  await expect(page.getByRole('button', { name: 'Unlocked' })).toBeVisible();

  await page.getByRole('button', { name: 'Disconnect wallet' }).click();

  // After disconnect, we should land back on "/" with a fresh team code.
  await page.waitForURL('**/');
  await expect(page.getByTestId('reconnect-panel')).toBeHidden();
  const teamAfter = (await page.getByTestId('team-code').innerText()).trim();
  expect(teamAfter).toMatch(/^TEAM-/);
  expect(teamAfter).not.toBe(teamBefore);
});

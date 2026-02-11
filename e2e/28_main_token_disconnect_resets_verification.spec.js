const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('disconnecting wallet on main page resets token verified state', async ({ page }) => {
  await page.addInitScript(() => {
    const sig = new Uint8Array(64);
    for (let i = 0; i < sig.length; i++) sig[i] = (i * 13) & 0xff;
    const address = 'So1anaMockToken1111111111111111111111111111';
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => address } }),
      signMessage: async () => ({ signature: sig, publicKey: { toString: () => address } }),
      disconnect: async () => {}
    };
  });

  await page.goto('/');
  const teamBefore = (await page.getByTestId('team-code').innerText()).trim();
  expect(teamBefore).toMatch(/^TEAM-/);

  await page.getByTestId('path-human').click();
  await page.getByRole('button', { name: 'Check wallet' }).click();
  await expect(page.getByTestId('token-status')).toContainText('Verified');

  await page.getByRole('button', { name: 'Disconnect wallet' }).click();
  await page.waitForURL('**/');

  await expect(page.getByTestId('reconnect-panel')).toBeHidden();
  await page.getByTestId('path-human').click();
  await expect(page.getByTestId('token-status')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Create house' })).toBeHidden();

  const teamAfter = (await page.getByTestId('team-code').innerText()).trim();
  expect(teamAfter).toMatch(/^TEAM-/);
  expect(teamAfter).not.toBe(teamBefore);
});

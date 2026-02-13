const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('disconnecting wallet on main page resets token verified state', async ({ page }) => {
  await installMockSolanaWallet(page, {
    address: 'So1anaMockToken1111111111111111111111111111',
    multiplier: 13,
    withDisconnect: true
  });

  await page.goto('/');
  await page.getByTestId('auth-signin').click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible();

  const teamBefore = (await page.getByTestId('team-code').innerText()).trim();
  expect(teamBefore).toMatch(/^TEAM-/);

  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.getByTestId('hatch-status')).toContainText(/no existing house|hatch your openclaw lite agent/i);
  await expect(page.getByTestId('path-human')).toHaveCount(0);

  const resetResult = await page.evaluate(async () => {
    const resp = await fetch('/api/session/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, data };
  });
  expect(resetResult.ok).toBe(true);

  await page.reload();
  await page.getByTestId('auth-signin').click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible();
  const teamAfter = (await page.getByTestId('team-code').innerText()).trim();
  expect(teamAfter).toMatch(/^TEAM-/);
  expect(teamAfter).not.toBe(teamBefore);
});

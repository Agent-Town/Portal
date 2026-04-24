const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page keeps auth modal open after Privy login failure so user can retry', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
        throw new Error('PRIVY_LOGIN_FAILED');
      }
    });
  });

  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: true,
        startPageEnabled: true,
        appPath: '/app',
        config: {
          appId: 'app-mock',
          loginMethod: 'email',
          enableDefaultBridge: false
        }
      })
    });
  });

  await page.goto('/start');
  await selectStartPreset(page, 'global-default');
  await page.getByRole('button', { name: 'Play Founders Plot' }).click();
  await expect(page.locator('[data-testid="privy-auth-box"]')).toBeVisible({ timeout: 2500 });
  await expect(page.getByText('Could not complete Privy login.')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('[data-testid="privy-auth-box"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Founders Plot' })).toBeEnabled();
});

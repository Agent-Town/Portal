const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page enters app even when Privy wallet auto-create fails', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive || !loginUi) return null;
        const email = await loginUi.requestEmail();
        if (!email) return null;
        return { id: 'mock-user', email };
      },
      connectSolana: async () => {
        throw new Error('EMBEDDED_WALLET_PROXY_NOT_INITIALIZED');
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
  await page.getByRole('button', { name: 'Enter' }).click();
  await page.locator('#privyEmailInput').fill('wallet-fail@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await expect(page).toHaveURL(/\/app$/);
});

const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page retry keeps email form armed without page navigation', async ({ page }) => {
  await page.addInitScript(() => {
    let attempt = 0;
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive || !loginUi) return null;
        const email = await loginUi.requestEmail();
        attempt += 1;
        if (attempt < 2) {
          throw new Error('PRIVY_LOGIN_FAILED');
        }
        return { id: 'retry-user', email };
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
  await page.locator('#privyEmailInput').fill('retry@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.locator('[data-testid="privy-auth-box"]')).toBeVisible();

  await page.locator('#privyEmailInput').fill('retry2@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await expect(page).toHaveURL(/\/app\?district=founders-plot&entry=play-first$/);
});

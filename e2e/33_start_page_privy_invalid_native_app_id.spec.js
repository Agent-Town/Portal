const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page shows actionable message when Privy reports invalid native app id', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async () => {
        const err = new Error('PRIVY_EMAIL_SEND_FAILED');
        err.code = 'PRIVY_EMAIL_SEND_FAILED';
        err.status = 403;
        err.detail = 'Invalid nativeAppID';
        throw err;
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
  await expect(
    page.getByText(
      'Privy rejected your app/client ID. Verify PRIVY_APP_ID and remove PRIVY_CLIENT_ID unless it is a web app client.'
    )
  ).toBeVisible();
});

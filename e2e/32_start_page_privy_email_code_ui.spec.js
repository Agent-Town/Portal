const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page uses email+code auth box for Privy login before entering app', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive || !loginUi) return null;
        const email = await loginUi.requestEmail();
        loginUi.notifyCodeSent({ email });
        const code = await loginUi.requestCode({ email });
        if (!code) return null;
        return { id: 'mock-user', email };
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
          clientId: 'client-mock',
          loginMethod: 'email',
          enableDefaultBridge: false
        }
      })
    });
  });

  await page.goto('/start');

  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.locator('[data-testid="privy-auth-box"]')).toBeVisible();
  await expect(page.getByText('Enter your email to receive a one-time code.')).toBeVisible();

  await page.locator('#privyEmailInput').fill('tester@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();

  await expect(page.locator('#privyCodeForm')).toBeVisible();
  await expect(page.getByText('Enter the code sent to tester@example.com.')).toBeVisible();
  await page.locator('#privyCodeInput').fill('123456');
  await page.locator('#privyCodeForm').getByRole('button', { name: 'Verify code' }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId('open-btn')).toBeVisible();
});

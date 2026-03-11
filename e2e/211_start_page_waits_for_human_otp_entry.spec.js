const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page does not time out while waiting for the human to enter the OTP code', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, ms, ...args) => {
      if (Number(ms) === 60000) {
        return nativeSetTimeout(callback, 50, ...args);
      }
      return nativeSetTimeout(callback, ms, ...args);
    };

    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive || !loginUi) return null;
        const email = await loginUi.requestEmail();
        loginUi.notifyCodeSent({ email });
        const code = await loginUi.requestCode({ email });
        if (!code) return null;
        return { id: 'slow-otp-user', email };
      },
      connectSolana: async ({ silent = false } = {}) => ({
        address: 'So11111111111111111111111111111111111111112',
        silent
      }),
      connectEvm: async ({ silent = false } = {}) => ({
        address: '0x1111111111111111111111111111111111111111',
        silent,
        provider: {
          request: async ({ method } = {}) => {
            if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
              return ['0x1111111111111111111111111111111111111111'];
            }
            return [];
          }
        }
      })
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
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.locator('[data-testid="privy-auth-box"]')).toBeVisible();

  await page.locator('#privyEmailInput').fill('slow@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await expect(page.locator('#privyCodeForm')).toBeVisible();

  await page.waitForTimeout(150);
  await expect(page.locator('#privyCodeForm')).toBeVisible();
  await expect(page.locator('#startStatus')).not.toContainText('Privy login took too long');

  await page.locator('#privyCodeInput').fill('123456');
  await page.locator('#privyCodeForm').getByRole('button', { name: 'Verify code' }).click();

  await expect(page).toHaveURL(/\/app$/, { timeout: 8000 });
  await expect(page.locator('#districtMap')).toBeVisible();
});

const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page opens auth modal immediately while Privy bridge login is still initializing', async ({ page }) => {
  await page.addInitScript(() => {
    const readLoggedInEmail = () => {
      try {
        return localStorage.getItem('mockPrivyLoggedInEmail') || '';
      } catch {
        return '';
      }
    };
    const saveLoggedInEmail = (email) => {
      try {
        localStorage.setItem('mockPrivyLoggedInEmail', String(email || 'fast@example.com'));
      } catch {
        // ignore storage errors in tests
      }
    };
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive) {
          const email = readLoggedInEmail();
          return email ? { id: 'mock-user', email } : null;
        }
        if (!interactive || !loginUi) return null;
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const email = await loginUi.requestEmail();
        if (!email) return null;
        saveLoggedInEmail(email);
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
          loginMethod: 'email',
          enableDefaultBridge: false
        }
      })
    });
  });

  await page.goto('/start');
  await selectStartPreset(page, 'global-default');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.locator('[data-testid="privy-auth-box"]')).toBeVisible({ timeout: 500 });

  await page.locator('#privyEmailInput').fill('fast@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await expect(page).toHaveURL(/\/app$/);
});

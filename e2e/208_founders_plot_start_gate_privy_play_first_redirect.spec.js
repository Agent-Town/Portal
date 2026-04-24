const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Start Gate auth redirects directly into Founders Plot play-first mode', async ({ page }) => {
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
        localStorage.setItem('mockPrivyLoggedInEmail', String(email || 'founder@example.com'));
      } catch {
        // ignore storage errors in tests
      }
    };
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive) {
          const email = readLoggedInEmail();
          return email ? { id: 'play-first-user', email } : null;
        }
        if (!loginUi) return { id: 'play-first-user', email: 'founder@example.com' };
        const email = await loginUi.requestEmail();
        loginUi.notifyCodeSent({ email });
        const code = await loginUi.requestCode({ email });
        if (!code) return null;
        saveLoggedInEmail(email);
        return { id: 'play-first-user', email };
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
  await selectStartPreset(page, 'global-default');
  await page.getByRole('button', { name: 'Play Founders Plot' }).click();
  await page.locator('#privyEmailInput').fill('founder@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await page.locator('#privyCodeInput').fill('123456');
  await page.locator('#privyCodeForm').getByRole('button', { name: 'Verify code' }).click();

  await expect(page).toHaveURL(/\/app\?district=founders-plot&entry=play-first$/);
  const frame = await getOpenFoundersPlotFrame(page);
  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();
  await frame.getByTestId('founders-clover-avatar').click();
  await expect(frame.getByTestId('founders-foreman-status')).toContainText('Manual Founder Mode');
  await expect(page.locator('#townhallRegisterPanel')).toHaveCount(0);
});

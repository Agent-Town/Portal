const { test, expect } = require('@playwright/test');
const { seedExperiencePreference } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('stored preference still allows start-page auto-skip for an already signed-in returning user', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive } = {}) => {
        if (interactive) return { id: 'existing-user' };
        return { id: 'existing-user' };
      },
      connectSolana: async () => ({ address: 'So11111111111111111111111111111111111111112' }),
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
          enableDefaultBridge: false,
        },
      }),
    });
  });

  await page.route('**/api/onboarding/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        step: 2,
        hasWallet: true,
      }),
    });
  });

  await page.goto('/start');
  await expect(page).toHaveURL(/\/app$/, { timeout: 8000 });
});

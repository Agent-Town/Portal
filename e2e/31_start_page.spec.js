const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page renders the ZHC0 arrival surface and Enter opens app page when Privy is disabled', async ({ page }) => {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        startPageEnabled: false,
        appPath: '/app',
        config: null
      })
    });
  });

  await page.goto('/start');

  const root = page.getByTestId('start-card');

  await expect(root).toHaveAttribute('data-zhc-phase', 'arrival');
  await expect(root).toHaveAttribute('data-zhc-overlay-state', 'ready');
  await expect(page.getByRole('heading', { name: 'Start a company with your agent.' })).toBeVisible();
  await expect(page.getByText('What happens here', { exact: true })).toBeVisible();
  await expect(page.getByText('Your first loop', { exact: true })).toBeVisible();
  await expect(page.locator('img.startLogo')).toBeVisible();
  await expect(page.locator('iframe.startVideo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible();

  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('#districtMap')).toBeVisible();
});

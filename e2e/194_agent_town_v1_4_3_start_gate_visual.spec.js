const { test, expect } = require('@playwright/test');
const { selectStartPreset } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request, page }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
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
});

test('Start Gate uses the V1.4.3 hero art and hero-cast strip', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto('/start.html');

  await expect(page.locator('#startHeroPoster')).toHaveAttribute('src', '/assets/platform/start_gate/start-gate-hero-v1_4_3.webp');
  await expect(page.getByTestId('start-hero-cast-strip')).toBeVisible();
  await expect(page.getByLabel('AI warning')).toContainText('WARNING! CONTAINS AND PRODUCES AI SLOP.');
  await selectStartPreset(page, 'global-default');
  await expect(page.getByRole('button', { name: 'Enter' })).toBeEnabled();

  await expect(page.getByTestId('start-card')).toHaveScreenshot('agent-town-v1-4-3-start-gate-desktop-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

test('Start Gate stays legible on mobile with the V1.4.3 art', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1200 });
  await page.goto('/start.html');
  await selectStartPreset(page, 'global-default');
  await expect(page.getByTestId('start-card')).toHaveScreenshot('agent-town-v1-4-3-start-gate-mobile-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });
});

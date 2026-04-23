const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Town shell uses the V1.4.3 background and district preview icons', async ({ page, request }) => {
  const styles = await request.get('/styles.css').then((response) => response.text());
  expect(styles).toContain('/assets/platform/town_shell/town-shell-background-v1_4_3.webp');
  expect(styles).toContain('/assets/platform/townhall/townhall-onboarding-illustration-v1_4_3.webp');
  expect(styles).toContain('/assets/platform/pony/pony-express-illustration-v1_4_3.webp');
  expect(styles).toContain('/assets/platform/saloon/saloon-future-games-hub-v1_4_3.webp');

  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto('/app');
  await expect(page.locator('#districtMap')).toBeVisible();
  await expect(page.locator('.townDistrictIcon')).toHaveCount(6);
  await expect(page.getByTestId('agent-debug-pane')).toBeHidden();

  await expect(page.locator('#townScenePanel')).toHaveScreenshot('agent-town-v1-4-3-town-shell-desktop-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });
});

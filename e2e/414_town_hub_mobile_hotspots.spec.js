const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('town hub mobile hotspots remain individually tappable without overlap interception', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');

  await page.locator('.townDistrictHotspot[data-district="leaderboard"]').click();
  await expect(page.locator('#districtModalTitle')).toHaveText('Town Board');
  await page.locator('#districtModalClose').click();

  await page.locator('.townDistrictHotspot[data-district="saloon"]').click();
  await expect(page.locator('#districtModalTitle')).toHaveText('Saloon');
});

const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('direct Brain settings route opens Connect Brain instead of Plan Wagons', async ({ page }) => {
  await page.goto('/app?district=brain&entry=brain-settings');

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Connect Brain');
  await expect(page.locator('#districtModalBody')).toContainText(/Give your agent a brain|Connect Brain/i);
  await expect(page.locator('#districtModalBody')).not.toContainText('Plan Wagons');
  await expect(page.locator('#townSceneStatus')).toContainText(/Brain settings/i);
});

test('town map uses painted buildings as targets instead of floating thumbnail badges', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/app');
  await expect(page.locator('#districtMap')).toBeVisible();

  await expect(page.locator('.townDistrictIcon')).toHaveCount(7);
  await expect(page.locator('.townDistrictIcon').first()).toBeHidden();

  const atlasBox = await page.locator('.townDistrictHotspot[data-district="atlas"]').boundingBox();
  const boardBox = await page.locator('.townDistrictHotspot[data-district="leaderboard"]').boundingBox();
  const wagonsBox = await page.locator('.townDistrictHotspot[data-district="house"]').boundingBox();
  expect(atlasBox).toBeTruthy();
  expect(boardBox).toBeTruthy();
  expect(wagonsBox).toBeTruthy();

  expect(atlasBox.x).toBeGreaterThan(800);
  expect(atlasBox.y).toBeLessThan(330);
  expect(boardBox.x).toBeGreaterThan(500);
  expect(boardBox.x).toBeLessThan(820);
  expect(wagonsBox.x).toBeGreaterThan(820);
  expect(wagonsBox.y).toBeGreaterThan(500);

  await expect(page.locator('.townDistrictHotspot[data-district="atlas"] .townDistrictLabel')).toHaveCSS('opacity', '0');
  await page.locator('.townDistrictHotspot[data-district="atlas"]').hover();
  await expect(page.locator('.townDistrictHotspot[data-district="atlas"] .townDistrictLabel')).not.toHaveCSS('opacity', '0');
});

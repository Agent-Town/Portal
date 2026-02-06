const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('camera controls, house detail card, and visible culling overlay work', async ({ page }) => {
  await page.goto('/world');
  await expect(page.getByTestId('world-status')).toContainText('Loaded');

  const zoomBefore = Number((await page.getByTestId('world-camera-zoom').innerText()).trim());

  const firstVisible = page.locator(
    '[data-testid="world-visible-house-list"] [data-testid^="world-visible-house-id-"]'
  ).first();
  await expect(firstVisible).toBeVisible();
  const firstVisibleTestId = await firstVisible.getAttribute('data-testid');
  expect(firstVisibleTestId).toBeTruthy();
  const firstVisibleHouseId = firstVisibleTestId.replace('world-visible-house-id-', '');

  await page.getByTestId(firstVisibleTestId).click();
  await expect(page.getByTestId('world-house-detail')).toContainText(firstVisibleHouseId);
  await page.waitForTimeout(300);
  const xBefore = Number((await page.getByTestId('world-camera-x').innerText()).trim());

  await page.getByTestId('world-pan-right').click();
  await expect
    .poll(async () => Number((await page.getByTestId('world-camera-x').innerText()).trim()))
    .toBeGreaterThan(xBefore);

  await page.getByTestId('world-zoom-in').click();
  await expect
    .poll(async () => Number((await page.getByTestId('world-camera-zoom').innerText()).trim()))
    .toBeGreaterThan(zoomBefore);

  for (let i = 0; i < 6; i += 1) {
    await page.getByTestId('world-pan-right').click();
  }
  await expect(page.getByTestId(`world-visible-house-id-${firstVisibleHouseId}`)).toHaveCount(0);
});

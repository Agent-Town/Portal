const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('isometric view loads and remains interactive', async ({ page }) => {
  await page.goto('/world?view=iso');
  await expect(page.getByTestId('world-status')).toContainText('Loaded');
  await expect(page.getByTestId('world-view-mode')).toHaveText('iso');

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
});

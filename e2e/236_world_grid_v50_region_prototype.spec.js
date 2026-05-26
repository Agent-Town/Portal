const { test, expect } = require('@playwright/test');
const { openWorldGrid, resetWorldGrid } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('V5.0 Region Grid smoke renders a gated Three.js region with DOM cell mirror', async ({ page }) => {
  await openWorldGrid(page, 'v50');
  await expect(page.locator('[data-world-grid-stage][data-renderer="three"]')).toBeVisible();
  await expect(page.locator('[data-world-grid-canvas]')).toBeVisible();

  const payload = await page.evaluate(() => window.__worldGridTest.getPayload());
  expect(payload?.region?.cells?.length).toBe(19);
  expect(payload?.region?.settlements?.[0]?.name).toBe('Founders Plot');

  const mirrorCells = page.locator('[data-world-grid-mirror] button');
  await expect(mirrorCells).toHaveCount(19);
  await mirrorCells.nth(1).focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('[data-world-grid-detail]')).toContainText(/Prairie|Ridge|River|Forest|Mesa/);
  await expect(page.getByRole('button', { name: 'Plan claim' })).toHaveCount(0);
  await expect(page.locator('[data-world-grid-public]')).toBeHidden();
  await expect(page.locator('[data-world-grid-services]')).toBeHidden();
  await expect(page.locator('[data-world-grid-events]')).toBeHidden();
  await expect(page.locator('[data-world-grid-sandbox]')).toBeHidden();

  const sceneInfo = await page.evaluate(() => window.__worldGridTest.getSceneInfo());
  expect(sceneInfo?.renderer).toBe('three');
  expect(sceneInfo?.cellCount).toBe(19);
});

test('V5.0 world-grid prototype is hidden without an explicit prototype flag', async ({ page }) => {
  await page.goto('/experiences/world-grid/index.html');

  await expect(page.getByText('The world grid prototype is hidden for this play session.')).toBeVisible();
  await expect(page.locator('[data-world-grid-stage][data-renderer="blocked"]')).toBeVisible();
});

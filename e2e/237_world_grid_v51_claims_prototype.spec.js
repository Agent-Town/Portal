const { test, expect } = require('@playwright/test');
const { openSeededWorldGrid, resetWorldGrid } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('V5.1 Territory Claims and Settler Routes smoke plans and completes one claim', async ({ page }) => {
  await openSeededWorldGrid(page, 'v50,v51');

  await page.getByRole('button', { name: /Future claim option/ }).first().click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText(/Cost:/);
  await expect(page.locator('[data-world-grid-detail]')).toContainText(/Benefit:/);

  await page.getByRole('button', { name: 'Plan claim' }).click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Claim status: planned');

  await page.getByRole('button', { name: 'Complete claim' }).click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Claim status: claimed');

  const payload = await page.evaluate(() => window.__worldGridTest.getPayload());
  expect(payload?.region?.routes?.some((route) => route.status === 'open')).toBe(true);
  await expect(page.locator('[data-world-grid-public]')).toBeHidden();
  await expect(page.locator('[data-world-grid-services]')).toBeHidden();
});

const { test, expect } = require('@playwright/test');
const { openSeededWorldGrid, resetWorldGrid } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('V5.3 Civic Service Advice Prototype smoke redacts inputs and applies advice only', async ({ page }) => {
  await openSeededWorldGrid(page, 'v50,v53');

  await expect(page.getByRole('heading', { name: 'Civic Services' })).toBeVisible();
  await expect(page.locator('[data-world-grid-services-list]')).toContainText('Route Advisor');
  await page.getByRole('button', { name: 'Request advice' }).first().click();

  const result = page.locator('[data-world-grid-service-result]');
  await expect(result).toContainText(/Prioritize|Draft/);
  await expect(result).toContainText('public-safe');
  await expect(result).not.toContainText('must redact');

  await page.getByRole('button', { name: 'Accept result' }).click();
  await expect(result).toContainText('Accepted as advice only. No world mutation was applied.');
  await expect(page.locator('[data-world-grid-events]')).toBeHidden();
  await expect(page.locator('[data-world-grid-sandbox]')).toBeHidden();
});

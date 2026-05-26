const { test, expect } = require('@playwright/test');
const { openSeededWorldGrid, resetWorldGrid } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('V5.4 World Events and Public Works smoke previews, contributes, and claims cosmetic reward', async ({ page }) => {
  await openSeededWorldGrid(page, 'v50,v54');

  await expect(page.getByRole('heading', { name: 'World Event' })).toBeVisible();
  await expect(page.locator('[data-world-grid-events-list]')).toContainText('Great Ridge Bridge');

  await page.getByRole('button', { name: 'Preview contribution' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Preview: 1 coin accepted for today.');

  await page.getByRole('button', { name: 'Contribute 1 coin' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Contributed 1 coin to the public works event.');
  await expect(page.locator('[data-world-grid-events-list]')).toContainText('Your contribution: 1 coin');

  await page.getByRole('button', { name: 'Claim badge' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Cosmetic status only; no resource mutation was applied.');
  await expect(page.locator('[data-world-grid-public]')).toBeHidden();
  await expect(page.locator('[data-world-grid-services]')).toBeHidden();
});

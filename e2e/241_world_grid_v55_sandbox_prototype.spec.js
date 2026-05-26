const { test, expect } = require('@playwright/test');
const { openSeededWorldGrid, resetWorldGrid } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('V5.5 Controlled Free-Play Sandbox Districts smoke moderates and rolls back typed actions', async ({ page }) => {
  await openSeededWorldGrid(page, 'v50,v55');

  await expect(page.getByRole('heading', { name: 'Sandbox District' })).toBeVisible();
  await expect(page.locator('[data-world-grid-sandbox-state]')).toContainText('Public Commons Sandbox');

  await page.getByRole('button', { name: 'Enter sandbox' }).click();
  await expect(page.locator('[data-world-grid-sandbox-result]')).toContainText(/Entered as Visitor/);

  await page.getByRole('button', { name: 'Place lantern' }).click();
  await expect(page.locator('[data-world-grid-sandbox-result]')).toContainText('Lantern placed with rollback snapshot.');

  await page.getByRole('button', { name: 'Place forbidden prop' }).click();
  await expect(page.locator('[data-world-grid-sandbox-result]')).toContainText('Moderation rejected that sandbox action.');

  await page.getByRole('button', { name: 'Agent demo' }).click();
  await expect(page.locator('[data-world-grid-sandbox-result]')).toContainText('Agent demo used a typed sandbox action.');

  await page.getByRole('button', { name: 'Rollback last action' }).click();
  await expect(page.locator('[data-world-grid-sandbox-result]')).toContainText('Rollback restored the sandbox district.');

  await page.getByRole('button', { name: 'Leave sandbox' }).click();
  await expect(page.locator('[data-world-grid-sandbox-result]')).toContainText('Left the sandbox without private town mutation.');
  await expect(page.locator('[data-world-grid-events]')).toBeHidden();
});

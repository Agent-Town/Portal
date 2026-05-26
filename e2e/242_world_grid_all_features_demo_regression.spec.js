const { test, expect } = require('@playwright/test');
const { openSeededWorldGrid, resetWorldGrid } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('world-grid all-features demo regression keeps the V5 prototype path working', async ({ page }) => {
  await openSeededWorldGrid(page, 'all');
  await expect(page.locator('[data-world-grid-stage][data-renderer="three"]')).toBeVisible();
  await expect(page.locator('[data-world-grid-canvas]')).toBeVisible();

  const payload = await page.evaluate(() => window.__worldGridTest.getPayload());
  expect(payload?.region?.cells?.length).toBe(19);

  await page.getByRole('button', { name: /Future claim option/ }).first().click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText(/Cost:/);
  await page.getByRole('button', { name: 'Plan claim' }).click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Claim status: planned');
  await page.getByRole('button', { name: 'Complete claim' }).click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Claim status: claimed');

  const claimedPayload = await page.evaluate(() => window.__worldGridTest.getPayload());
  expect(claimedPayload?.region?.routes?.some((route) => route.status === 'open')).toBe(true);

  await page.getByRole('button', { name: 'Opt in public town card' }).click();
  await expect(page.locator('[data-world-grid-public-list]')).toContainText('Founders Plot');
  await page.getByRole('button', { name: 'Opt out' }).click();
  await expect(page.locator('[data-world-grid-public-list]')).toContainText('No public neighbors yet.');

  await expect(page.getByRole('heading', { name: 'Civic Services' })).toBeVisible();
  await page.getByRole('button', { name: 'Request advice' }).first().click();
  await expect(page.locator('[data-world-grid-service-result]')).toContainText('public-safe');
  await page.getByRole('button', { name: 'Accept result' }).click();
  await expect(page.locator('[data-world-grid-service-result]')).toContainText('Accepted as advice only. No world mutation was applied.');

  await expect(page.getByRole('heading', { name: 'World Event' })).toBeVisible();
  await page.getByRole('button', { name: 'Preview contribution' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Preview: 1 coin accepted for today.');
  await page.getByRole('button', { name: 'Contribute 1 coin' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Contributed 1 coin to the public works event.');
  await page.getByRole('button', { name: 'Claim badge' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Cosmetic status only; no resource mutation was applied.');

  await expect(page.getByRole('heading', { name: 'Sandbox District' })).toBeVisible();
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

  const sceneInfo = await page.evaluate(() => window.__worldGridTest.getSceneInfo());
  expect(sceneInfo?.renderer).toBe('three');
  expect(sceneInfo?.cellCount).toBe(19);
});

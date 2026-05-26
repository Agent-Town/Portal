const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('V5.0 world-grid prototype renders a gated Three.js region with DOM cell mirror', async ({ page }) => {
  await page.goto('/experiences/world-grid/index.html?worldGridFeatureFlags=all');

  await expect(page.getByText('Territory survey ready')).toBeVisible();
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
  await page.getByRole('button', { name: /Future claim option/ }).first().click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText(/Cost:/);
  await expect(page.locator('[data-world-grid-detail]')).toContainText(/Benefit:/);
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
  await expect(page.locator('[data-world-grid-services-list]')).toContainText('Route Advisor');
  await page.getByRole('button', { name: 'Request advice' }).first().click();
  await expect(page.locator('[data-world-grid-service-result]')).toContainText(/Prioritize|Draft/);
  await expect(page.locator('[data-world-grid-service-result]')).toContainText('public-safe');
  await page.getByRole('button', { name: 'Accept result' }).click();
  await expect(page.locator('[data-world-grid-service-result]')).toContainText('Accepted as advice only. No world mutation was applied.');

  await expect(page.getByRole('heading', { name: 'World Event' })).toBeVisible();
  await expect(page.locator('[data-world-grid-events-list]')).toContainText('Great Ridge Bridge');
  await page.getByRole('button', { name: 'Preview contribution' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Preview: 1 coin accepted for today.');
  await page.getByRole('button', { name: 'Contribute 1 coin' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Contributed 1 coin to the public works event.');
  await expect(page.locator('[data-world-grid-events-list]')).toContainText('Your contribution: 1 coin');
  await page.getByRole('button', { name: 'Claim badge' }).click();
  await expect(page.locator('[data-world-grid-event-result]')).toContainText('Cosmetic status only; no resource mutation was applied.');

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

  const sceneInfo = await page.evaluate(() => window.__worldGridTest.getSceneInfo());
  expect(sceneInfo?.renderer).toBe('three');
  expect(sceneInfo?.cellCount).toBe(19);
});

test('V5.0 world-grid prototype is hidden without an explicit prototype flag', async ({ page }) => {
  await page.goto('/experiences/world-grid/index.html');

  await expect(page.getByText('The world grid prototype is hidden for this play session.')).toBeVisible();
  await expect(page.locator('[data-world-grid-stage][data-renderer="blocked"]')).toBeVisible();
});

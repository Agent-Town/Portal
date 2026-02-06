const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function readHouseIds(page) {
  return page
    .locator('[data-testid="world-house-list"] [data-testid^="world-house-id-"]')
    .allInnerTexts();
}

test('world loads for visitors with deterministic house rendering', async ({ page }) => {
  await page.goto('/world');

  await expect(page.getByTestId('world-title')).toHaveText('Agent Town World');
  await expect(page.getByTestId('world-status')).toContainText('Loaded');

  const houseCount = Number((await page.getByTestId('world-house-count').innerText()).trim());
  expect(houseCount).toBeGreaterThan(0);

  const firstPass = await readHouseIds(page);
  expect(firstPass.length).toBe(houseCount);

  await page.reload();
  await expect(page.getByTestId('world-status')).toContainText('Loaded');

  const secondPass = await readHouseIds(page);
  expect(secondPass).toEqual(firstPass);
});

test('world snapshot rejects unknown instances', async ({ request }) => {
  const resp = await request.get('/api/world/snapshot?instance=unknown');
  expect(resp.status()).toBe(400);
  const body = await resp.json();
  expect(body).toEqual({ ok: false, error: 'INVALID_INSTANCE' });
});

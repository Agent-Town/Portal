const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('house detail displays inhabitant counts and labels', async ({ page }) => {
  await page.goto('/world');
  await expect(page.getByTestId('world-status')).toContainText('Loaded');

  await page.getByTestId('world-house-id-H_008').click();
  await expect(page.getByTestId('world-house-detail')).toContainText('Inhabitants: 2');
  await expect(page.getByTestId('world-house-detail')).toContainText('Story Curator');
  await expect(page.getByTestId('world-house-detail')).toContainText('Audience Bot');
});

test('projection refresh updates world without hard reload', async ({ page, request }) => {
  await page.goto('/world');
  await expect(page.getByTestId('world-status')).toContainText('Loaded');

  const before = Number((await page.getByTestId('world-house-count').innerText()).trim());

  const upsert = await request.post('/__test__/world/upsert', {
    data: {
      instance: 'public',
      house: {
        houseId: 'H_999',
        type: 'experience',
        name: 'Test Lodge',
        instanceTags: ['test'],
        coord: { x: 2200, y: 900 },
        spriteKey: 'house.placeholder.test.v1',
        updatedAt: '2026-02-06T12:00:00.000Z'
      },
      inhabitants: [
        {
          inhabitantId: 'I_999',
          houseId: 'H_999',
          label: 'Test Bot',
          role: 'agent',
          spriteKey: 'inhabitant.placeholder.test.v1',
          updatedAt: '2026-02-06T12:00:00.000Z'
        }
      ]
    }
  });
  expect(upsert.ok()).toBeTruthy();

  await expect
    .poll(async () => Number((await page.getByTestId('world-house-count').innerText()).trim()))
    .toBe(before + 1);

  await expect(page.getByTestId('world-house-id-H_999')).toBeVisible();
  await page.getByTestId('world-house-id-H_999').click();
  await expect(page.getByTestId('world-house-detail')).toContainText('Test Bot');
});

test('house endpoint returns typed 404 for unknown id', async ({ request }) => {
  const resp = await request.get('/api/world/houses/H_MISSING');
  expect(resp.status()).toBe(404);
  const body = await resp.json();
  expect(body).toEqual({ ok: false, error: 'NOT_FOUND' });
});

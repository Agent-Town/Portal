const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('special house interactions return events, enforce cooldown, and reject invalid targets', async ({ page }) => {
  await page.goto('/world');
  await page.getByTestId('world-join-btn').click();
  await expect(page.getByTestId('world-realtime-status')).toContainText('Connected');

  const targetId = await page.getByTestId('world-interact-target').inputValue();
  expect(targetId).toBeTruthy();

  await page.getByTestId('world-interact-btn').click();
  await expect(page.getByTestId('world-interaction-log')).toContainText(`interacted with ${targetId}`);

  await page.getByTestId('world-interact-btn').click();
  await expect(page.getByTestId('world-interaction-log')).toContainText('COOLDOWN');

  await page.evaluate(() => {
    window.__worldDebug.sendRawInteractIntent({ targetType: 'house', targetId: 'H_NOT_IN_INSTANCE' });
  });
  await expect(page.getByTestId('world-interaction-log')).toContainText('TARGET_NOT_IN_INSTANCE');
});

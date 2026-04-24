const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Brain Quick Connect saves free OpenRouter config as Preview Clover, not Real Clover', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('brain-quick-provider').selectOption('openrouter');
  await frame.getByTestId('brain-quick-model').fill('nvidia/nemotron-3-super-120b-a12b:free');
  await frame.getByTestId('brain-quick-key').fill('or-test-key');
  await frame.getByTestId('brain-quick-save').click();

  await expect.poll(async () => {
    return await frame.evaluate(() => window.__foundersPlotTest.getBrainStatus().configured);
  }, { timeout: 5000 }).toBe(true);
  await expect.poll(async () => {
    return await frame.evaluate(() => window.__foundersPlotTest.getBrainStatus().quality);
  }, { timeout: 5000 }).toBe('preview');
  await expect(frame.getByTestId('foreman-start-btn')).toHaveText('Upgrade Brain');
  await expect(frame.getByTestId('founders-foreman-status')).toContainText('Preview Clover');
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeDisabled();
});

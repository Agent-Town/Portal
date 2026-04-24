const { test, expect } = require('@playwright/test');
const {
  bootstrapToHq2,
  getOpenFoundersPlotFrame,
  getPlotState
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Town Hall invite appears after progression but does not block Founders Plot', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  await bootstrapToHq2(frame);
  await expect(frame.getByTestId('townhall-official-invite')).toBeVisible();
  const state = await getPlotState(frame);
  expect(state?.plot?.hqLevel).toBe(2);
  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();
});

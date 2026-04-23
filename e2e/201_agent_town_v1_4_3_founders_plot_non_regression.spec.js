const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Founders Plot remains on the accepted Clover-first gameplay surface', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();
  await expect(frame.getByTestId('founders-clover-avatar')).toBeVisible();
  await expect(frame.getByTestId('founders-clover-avatar').locator('img')).toHaveAttribute('src', /clover-/);
  await expect(frame.getByTestId('founders-stage-object-HQ')).toBeVisible();
});

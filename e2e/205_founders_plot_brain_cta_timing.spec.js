const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame, placeFirstLumberCamp } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Brain CTA is contextual, not blocking before first play action', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  await expect(frame.getByTestId('brain-quick-connect-sheet')).toBeHidden();
  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible();

  const placed = await placeFirstLumberCamp(frame, 'v144-cta-timing');
  expect(placed?.ok).toBe(true);

  await frame.getByTestId('founders-clover-avatar').click();
  await expect(frame.getByTestId('brain-quick-connect-sheet')).toBeVisible();
  await frame.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible();
});

const { test, expect } = require('@playwright/test');
const {
  getOpenFoundersPlotFrame,
  getPlotState,
  placeFirstLumberCamp
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('real Clover controls are Brain-gated while manual actions keep working', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  await frame.getByTestId('founders-clover-avatar').click();
  await expect(frame.getByTestId('foreman-start-btn')).toHaveText('Connect a Brain');
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeDisabled();
  await expect(frame.getByTestId('scheduler-collect-toggle')).toBeDisabled();
  await expect(frame.getByTestId('brain-quick-connect-sheet')).toBeVisible();

  const bodyText = await frame.locator('body').innerText();
  expect(bodyText).not.toMatch(/LLM not configured|runtime missing|provider error|NO_SOLANA_WALLET/i);

  const placed = await placeFirstLumberCamp(frame, 'v144-brain-gated-manual');
  expect(placed?.ok).toBe(true);
  const state = await getPlotState(frame);
  expect(state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP')).toBe(true);
});

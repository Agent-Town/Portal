const { test, expect } = require('@playwright/test');
const {
  getJson,
  getOpenFoundersPlotFrame,
  getPlotState,
  placeFirstLumberCamp
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('manual first loop works without Brain and remains human-attributed', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  await frame.getByTestId('founders-clover-avatar').click();
  await expect(frame.getByTestId('founders-foreman-status')).toContainText('Manual Founder Mode');
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeDisabled();

  const placed = await placeFirstLumberCamp(frame, 'v144-manual-loop');
  expect(placed?.ok).toBe(true);

  const state = await getPlotState(frame);
  expect(state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP')).toBe(true);

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  expect(events.some((event) => event?.actor === 'HUMAN')).toBe(true);
  expect(events.some((event) => event?.actor === 'AGENT')).toBe(false);
});

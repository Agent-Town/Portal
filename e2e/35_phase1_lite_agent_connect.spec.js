const { test, expect } = require('@playwright/test');
const { fetchSessionState } = require('./helpers/phase1');
const { hatchAndConnectLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('after setup, the in-browser OpenClaw Lite agent is connected in state', async ({ page }) => {
  await hatchAndConnectLite(page, 'signin');
  await expect.poll(async () => {
    const state = await fetchSessionState(page);
    return !!state?.agent?.connected;
  }, { timeout: 10000 }).toBe(true);

  const state = await fetchSessionState(page);
  expect(state.agent?.connected).toBe(true);
  expect(state.agent?.source).toBe('openclaw-lite');
});

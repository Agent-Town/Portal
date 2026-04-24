const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const forbidden = /LLM not configured|runtime missing|provider error|NO_SOLANA_WALLET|agent\.panel\.|onboarding\.required|ERC-8004 required/i;

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('play-first normal route does not expose raw provider, runtime, wallet, or localization jargon', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);
  await frame.getByTestId('founders-clover-avatar').click();

  const shellText = await page.locator('body').innerText();
  const frameText = await frame.locator('body').innerText();
  expect(shellText).not.toMatch(forbidden);
  expect(frameText).not.toMatch(forbidden);
});

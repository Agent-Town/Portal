const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('play-first entry opens Founders Plot without Town Hall, Brain, Sigil, or Ceremony blockers', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  await expect(page.locator('#districtModalTitle')).toHaveText('Founders Plot');
  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();
  await expect(frame.getByTestId('founders-current-goal')).toBeVisible();
  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible();
  await expect(page.locator('#townhallRegisterPanel')).toHaveCount(0);
  await expect(page.locator('.onboarding-stepper')).toHaveCount(0);
  await expect(frame.getByText('Manual Founder Mode')).toBeHidden();
});

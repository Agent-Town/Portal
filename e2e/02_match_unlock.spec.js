const { test, expect } = require('@playwright/test');
const { enterHatch, completeHatch, configureLiteLlm, ensureLiteConnected } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent can connect and match the human sigil to unlock', async ({ page }) => {
  await enterHatch(page, 'signin');
  await completeHatch(page);
  await configureLiteLlm(page, {
    provider: 'test-local',
    model: 'deterministic',
    apiKey: 'legacy-02-key'
  });
  await ensureLiteConnected(page);

  // Human selects the cookie sigil; vendor runtime mirrors via agent-select.
  await page.getByTestId('sigil-cookie').click();

  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');
  await expect(page.getByTestId('open-btn')).toBeEnabled();
});

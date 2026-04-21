const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent drawer starts minimized with debug hidden and brain sync avoids legacy llm config route errors', async ({ page }) => {
  const consoleIssues = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    consoleIssues.push({ type, text: msg.text() });
  });

  await page.goto('/app');

  const panel = page.getByTestId('agent-panel');
  await expect(panel).toBeVisible({ timeout: 1500 });
  await expect(panel).toHaveClass(/minimized/);
  await expect(panel).toHaveClass(/debug-collapsed/);

  await hatchAndConnectLite(page, 'signup');

  const llmSyncIssues = consoleIssues.filter((entry) => {
    return entry.text.includes('/api/agent/lite/llm/config')
      || entry.text.includes('onboarding brain completion failed');
  });
  expect(llmSyncIssues).toEqual([]);
});

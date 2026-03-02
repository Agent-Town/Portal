const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent debug worker tools pane shows trainer namespace plugin additions without duplicate trainer tools', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/app?liteDriver=phase1&trainerNamespace=1');
  await page.waitForFunction(() => !!window.__openclawLiteTest, null, { timeout: 10000 });
  await page.evaluate(async () => {
    await window.__openclawLiteTest.visitExperience({ url: '/skill.md' }).catch(() => null);
  });

  await page.getByTestId('agent-debug-tab-tools').click();
  await page.locator('#agentDebugRefreshBtn').click();

  const toolsPane = page.getByTestId('agent-debug-tools');
  await expect(toolsPane).toContainText('Trainer namespace tools (plugin additions):', { timeout: 8000 });
  await expect(toolsPane).toContainText('Trainer namespace tools (plugin additions): 0', { timeout: 8000 });
});

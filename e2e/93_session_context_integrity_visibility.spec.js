const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('session context tab includes plugin skill-action diagnostics and integrity snapshot', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/app?liteDriver=phase1');
  await page.waitForFunction(() => !!window.__openclawLiteTest, null, { timeout: 10000 });

  await page.evaluate(async () => {
    await window.__openclawLiteTest.visitExperience({ url: '/skill.md' });
  });

  await page.getByTestId('agent-debug-tab-session').click();
  await page.locator('#agentDebugRefreshBtn').click();

  const sessionPane = page.getByTestId('agent-debug-session');
  await expect(sessionPane).toContainText('Transcript integrity (repair-sensitive):', { timeout: 8000 });
  await expect(sessionPane).toContainText('Skill action plugin diagnostics:', { timeout: 8000 });
  await expect(sessionPane).toContainText('"actionCount"', { timeout: 8000 });
});

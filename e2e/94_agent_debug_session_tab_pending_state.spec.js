const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('session context tab stays interactive while /api/state is still pending', async ({ page }) => {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        config: null,
        startPageEnabled: false,
        appPath: '/app',
      }),
    });
  });

  await page.route('**/api/state', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 15000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        teamCode: 'TEAM-WAIT-STATE',
        elements: [],
        lite: { driver: 'vendor' },
        agent: { connected: false, source: null },
        human: { selected: null },
        match: { matched: false },
        signup: { complete: false, mode: null },
        share: { id: null },
        experience: { step: 'connect_agent', nextAgentAction: '' },
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/app');
  const sessionTab = page.getByTestId('agent-debug-tab-session');
  await expect(sessionTab).toBeVisible({ timeout: 5000 });
  await expect(sessionTab).toHaveAttribute('data-bound', '1', { timeout: 5000 });

  await sessionTab.click();
  await expect(page.locator('#agentDebugPanelSession')).not.toHaveClass(/is-hidden/, { timeout: 2000 });
  await expect(page.locator('#agentDebugPanelTools')).toHaveClass(/is-hidden/, { timeout: 2000 });
  await expect(page.getByTestId('agent-debug-session')).toContainText(
    /(Loading session context\.\.\.|Worker session context \(authoritative for LLM input\):)/,
    { timeout: 3000 }
  );
});

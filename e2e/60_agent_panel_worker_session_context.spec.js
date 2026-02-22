const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent panel session tab shows worker-authored llm session context', async ({ page }) => {
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

  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/app');
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 3000 });

  await page.getByTestId('agent-debug-tab-session').click();
  await expect(page.getByTestId('agent-debug-session')).toContainText(
    'Worker session context (authoritative for LLM input):',
    { timeout: 8000 }
  );
  await expect(page.getByTestId('agent-debug-session')).toContainText('Runtime session context (authoritative):', {
    timeout: 8000,
  });

  await expect(page.getByTestId('agent-debug-session')).toContainText('"combinedContext"', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-session')).toContainText('"runtimeContext"', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-session')).toContainText('Transcript integrity (repair-sensitive):', {
    timeout: 8000,
  });

  await page.evaluate(async () => {
    const mod = await import('/openclaw-lite/gateway.js');
    const gateway = await (mod.default || mod);
    if (!gateway || typeof gateway.experienceRun !== 'function') return;
    await gateway.experienceRun({
      prompt: 'Read workspace/SKILL.md and execute next safe step.',
      timeoutMs: 20000,
      recordToTranscript: false,
      emitChat: false,
      runtimeContext: { origin: window.location.origin },
      runtimeState: null,
    }).catch(() => null);
  });

  await page.locator('#agentDebugRefreshBtn').click();
  await expect(page.getByTestId('agent-debug-session')).toContainText('"source": "gateway.command.experience.run"', {
    timeout: 8000,
  });
  await expect(page.getByTestId('agent-debug-session')).toContainText('"promptTextChars"', { timeout: 8000 });
});

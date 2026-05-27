const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const civicToolPattern = /et\.world\.civic\./i;

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openDebugPane(page) {
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 3000 });
  const debugPane = page.getByTestId('agent-debug-pane');
  if (!(await debugPane.isVisible())) {
    await page.getByTestId('agent-debug-toggle').click();
  }
  await expect(debugPane).toBeVisible({ timeout: 3000 });
}

test('M6 worker runtime smoke keeps civic tools absent while worker observability is available', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
    localStorage.setItem('agentTown:panel:debugVisible', '1');
  });

  await page.goto('/app?worldGridFeatureFlags=all,v60');
  await openDebugPane(page);

  await expect(page.getByTestId('agent-debug-tools')).toContainText('Worker tools count', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-tools')).not.toContainText(civicToolPattern);

  await page.getByTestId('agent-debug-tab-skill').click();
  await expect(page.getByTestId('agent-debug-panel-skill')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-skill')).toContainText('Skill import status', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-skill')).not.toContainText(civicToolPattern);

  await page.getByTestId('agent-debug-tab-traffic').click();
  await expect(page.getByTestId('agent-debug-panel-traffic')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-traffic-meta')).toBeVisible();
  await expect(page.getByTestId('agent-debug-traffic')).not.toContainText(civicToolPattern);

  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('lite-llm-panel')).toBeVisible();

  await page.getByTestId('agent-debug-tab-session').click();
  await expect(page.getByTestId('agent-debug-panel-session')).not.toHaveClass(/is-hidden/);
  await expect(page.getByTestId('agent-debug-session')).toContainText('"runtimeState"', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-session')).not.toContainText(civicToolPattern);

  const toolsResponse = await request.get('/api/world/tools?worldGridFeatureFlags=all,v60');
  expect(toolsResponse.status()).toBe(200);
  const toolsBody = await toolsResponse.json();
  const toolNames = Array.isArray(toolsBody.tools) ? toolsBody.tools.map((tool) => String(tool.name || '')) : [];
  expect(toolNames.some((name) => civicToolPattern.test(name))).toBe(false);
});

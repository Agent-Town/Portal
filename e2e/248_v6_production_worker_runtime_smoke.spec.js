const { test, expect } = require('@playwright/test');

const civicToolPattern = /et\.world\.civic\./i;

async function openDebugPane(page) {
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 3000 });
  const debugPane = page.getByTestId('agent-debug-pane');
  if (!(await debugPane.isVisible())) {
    await page.getByTestId('agent-debug-toggle').click();
  }
  await expect(debugPane).toBeVisible({ timeout: 3000 });
}

test('production worker runtime keeps observability available without civic tools', async ({ page, request }) => {
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

  const toolsResponse = await request.get('/api/world/tools?worldGridFeatureFlags=all,v60', {
    headers: { 'x-world-grid-feature-flags': 'all,v60' }
  });
  expect(toolsResponse.status()).toBe(200);
  const toolsBody = await toolsResponse.json();
  const toolNames = Array.isArray(toolsBody.tools) ? toolsBody.tools.map((tool) => String(tool.name || '')) : [];
  expect(toolsBody.featureFlags.FEATURE_WORLD_GRID_V50_REGION).toBe(true);
  expect(toolsBody.featureFlags.FEATURE_WORLD_V60_AGENT_CIVILIZATION).toBe(false);
  expect(toolNames.some((name) => civicToolPattern.test(name))).toBe(false);
});

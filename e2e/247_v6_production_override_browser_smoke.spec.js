const { test, expect } = require('@playwright/test');

const civicToolPattern = /^et\.world\.civic\./;
const forbiddenSurfaceText = /V6 Agent Civilization|v6-research-lab|et\.world\.civic|Civic proposal|Civic vote/i;
const forbiddenSurfaceSelectors = [
  '[data-v6-lab]',
  '#v6-research-lab',
  '[data-modal-id="v6-research-lab"]'
].join(', ');

test('production player overrides cannot expose V6 civic tools or lab surfaces', async ({ page, request }) => {
  const toolsResponse = await request.get('/api/world/tools?worldGridFeatureFlags=all,v60', {
    headers: { 'x-world-grid-feature-flags': 'all,v60' }
  });
  expect(toolsResponse.status()).toBe(200);
  const toolsBody = await toolsResponse.json();
  const toolNames = Array.isArray(toolsBody.tools) ? toolsBody.tools.map((tool) => String(tool.name || '')) : [];

  expect(toolsBody.featureFlags.FEATURE_WORLD_GRID_V50_REGION).toBe(true);
  expect(toolsBody.featureFlags.FEATURE_WORLD_V60_AGENT_CIVILIZATION).toBe(false);
  expect(toolNames.some((name) => civicToolPattern.test(name))).toBe(false);

  await page.goto('/app?worldGridFeatureFlags=all,v60&v6Lab=1');
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(forbiddenSurfaceText);
  await expect(page.locator(forbiddenSurfaceSelectors)).toHaveCount(0);
});

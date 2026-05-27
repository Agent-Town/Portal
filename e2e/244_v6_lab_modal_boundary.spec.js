const { test, expect } = require('@playwright/test');
const { V6_LAB_STANDALONE_PATHS } = require('../server/world_civilization/lab_surface');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const forbiddenSurfaceText = /V6 Agent Civilization|v6-research-lab|et\.world\.civic|Civic proposal|Civic vote/i;
const forbiddenSurfaceSelectors = [
  '[data-v6-lab]',
  '#v6-research-lab',
  '[data-modal-id="v6-research-lab"]'
].join(', ');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function expectNoV6LabSurface(page) {
  await expect(page.locator('body')).not.toContainText(forbiddenSurfaceText);
  await expect(page.locator(forbiddenSurfaceSelectors)).toHaveCount(0);
}

test('M15 standalone V6 lab paths redirect to the town hub without rendering V6 content', async ({ page, request }) => {
  for (const standalonePath of V6_LAB_STANDALONE_PATHS) {
    const response = await request.get(standalonePath, { maxRedirects: 0 });
    expect(redirectStatuses.has(response.status()), `${standalonePath} should redirect`).toBe(true);
    expect(response.headers().location).toBe('/app');

    await page.goto(standalonePath);
    await expect(page).toHaveURL(/\/app$/);
    await expectNoV6LabSurface(page);
  }
});

test('M15 normal gameplay keeps V6 lab and civic runtime details hidden by default', async ({ page, request }) => {
  await page.goto('/app?worldGridFeatureFlags=all,v60');
  await expect(page).toHaveURL(/\/app\?worldGridFeatureFlags=all(%2C|,)v60$/);
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(0);
  await expectNoV6LabSurface(page);

  const toolsResponse = await request.get('/api/world/tools?worldGridFeatureFlags=all,v60');
  expect(toolsResponse.status()).toBe(200);
  const toolsBody = await toolsResponse.json();
  const toolNames = Array.isArray(toolsBody.tools) ? toolsBody.tools.map((tool) => tool.name) : [];
  expect(toolNames.some((name) => String(name || '').startsWith('et.world.civic.'))).toBe(false);
});

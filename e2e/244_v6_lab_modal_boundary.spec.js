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

test('M15 internal V6 lab opens only as a non-executing town hub modal', async ({ page, request }, testInfo) => {
  const widths = [390, 768, 1280];

  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/app?v6Lab=1&worldGridFeatureFlags=v60');

    const lab = page.locator('#v6-research-lab');
    await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toBeVisible();
    await expect(page.locator('[data-modal-id="v6-research-lab"]')).toHaveCount(1);
    await expect(lab).toBeVisible();
    await expect(lab).toHaveAttribute('data-execution-status', 'not_executable');
    await expect(lab.getByText('Research-only')).toBeVisible();
    await expect(lab.getByText('Non-executing', { exact: true })).toBeVisible();
    await expect(lab.getByRole('tab', { name: 'Readiness' })).toBeVisible();
    await expect(lab.getByRole('tab', { name: 'Audit Ledger' })).toBeVisible();
    await expect(lab).not.toContainText(/et\.world\.civic/i);

    const box = await lab.boundingBox();
    expect(box, `lab bounds at ${width}px`).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.width).toBeLessThanOrEqual(width);

    await page.keyboard.press('Tab');
    const focusInsideModal = await page.evaluate(() => {
      const active = document.activeElement;
      return !!active && !!active.closest('#districtModalBackdrop');
    });
    expect(focusInsideModal).toBe(true);

    await page.screenshot({
      path: testInfo.outputPath(`v6-lab-modal-${width}.png`),
      fullPage: true
    });
  }

  const planResponse = await request.get('/api/world/civilization/lab/launch-plan?v6Lab=1&worldGridFeatureFlags=v60&requestPath=%2Fapp');
  expect(planResponse.status()).toBe(200);
  const planBody = await planResponse.json();
  expect(planBody.ok).toBe(true);
  expect(planBody.launchPlan.allowed).toBe(true);
  expect(planBody.launchPlan.executionStatus).toBe('not_executable');
  expect(planBody.launchPlan.effects.executesCivicEffect).toBe(false);

  const toolsResponse = await request.get('/api/world/tools?worldGridFeatureFlags=all,v60');
  expect(toolsResponse.status()).toBe(200);
  const toolsBody = await toolsResponse.json();
  const toolNames = Array.isArray(toolsBody.tools) ? toolsBody.tools.map((tool) => tool.name) : [];
  expect(toolNames.some((name) => String(name || '').startsWith('et.world.civic.'))).toBe(false);
});

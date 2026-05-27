const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');
const { openWorldGrid, resetWorldGrid, worldGridApi } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

async function publicPlotCount(page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/public', { credentials: 'include' });
    const body = await response.json().catch(() => null);
    return Array.isArray(body?.plots) ? body.plots.length : -1;
  });
}

test('V5 player route creates the Founders Plot prerequisite before World Grid mutations', async ({ page }) => {
  await openWorldGrid(page, 'v50,v51');
  expect(await publicPlotCount(page)).toBe(0);

  const initialWorld = await page.evaluate(() => window.__worldGridTest.getPayload());
  const claimOption = initialWorld?.territory?.claimOptions?.[0];
  expect(claimOption?.cellId).toBeTruthy();

  const rejected = await worldGridApi(page, '/api/world/territory/plan-claim', {
    method: 'POST',
    flags: 'v50,v51',
    body: {
      cellId: claimOption.cellId,
      idempotencyKey: 'player_route_missing_plot_claim'
    }
  });
  expect(rejected.status).toBe(409);
  expect(rejected.body?.error?.code).toBe('WORLD_GRID_PLOT_REQUIRED');
  expect(await publicPlotCount(page)).toBe(0);

  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);
  const plotState = await frame.evaluate(() => window.__foundersPlotTest.getState()?.state || null);
  expect(plotState?.plot?.plotId).toBeTruthy();
  expect(plotState?.buildings?.some((building) => building?.type === 'HQ')).toBe(true);
  expect(await publicPlotCount(page)).toBe(1);

  await openWorldGrid(page, 'v50,v51');
  await page.getByRole('button', { name: /Future claim option/ }).first().click();
  await page.getByRole('button', { name: 'Plan claim' }).click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Claim status: planned');

  const claimedWorld = await page.evaluate(() => window.__worldGridTest.getPayload());
  expect(claimedWorld?.territory?.claims?.length).toBe(1);

  const tools = await worldGridApi(page, '/api/world/tools', { flags: 'v50,v51' });
  expect(tools.body?.tools?.some((tool) => String(tool?.name || '').startsWith('et.world.civic.'))).toBe(false);
});

const { test, expect } = require('@playwright/test');
const {
  getOpenFoundersPlotFrame,
  getPlotState
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openFoundersPlotWithFlags(page, flags) {
  const params = new URLSearchParams({
    district: 'founders-plot',
    entry: 'play-first',
    foundersFeatureFlags: flags
  });
  await page.goto(`/app?${params.toString()}`);
  return await getOpenFoundersPlotFrame(page);
}

test('V1.5-only mode hides future state, scene objects, drawers, tools, and mutations', async ({ page }) => {
  const frame = await openFoundersPlotWithFlags(page, 'none');
  const state = await getPlotState(frame);
  expect(state?.featureFlags?.FEATURE_FOUNDERS_V16_SCENARIOS).toBe(false);
  expect(state?.featureFlags?.FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS).toBe(false);

  expect(state?.scenarios).toBeUndefined();
  expect(state?.settlements).toBeUndefined();
  expect(state?.operatingModel).toBeUndefined();
  expect(state?.regionalNetwork).toBeUndefined();
  expect(state?.creatorExtensions).toBeUndefined();
  expect(state?.foreman?.governance).toBeUndefined();
  expect(state?.foreman?.doctrine).toBeUndefined();
  expect(state?.foreman?.specialists).toBeUndefined();
  expect(state?.foreman?.allowedTools || []).not.toEqual(expect.arrayContaining([
    'et.plot.scenarios.start',
    'et.plot.settlements.launch_expedition',
    'et.plot.operating_model.choose_charter',
    'et.plot.creator.install_building'
  ]));

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene() || null);
  const objectIds = scene?.objects?.map((object) => object.id) || [];
  expect(objectIds).not.toEqual(expect.arrayContaining([
    'SCENARIO_SITE',
    'GOVERNOR_LEDGER',
    'SETTLEMENT_NODE_TOWN_1',
    'SETTLEMENT_NODE_TOWN_2',
    'CREATOR_NOTICE_KIOSK'
  ]));
  expect(scene?.regionalRoutes || []).toHaveLength(0);
  expect(scene?.regionalMap?.enabled).toBe(false);
  expect(scene?.drawers?.map((drawer) => drawer.key)).not.toEqual(expect.arrayContaining(['settlements', 'operating', 'creator']));
  expect(scene?.stateCoverage?.domains?.map((domain) => domain.id)).not.toEqual(expect.arrayContaining([
    'civic-scenarios',
    'settlements',
    'regional-network',
    'operating-model',
    'creator-extensions',
    'town-identity',
    'town-postcards',
    'foreman-governance',
    'foreman-persistent',
    'foreman-doctrine',
    'foreman-specialists'
  ]));

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('creator'));
  expect(await frame.evaluate(() => window.__foundersPlotTest.getActiveDrawer())).toBe('');

  const tools = await frame.evaluate(async () => {
    const response = await fetch('/api/founders-plot/tools', {
      credentials: 'include',
      headers: { 'x-founders-plot-feature-flags': 'none' }
    });
    return await response.json();
  });
  expect(tools?.ok).toBe(true);
  expect(tools?.featureFlags?.FEATURE_FOUNDERS_V16_SCENARIOS).toBe(false);
  expect(tools?.tools?.map((tool) => tool.name)).not.toEqual(expect.arrayContaining([
    'et.plot.scenarios.start',
    'et.plot.settlements.launch_expedition',
    'et.plot.regional.open_supply_route',
    'et.plot.creator.install_building'
  ]));

  const blocked = await frame.evaluate(async () => {
    const response = await fetch('/api/founders-plot/tool/et.plot.scenarios.start', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-founders-plot-feature-flags': 'none'
      },
      body: JSON.stringify({
        actor: 'HUMAN',
        scenarioId: 'storm_prep',
        idempotencyKey: `feature-disabled:${Date.now()}`
      })
    });
    return await response.json();
  });
  expect(blocked?.ok).toBe(false);
  expect(blocked?.error?.code).toBe('FEATURE_DISABLED');
});

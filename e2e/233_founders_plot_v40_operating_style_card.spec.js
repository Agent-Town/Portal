const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getPlotState,
  openFoundersPlotFrame,
  postJson,
  runLumberCycle,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function lumberBuildingId(frame) {
  return String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
}

async function ensureHomeWood(frame, amount) {
  const buildingId = await lumberBuildingId(frame);
  expect(buildingId).toMatch(/^bld_/);
  for (let index = 0; index < 3; index += 1) {
    const state = await getPlotState(frame);
    if (Number(state?.plot?.inventory?.wood || 0) >= amount) return;
    const cycle = await runLumberCycle(frame, buildingId, `v40-style-wood:${index}`);
    expect(cycle?.ok).toBe(true);
  }
}

async function prepareShareReadyState(frame) {
  const runtime = await startForemanRuntime(frame);
  expect(runtime?.ok).toBe(true);

  await bootstrapToHq2(frame);
  const buildingId = await lumberBuildingId(frame);
  expect(buildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId,
    idempotencyKey: 'v40-style-lumber:queue'
  });
  expect(queueResp?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
  await frame.evaluate(() => window.__foundersPlotTest.loadState());

  const persistent = await frame.evaluate(async () => window.__foundersPlotTest.startPersistentForeman(120));
  expect(persistent?.persistent?.active).toBe(true);

  const tick = await postJson(frame, '/__test__/founders-plot/persistent-tick', {});
  expect(tick?.persistent?.ran).toBe(true);
  await frame.evaluate(() => window.__foundersPlotTest.loadState());

  const launch = await runPlotTool(frame, 'et.plot.settlements.launch_expedition', {
    idempotencyKey: 'v40-style:launch-expedition'
  });
  expect(launch?.ok).toBe(true);
  const founding = await runPlotTool(frame, 'et.plot.settlements.complete_founding_task', {
    settlementId: 'town_2',
    taskId: 'raise_outpost_camp',
    idempotencyKey: 'v40-style:complete-outpost'
  });
  expect(founding?.ok).toBe(true);

  const charter = await runPlotTool(frame, 'et.plot.operating_model.choose_charter', {
    charterId: 'STEADY_COMMONS',
    idempotencyKey: 'v40-style:charter'
  });
  expect(charter?.ok).toBe(true);

  const doctrine = await runPlotTool(frame, 'et.foreman.doctrine.set_rule', {
    ruleId: 'PREFER_RESERVES',
    enabled: true,
    idempotencyKey: 'v40-style:doctrine'
  });
  expect(doctrine?.ok).toBe(true);

  const specialist = await runPlotTool(frame, 'et.foreman.specialists.assign', {
    roleId: 'QUARTERMASTER',
    domainId: 'supplies',
    idempotencyKey: 'v40-style:quartermaster'
  });
  expect(specialist?.ok).toBe(true);

  await ensureHomeWood(frame, 4);
  const route = await runPlotTool(frame, 'et.plot.regional.open_supply_route', {
    routeId: 'founders_ridge_supply_route',
    idempotencyKey: 'v40-style:open-route'
  });
  expect(route?.ok).toBe(true);
  await frame.evaluate(() => window.__foundersPlotTest.loadState());
}

test('V4.0 generates a public-safe operating style card, exposes it publicly, and compares imports without grants', async ({ page, request }) => {
  test.setTimeout(120_000);
  const frame = await openFoundersPlotFrame(page);

  await prepareShareReadyState(frame);
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.loadState();
    window.__foundersPlotTest.openDrawer('operating');
  });

  await expect(frame.getByTestId('operating-style-section')).toBeVisible();
  await frame.getByTestId('operating-style-generate-btn').click();
  const preview = frame.getByTestId('operating-style-card-preview');
  await expect(preview).toBeVisible();
  await expect(preview).toContainText('Steady Commons');
  await expect(preview).toContainText('Clover lanes');
  await expect(preview).not.toContainText(/secret|token|api key|provider|model|brain|runtime|wallet|log/i);

  const card = await frame.evaluate(async () => window.__foundersPlotTest.generateOperatingStyleCard());
  expect(card?.schemaVersion).toBe('founders-plot.operating-style-card.v1');
  expect(JSON.stringify(card).toLowerCase()).not.toMatch(/secret|token|api key|provider|model|brain|runtime|wallet|log/);

  const plotId = String((await getPlotState(frame))?.plot?.plotId || '');
  expect(plotId).toMatch(/^plot_/);
  const publicResponse = await request.get(`/api/founders-plot/public/operating-style-card/${plotId}`);
  expect(publicResponse.ok()).toBe(true);
  const publicPayload = await publicResponse.json();
  expect(publicPayload?.ok).toBe(true);
  expect(publicPayload?.card?.charter?.label).toBe('Steady Commons');
  expect(JSON.stringify(publicPayload).toLowerCase()).not.toMatch(/secret|token|api key|provider|model|brain|runtime|wallet|log/);

  const before = await getPlotState(frame);
  const beforeSnapshot = {
    resources: before?.plot?.inventory,
    buildingCount: Array.isArray(before?.buildings) ? before.buildings.length : 0,
    unlockedCapabilities: (before?.operatingModel?.capabilities || [])
      .filter((capability) => capability?.unlocked)
      .map((capability) => capability.capabilityId)
  };
  const comparison = await postJson(frame, '/api/founders-plot/operating-style/compare', {
    card: {
      title: 'Imported secret sk-test-hostile',
      charter: { charterId: 'SWIFT_DEPOT', label: 'Swift Depot', summary: 'provider model token' },
      styleTags: ['Swift Depot', 'apiKey=sk-test-hostile', 'Fast logistics'],
      resources: { wood: 999 },
      buildings: [{ type: 'MARKET_STALL' }],
      capabilities: ['ADMIN_UNLOCK']
    }
  });
  expect(comparison?.ok).toBe(true);
  expect(comparison?.comparison?.grants).toEqual({
    resources: false,
    buildings: false,
    permissions: false,
    capabilities: false
  });
  expect(JSON.stringify(comparison).toLowerCase()).not.toMatch(/sk-test-hostile|apikey|admin_unlock/);

  await frame.evaluate(() => window.__foundersPlotTest.loadState());
  const after = await getPlotState(frame);
  expect(after?.plot?.inventory).toEqual(beforeSnapshot.resources);
  expect(Array.isArray(after?.buildings) ? after.buildings.length : 0).toBe(beforeSnapshot.buildingCount);
  expect((after?.operatingModel?.capabilities || [])
    .filter((capability) => capability?.unlocked)
    .map((capability) => capability.capabilityId)).toEqual(beforeSnapshot.unlockedCapabilities);
});

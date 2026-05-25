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
    const cycle = await runLumberCycle(frame, buildingId, `v35-regional-wood:${index}`);
    expect(cycle?.ok).toBe(true);
  }
}

async function prepareRegionalReadyState(frame) {
  const runtime = await startForemanRuntime(frame);
  expect(runtime?.ok).toBe(true);

  await bootstrapToHq2(frame);
  const buildingId = await lumberBuildingId(frame);
  expect(buildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId,
    idempotencyKey: 'v35-regional-lumber:queue'
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
    idempotencyKey: 'v35-regional:launch-expedition'
  });
  expect(launch?.ok).toBe(true);
  const founding = await runPlotTool(frame, 'et.plot.settlements.complete_founding_task', {
    settlementId: 'town_2',
    taskId: 'raise_outpost_camp',
    idempotencyKey: 'v35-regional:complete-outpost'
  });
  expect(founding?.ok).toBe(true);

  const charter = await runPlotTool(frame, 'et.plot.operating_model.choose_charter', {
    charterId: 'STEADY_COMMONS',
    idempotencyKey: 'v35-regional:charter'
  });
  expect(charter?.ok).toBe(true);

  const specialist = await runPlotTool(frame, 'et.foreman.specialists.assign', {
    roleId: 'QUARTERMASTER',
    domainId: 'supplies',
    idempotencyKey: 'v35-regional:quartermaster'
  });
  expect(specialist?.ok).toBe(true);
  await ensureHomeWood(frame, 4);
}

test('V3.5 regional governance opens a supply route, completes a cross-town contract, and renders in Three.js', async ({ page }) => {
  test.setTimeout(120_000);
  const frame = await openFoundersPlotFrame(page);

  await prepareRegionalReadyState(frame);
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.loadState();
    window.__foundersPlotTest.openDrawer('settlements');
  });

  await expect(frame.getByTestId('regional-ledger-panel')).toBeVisible();
  await expect(frame.getByTestId('regional-map')).toBeVisible();
  await expect(frame.getByTestId('regional-map-node-town_1')).toContainText('Founders Plot');
  await expect(frame.getByTestId('regional-map-node-town_2')).toContainText('Ridge Outpost');
  await expect(frame.getByTestId('regional-route-founders_ridge_supply_route')).toContainText('Ready');
  await frame.getByTestId('regional-open-route-founders_ridge_supply_route').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.regionalNetwork?.routes?.[0]?.status;
  }).toBe('ACTIVE');

  await expect(frame.getByTestId('regional-accept-contract-ridge_timber_bridge')).toBeEnabled();
  await frame.getByTestId('regional-accept-contract-ridge_timber_bridge').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.regionalNetwork?.contracts?.[0]?.status;
  }).toBe('ACTIVE');

  const before = await getPlotState(frame);
  const beforeWood = Number(before?.plot?.inventory?.wood || 0)
    + Number(before?.settlements?.settlements?.find((entry) => entry.settlementId === 'town_2')?.inventory?.wood || 0);
  await frame.getByTestId('regional-transfer-route-founders_ridge_supply_route').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.regionalNetwork?.contracts?.[0]?.status;
  }).toBe('READY_TO_TURN_IN');

  const afterTransfer = await getPlotState(frame);
  const afterWood = Number(afterTransfer?.plot?.inventory?.wood || 0)
    + Number(afterTransfer?.settlements?.settlements?.find((entry) => entry.settlementId === 'town_2')?.inventory?.wood || 0);
  expect(afterWood).toBe(beforeWood);

  await expect(frame.getByTestId('regional-turn-in-contract-ridge_timber_bridge')).toBeEnabled();
  await frame.getByTestId('regional-turn-in-contract-ridge_timber_bridge').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.regionalNetwork?.contracts?.[0]?.status;
  }).toBe('COMPLETED');

  const state = await getPlotState(frame);
  expect(state?.regionalNetwork?.summary || '').toContain('Ridge Supply Route');
  expect(state?.recap?.morningBrief?.regionalNetwork || '').toContain('Ridge Supply Route');

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene() || null);
  expect(scene?.stateCoverage?.domains?.map((entry) => entry.id)).toContain('regional-network');
  const regionalAnchor = scene?.stateCoverage?.anchors?.find((entry) => entry.id === 'STATE:regional-network');
  expect(regionalAnchor?.objectId).toBe('GOVERNOR_LEDGER');
  expect(regionalAnchor?.status).toBe('ACTIVE');
  expect(scene?.objects?.map((entry) => entry.id)).toContain('SETTLEMENT_NODE_TOWN_1');
  expect(scene?.objects?.map((entry) => entry.id)).toContain('SETTLEMENT_NODE_TOWN_2');
  expect(scene?.regionalMap?.settlementNodes?.map((entry) => entry.objectId)).toContain('SETTLEMENT_NODE_TOWN_2');

  const threeInfo = await frame.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(threeInfo?.parity?.routeLinks?.some((entry) => entry.routeId === 'founders_ridge_supply_route')).toBe(true);
  expect(threeInfo?.parity?.routeLinks?.some((entry) => entry.toObjectId === 'SETTLEMENT_NODE_TOWN_2')).toBe(true);

  await frame.getByTestId('regional-map-node-town_1').click();
  await expect(frame.getByTestId('regional-map-node-town_1')).toContainText('Camera focus');
  await frame.getByTestId('regional-map-node-town_2').click();
  await expect(frame.getByTestId('regional-map-node-town_2')).toContainText('Camera focus');
  const focusedScene = await frame.evaluate(() => window.__foundersPlotTest.getScene());
  expect(focusedScene?.regionalMap?.activeSettlementId).toBe('town_2');
  expect(focusedScene?.cameraFocus?.objectId).toBe('SETTLEMENT_NODE_TOWN_2');
  const focusedThreeInfo = await frame.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(focusedThreeInfo?.parity?.cameraFocus?.objectId).toBe('SETTLEMENT_NODE_TOWN_2');
});

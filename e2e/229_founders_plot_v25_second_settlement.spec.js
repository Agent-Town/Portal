const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getPlotState,
  openFoundersPlotFrame,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function prepareStableTownForExpedition(frame) {
  const runtime = await startForemanRuntime(frame);
  expect(runtime?.ok).toBe(true);

  await bootstrapToHq2(frame);

  const lumberBuildingId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v25-expedition-lumber:queue'
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
}

test('V2.5 Governor Ledger blocks early Settler Expedition until one-town governance is proven', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('settlements'));
  await expect(frame.getByTestId('governor-ledger')).toBeVisible();
  await expect(frame.getByTestId('governor-ledger-summary')).toContainText('Stabilize the first town');
  await expect(frame.getByTestId('settler-expedition-launch')).toBeDisabled();

  const state = await getPlotState(frame);
  expect(state?.settlements?.stabilityGate?.ready).toBe(false);
  expect(state?.settlements?.settlements).toHaveLength(1);
});

test('V2.5 Settler Expedition creates Ridge Outpost and keeps settlement state isolated', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await prepareStableTownForExpedition(frame);

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('settlements'));
  await expect(frame.getByTestId('settler-expedition-launch')).toBeEnabled();
  await frame.getByTestId('settler-expedition-launch').click();
  await expect(frame.getByTestId('governor-ledger-settlement')).toHaveCount(2);
  await expect(frame.getByTestId('governor-ledger')).toContainText('Ridge Outpost');

  let state = await getPlotState(frame);
  const home = state?.settlements?.settlements?.find((entry) => entry.settlementId === 'town_1');
  let outpost = state?.settlements?.settlements?.find((entry) => entry.settlementId === 'town_2');
  expect(home?.plotId).toBeTruthy();
  expect(outpost?.plotId).toBeTruthy();
  expect(outpost?.plotId).not.toBe(home?.plotId);
  expect(outpost?.status).toBe('FOUNDING');
  const homeWoodBeforeTask = Number(state?.plot?.inventory?.wood || 0);

  await frame.locator('[data-settlement-task="raise_outpost_camp"]').click();
  await expect(frame.getByTestId('governor-ledger')).toContainText('Completed');
  state = await getPlotState(frame);
  outpost = state?.settlements?.settlements?.find((entry) => entry.settlementId === 'town_2');
  expect(outpost?.status).toBe('ACTIVE');
  expect(outpost?.inventory).toEqual(expect.objectContaining({ wood: 0, food: 4 }));
  expect(Number(state?.plot?.inventory?.wood || 0)).toBe(homeWoodBeforeTask);

  await frame.locator('[data-settlement-focus="town_1"]').click();
  await expect.poll(async () => {
    const nextState = await getPlotState(frame);
    return nextState?.settlements?.activeSettlementId;
  }).toBe('town_1');
  state = await getPlotState(frame);
  expect(state?.settlements?.activeSettlementId).toBe('town_1');
  await frame.locator('[data-settlement-focus="town_2"]').click();
  await expect.poll(async () => {
    const nextState = await getPlotState(frame);
    return nextState?.settlements?.activeSettlementId;
  }).toBe('town_2');
  state = await getPlotState(frame);
  expect(state?.settlements?.activeSettlementId).toBe('town_2');

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toContain('settlements');
  expect(scene?.anchors?.find((entry) => entry.id === 'STATE:settlements')?.objectId).toBe('GOVERNOR_LEDGER');
});

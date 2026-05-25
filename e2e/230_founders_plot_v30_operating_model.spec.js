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

async function prepareNetworkReadyForCharter(frame) {
  const runtime = await startForemanRuntime(frame);
  expect(runtime?.ok).toBe(true);

  await bootstrapToHq2(frame);

  const lumberBuildingId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v30-charter-lumber:queue'
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
    idempotencyKey: 'v30-charter:launch-expedition'
  });
  expect(launch?.ok).toBe(true);
  const founding = await runPlotTool(frame, 'et.plot.settlements.complete_founding_task', {
    settlementId: 'town_2',
    taskId: 'raise_outpost_camp',
    idempotencyKey: 'v30-charter:complete-outpost'
  });
  expect(founding?.ok).toBe(true);
}

test('V3.0 Town Charter stays locked until Ridge Outpost is founded', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('operating'));
  await expect(frame.getByTestId('operating-model-panel')).toBeVisible();
  await expect(frame.getByTestId('operating-model-summary')).toContainText('Found Ridge Outpost');
  await expect(frame.getByTestId('operating-charter-steady_commons')).toBeDisabled();

  const state = await getPlotState(frame);
  expect(state?.operatingModel?.gate?.ready).toBe(false);
  expect(state?.operatingModel?.allowedActions || []).not.toContain('choose_charter');
});

test('V3.0 charter choice unlocks capability actions and is represented in Three.js', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await prepareNetworkReadyForCharter(frame);

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('operating'));
  await expect(frame.getByTestId('operating-charter-steady_commons')).toBeEnabled();
  await frame.getByTestId('operating-charter-steady_commons').click();
  await expect(frame.getByTestId('operating-model-panel')).toContainText('Steady Commons');

  await expect.poll(async () => {
    const nextState = await getPlotState(frame);
    return nextState?.operatingModel?.selectedCharterId;
  }).toBe('STEADY_COMMONS');
  let state = await getPlotState(frame);
  expect(state?.operatingModel?.selectedCharterId).toBe('STEADY_COMMONS');
  expect(state?.contracts?.recommendation?.reason || '').toContain('Steady Commons');

  await expect(frame.getByTestId('operating-capability-charter_contracts')).toBeEnabled();
  await frame.getByTestId('operating-capability-charter_contracts').click();
  await expect.poll(async () => {
    const nextState = await getPlotState(frame);
    return (nextState?.operatingModel?.unlockedCapabilities || []).some((entry) => entry.capabilityId === 'CHARTER_CONTRACTS');
  }).toBe(true);
  await expect(frame.getByTestId('operating-refresh-contracts')).toBeEnabled();
  await frame.getByTestId('operating-refresh-contracts').click();
  await expect(frame.getByTestId('operating-model-panel')).toContainText('Charter Contract Board');

  state = await getPlotState(frame);
  expect(state?.foreman?.allowedTools || []).toContain('et.plot.operating_model.refresh_contracts');
  expect(state?.operatingModel?.allowedActions || []).toContain('refresh_contracts');

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toContain('operating-model');
  const operating = scene?.anchors?.find((entry) => entry.id === 'STATE:operating-model');
  expect(operating?.objectId).toBe('PUBLIC_SQUARE');
  expect(operating?.status).toBe('CHOSEN');
});

const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getOpenFoundersPlotFrame,
  getPlotState,
  openFoundersPlotFrame,
  openFoundersPlotRoute,
  placeFirstLumberCamp,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function prepareReadyLumber(frame, { allowCollect = true, keyPrefix = 'v20-persistent' } = {}) {
  const runtime = await startForemanRuntime(frame);
  expect(runtime?.ok).toBe(true);

  const placed = await placeFirstLumberCamp(frame, `${keyPrefix}:place`);
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberBuildingId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: `${keyPrefix}:queue`
  });
  expect(queueResp?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  if (allowCollect) {
    const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
    expect(policy?.ok).toBe(true);
    await frame.evaluate(() => window.__foundersPlotTest.loadState());
  }

  return lumberBuildingId;
}

test('V2.0 persistent Foreman collects ready output, leaves a receipt, and survives closed-page server sweep', async ({ page, context }) => {
  const frame = await openFoundersPlotFrame(page);
  const lumberBuildingId = await prepareReadyLumber(frame, { allowCollect: true });

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frame.getByTestId('foreman-governance-card')).toBeVisible();
  await expect(frame.getByTestId('foreman-persistent-start')).toBeEnabled();
  await frame.getByTestId('foreman-persistent-start').click();
  await expect(frame.getByTestId('foreman-governance-card')).toContainText('Clover is watching for ready output');

  const started = await getPlotState(frame);
  expect(started?.foreman?.governance?.persistent?.active).toBe(true);
  expect(started?.foreman?.scheduler?.collectReadyOutputs?.runtimeScope).toBe('background_foreman_pool');

  await page.close();
  const sweepResponse = await context.request.post('/__test__/founders-plot/persistent-sweep', {
    data: {
      nowMs: Number(started?.foreman?.governance?.persistent?.nextTickAtMs || 0) + 1_000
    }
  });
  expect(sweepResponse.ok()).toBe(true);
  const sweep = await sweepResponse.json();
  expect(sweep?.ok).toBe(true);
  expect(sweep?.ranCount).toBeGreaterThanOrEqual(1);
  expect(sweep?.results?.some((entry) => entry?.result?.reason === 'COLLECTED_READY_OUTPUT')).toBe(true);

  const reloadedPage = await context.newPage();
  await openFoundersPlotRoute(reloadedPage);
  const reloadedFrame = await getOpenFoundersPlotFrame(reloadedPage);
  const afterTick = await getPlotState(reloadedFrame);
  const lumber = afterTick?.buildings?.find((building) => building?.buildingId === lumberBuildingId);
  expect(afterTick?.plot?.inventory?.wood).toBeGreaterThanOrEqual(5);
  expect(lumber?.state).toBe('READY');
  expect(afterTick?.foreman?.receipt?.authorityUsed).toBe('Persistent Foreman lease');
  expect(afterTick?.foreman?.receipt?.action).toBe('collect_ready_outputs');
  expect(afterTick?.foreman?.governance?.persistent?.actionCount).toBe(1);
  expect(afterTick?.recap?.morningBrief?.changed || '').toMatch(/while you were away|while-away/i);

  const scene = await reloadedFrame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toContain('foreman-persistent');
  expect(scene?.anchors?.find((entry) => entry.id === 'STATE:persistent_foreman')?.status).toBe('ACTIVE');

  await reloadedFrame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(reloadedFrame.getByTestId('foreman-governance-card')).toContainText('Clover is watching for ready output');
  await expect(reloadedFrame.getByTestId('founders-receipt')).toContainText('Clover collected ready output');
  await expect(reloadedFrame.getByTestId('foreman-persistent-pause')).toBeEnabled();

  await reloadedFrame.getByTestId('foreman-persistent-pause').click();
  await expect(reloadedFrame.getByTestId('foreman-governance-card')).toContainText('Off');
  const paused = await getPlotState(reloadedFrame);
  expect(paused?.foreman?.governance?.persistent?.status).toBe('PAUSED');
});

test('V2.0 persistent Foreman asks for permission instead of collecting when policy blocks it', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const lumberBuildingId = await prepareReadyLumber(frame, { allowCollect: false, keyPrefix: 'v20-persistent-blocked' });

  const started = await frame.evaluate(async () => window.__foundersPlotTest.startPersistentForeman(120));
  expect(started?.persistent?.active).toBe(true);

  const tick = await postJson(frame, '/__test__/founders-plot/persistent-tick', {});
  expect(tick?.ok).toBe(true);
  expect(tick?.persistent?.ran).toBe(false);
  expect(tick?.persistent?.reason).toBe('COLLECT_PERMISSION_REQUIRED');

  await frame.evaluate(() => window.__foundersPlotTest.loadState());
  const afterTick = await getPlotState(frame);
  const lumber = afterTick?.buildings?.find((building) => building?.buildingId === lumberBuildingId);
  expect(afterTick?.plot?.inventory?.wood).toBe(0);
  expect(lumber?.state).toBe('OUTPUT_READY');
  expect(afterTick?.foreman?.governance?.openExceptions?.[0]?.requestedAction).toBe('enable_collect_outputs_permission');

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frame.getByTestId('foreman-exception-inbox')).toContainText('Allow Clover to collect outputs');
  await expect(frame.getByTestId('foreman-exception-item')).toHaveCount(1);
});

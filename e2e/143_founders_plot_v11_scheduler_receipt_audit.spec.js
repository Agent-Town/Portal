const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getJson,
  getPlotState,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  postJson,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function prepareReadyLumberWithRuntime(frame) {
  const started = await frame.evaluate(async () => window.__foundersPlotTest.startForemanRuntime());
  expect(started?.ok).toBe(true);

  const placed = await placeFirstLumberCamp(frame, 'v11-scheduler-lumber');
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberBuildingId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-scheduler-lumber:queue'
  });
  expect(queueResp?.ok).toBe(true);

  await advancePlot(frame, 61_000);
  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
  return { runtimeId: started.runtime.runtimeId, lumberBuildingId };
}

test('collect-ready scheduler creates a receipt and recap attribution without duplicating the collection', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await prepareReadyLumberWithRuntime(frame);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const firstTick = await frame.evaluate(async () => window.__foundersPlotTest.runForemanTick());
  expect(firstTick?.ok).toBe(true);
  expect(firstTick?.receipt).toEqual(expect.objectContaining({
    action: 'collect_ready_outputs',
    reason: expect.any(String),
    authorityUsed: expect.any(String)
  }));
  expect(Array.isArray(firstTick?.receipt?.correctionOptions)).toBe(true);
  expect(firstTick.receipt.correctionOptions).toEqual(expect.arrayContaining(['ASK_ME_NEXT_TIME', 'PAUSE_FOREMAN']));

  const stateAfterFirstTick = await getPlotState(frame);
  expect(stateAfterFirstTick?.plot?.inventory?.wood).toBeGreaterThanOrEqual(6);

  const secondTick = await frame.evaluate(async () => window.__foundersPlotTest.runForemanTick());
  expect(secondTick?.ok).toBe(true);
  expect(secondTick?.result?.mutationApplied).toBe(false);

  const recap = await getJson(frame, '/api/founders-plot/recap');
  expect(recap?.ok).toBe(true);
  const lines = Array.isArray(recap?.recap?.lines) ? recap.recap.lines.map((line) => String(line?.line || '')) : [];
  expect(lines.some((line) => /finished production/i.test(line))).toBe(true);
  expect(lines.some((line) => /foreman collected/i.test(line))).toBe(true);
});

test('Ask me next time and Pause Foreman stop later automated work immediately', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await prepareReadyLumberWithRuntime(frame);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const firstTick = await frame.evaluate(async () => window.__foundersPlotTest.runForemanTick());
  expect(firstTick?.ok).toBe(true);

  const askMe = await frame.evaluate(async () => window.__foundersPlotTest.applyReceiptCorrection('ASK_ME_NEXT_TIME'));
  expect(askMe?.ok).toBe(true);

  const schedulerState = await frame.evaluate(async () => window.__foundersPlotTest.getSchedulerStatus());
  expect(schedulerState?.ok).toBe(true);
  expect(schedulerState?.scheduler?.collectReadyOutputs?.enabled).toBe(false);

  const paused = await frame.evaluate(async () => window.__foundersPlotTest.pauseForemanRuntime());
  expect(paused?.ok).toBe(true);

  const nextTick = await frame.evaluate(async () => window.__foundersPlotTest.runForemanTick());
  expect(nextTick?.ok).toBe(true);
  expect(nextTick?.result?.mutationApplied).toBe(false);

  const state = await getPlotState(frame);
  expect(state?.foreman?.runtime?.status).toBe('PAUSED');
});

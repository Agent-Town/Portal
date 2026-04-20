const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getJson,
  getPlotState,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');
const { mockFoundersPlotForemanSelection } = require('./helpers/founders_plot_llm');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function prepareReadyLumber(frame, keyPrefix = 'v12-hardening-ready-lumber') {
  const placed = await placeFirstLumberCamp(frame, `${keyPrefix}:place`);
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const building = Array.isArray(state?.buildings)
      ? state.buildings.find((entry) => entry?.type === 'LUMBER_CAMP')
      : null;
    return String(building?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queued = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: `${keyPrefix}:queue`
  });
  expect(queued?.ok).toBe(true);
  await advancePlot(frame, 61_000);
  return lumberBuildingId;
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('scheduler collects a ready output without clicking Run now', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  const lumberBuildingId = await prepareReadyLumber(frame, 'v12-hardening-auto');
  const before = await getPlotState(frame);
  const beforeWood = Number(before?.plot?.inventory?.wood || 0);
  expect(Number(before?.buildings?.find((entry) => entry?.buildingId === lumberBuildingId)?.outputBuffer?.wood || 0)).toBeGreaterThan(0);
  await mockFoundersPlotForemanSelection(page, {
    candidateId: `collect:${lumberBuildingId}`,
    reason: 'Careful Steward clears the ready lumber before it starts drifting.'
  });

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return state?.foreman?.receipt?.action === 'collect_ready_outputs'
      && Number(state?.foreman?.scheduler?.collectReadyOutputs?.runCount || 0) >= 1;
  }, null, { timeout: 12_000 });

  const after = await getPlotState(frame);
  expect(Number(after?.plot?.inventory?.wood || 0)).toBeGreaterThan(beforeWood);
  expect(Number(after?.buildings?.find((entry) => entry?.buildingId === lumberBuildingId)?.outputBuffer?.wood || 0)).toBe(0);
  expect(Number(after?.foreman?.scheduler?.collectReadyOutputs?.runCount || 0)).toBeGreaterThanOrEqual(1);
  expect(after?.foreman?.receipt?.action).toBe('collect_ready_outputs');

  const replay = await getJson(frame, '/api/founders-plot/replay');
  expect(replay?.ok).toBe(true);
  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  const startedEvent = events.find((event) => event?.type === 'FOREMAN_WORKER_COMMAND_STARTED');
  const completedEvent = events.find((event) => event?.type === 'FOREMAN_WORKER_COMMAND_COMPLETED');
  const actionEvent = events.find((event) => event?.type === 'AGENT_ACTION_EXECUTED' && event?.data?.tool === 'et.plot.collect_outputs');

  expect(startedEvent?.data?.origin).toBe('OPENCLAW_LITE_WORKER');
  expect(completedEvent?.data?.origin).toBe('OPENCLAW_LITE_WORKER');
  expect(actionEvent?.data).toEqual(expect.objectContaining({
    origin: 'OPENCLAW_LITE_WORKER',
    runtimeId: started.runtime.runtimeId
  }));
  expect(actionEvent?.data?.workerCommandId).toMatch(/^fpwcmd_/);
  expect(actionEvent?.data?.workerTraceId).toMatch(/^fpwtrace_/);
});

test('scheduler does not duplicate a collect when close start commands race', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  const lumberBuildingId = await prepareReadyLumber(frame, 'v12-hardening-race');
  await mockFoundersPlotForemanSelection(page, {
    candidateId: `collect:${lumberBuildingId}`,
    reason: 'Careful Steward clears the ready lumber before it starts drifting.'
  });
  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  await frame.evaluate(async ({ token }) => {
    const gateway = window.__openclawLiteTest || await import('/openclaw-lite/gateway.js').then((module) => module.default || module);
    await Promise.all([
      gateway.foundersPlotSchedulerStart({ token, taskKind: 'COLLECT_READY_OUTPUTS' }),
      gateway.foundersPlotSchedulerStart({ token, taskKind: 'COLLECT_READY_OUTPUTS' })
    ]);
  }, { token: started.runtime.token });

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return state?.foreman?.receipt?.action === 'collect_ready_outputs';
  }, null, { timeout: 12_000 });

  const state = await getPlotState(frame);
  expect(Number(state?.buildings?.find((entry) => entry?.buildingId === lumberBuildingId)?.outputBuffer?.wood || 0)).toBe(0);
  expect(Number(state?.foreman?.scheduler?.collectReadyOutputs?.runCount || 0)).toBe(1);

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const collectEvents = Array.isArray(replay?.replay?.events)
    ? replay.replay.events.filter((event) => event?.type === 'AGENT_ACTION_EXECUTED' && event?.data?.tool === 'et.plot.collect_outputs')
    : [];
  expect(collectEvents).toHaveLength(1);
});

test('paused scheduler does not act on a ready output', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const paused = await runPlotTool(frame, 'et.foreman.scheduler.pause', {
    idempotencyKey: 'v12-hardening-pause'
  });
  expect(paused?.ok).toBe(true);

  const lumberBuildingId = await prepareReadyLumber(frame, 'v12-hardening-paused');
  const before = await getPlotState(frame);
  const beforeWood = Number(before?.plot?.inventory?.wood || 0);

  await frame.waitForTimeout(6_000);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());

  const after = await getPlotState(frame);
  expect(Number(after?.plot?.inventory?.wood || 0)).toBe(beforeWood);
  expect(Number(after?.buildings?.find((entry) => entry?.buildingId === lumberBuildingId)?.outputBuffer?.wood || 0)).toBeGreaterThan(0);
  expect(after?.foreman?.receipt?.action || '').not.toBe('collect_ready_outputs');

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const collectEvents = Array.isArray(replay?.replay?.events)
    ? replay.replay.events.filter((event) => event?.type === 'AGENT_ACTION_EXECUTED' && event?.data?.tool === 'et.plot.collect_outputs')
    : [];
  expect(collectEvents).toHaveLength(0);
  await expect(frame.locator('#schedulerCard')).toContainText(/ask next time|paused/i);
});

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

async function prepareReadyCollect(frame, keyPrefix = 'v12-hardening-origin') {
  const placed = await placeFirstLumberCamp(frame, `${keyPrefix}:place`);
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);
  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String((state?.buildings || []).find((entry) => entry?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);
  const queued = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: `${keyPrefix}:queue`
  });
  expect(queued?.ok).toBe(true);
  await advancePlot(frame, 61_000);
  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
  return lumberBuildingId;
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('direct foreman runtime-token mutation without worker metadata is rejected', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);
  const lumberBuildingId = await prepareReadyCollect(frame, 'v12-hardening-direct');

  const before = await getPlotState(frame);
  const direct = await frame.evaluate(async ({ token, buildingId }) => {
    const response = await fetch('/api/founders-plot/foreman/tool/et.plot.collect_outputs', {
      method: 'POST',
      credentials: 'include',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        buildingId,
        idempotencyKey: 'direct-call-should-fail'
      })
    });
    return {
      status: response.status,
      body: await response.json().catch(() => ({}))
    };
  }, { token: started.runtime.token, buildingId: lumberBuildingId });

  expect(direct.status).toBe(403);
  expect(['FOREMAN_WORKER_ORIGIN_REQUIRED', 'FOREMAN_WORKER_RUNTIME_MISMATCH']).toContain(direct.body?.error?.code);

  const after = await getPlotState(frame);
  expect(after?.plot?.inventory).toEqual(before?.plot?.inventory);
  expect(Number(after?.buildings?.find((entry) => entry?.buildingId === lumberBuildingId)?.outputBuffer?.wood || 0)).toBeGreaterThan(0);
  expect(after?.foreman?.receipt || null).toBeNull();
  expect(Number(after?.foreman?.scheduler?.collectReadyOutputs?.runCount || 0)).toBe(0);
});

test('worker-mediated foreman mutation still succeeds and preserves worker attribution', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);
  const lumberBuildingId = await prepareReadyCollect(frame, 'v12-hardening-worker');
  await mockFoundersPlotForemanSelection(page, {
    candidateId: `collect:${lumberBuildingId}`,
    reason: 'Careful Steward clears the ready lumber before it starts drifting.'
  });

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const tick = await frame.evaluate(async () => window.__foundersPlotTest.runForemanTick());
  expect(tick?.ok).toBe(true);
  expect(tick?.receipt?.action).toBe('collect_ready_outputs');

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  expect(events.some((event) => event?.type === 'FOREMAN_WORKER_COMMAND_STARTED')).toBe(true);
  expect(events.some((event) => event?.type === 'FOREMAN_WORKER_COMMAND_COMPLETED')).toBe(true);
  const actionEvent = events.find((event) => event?.type === 'AGENT_ACTION_EXECUTED' && event?.data?.tool === 'et.plot.collect_outputs');
  expect(actionEvent?.data?.origin).toBe('OPENCLAW_LITE_WORKER');
  expect(actionEvent?.data?.runtimeId).toBe(started.runtime.runtimeId);
});

test('foreman mutation with forged runtime id is rejected', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);
  const lumberBuildingId = await prepareReadyCollect(frame, 'v12-hardening-forged');

  const forged = await frame.evaluate(async ({ token, buildingId }) => {
    const response = await fetch('/api/founders-plot/foreman/tool/et.plot.collect_outputs', {
      method: 'POST',
      credentials: 'include',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        origin: 'OPENCLAW_LITE_WORKER',
        workerCommandId: 'fpwcmd_123_abc',
        workerTraceId: 'fpwtrace_123_abc',
        runtimeId: 'wrong_runtime',
        buildingId,
        idempotencyKey: 'forged-runtime'
      })
    });
    return {
      status: response.status,
      body: await response.json().catch(() => ({}))
    };
  }, { token: started.runtime.token, buildingId: lumberBuildingId });

  expect(forged.status).toBe(403);
  expect(['FOREMAN_WORKER_ORIGIN_REQUIRED', 'FOREMAN_WORKER_RUNTIME_MISMATCH']).toContain(forged.body?.error?.code);

  const after = await getPlotState(frame);
  expect(Number(after?.buildings?.find((entry) => entry?.buildingId === lumberBuildingId)?.outputBuffer?.wood || 0)).toBeGreaterThan(0);
  expect(after?.foreman?.receipt || null).toBeNull();
});

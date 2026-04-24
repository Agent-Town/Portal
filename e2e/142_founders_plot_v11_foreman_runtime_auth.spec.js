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

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('the human route rejects actor spoofing and the foreman route requires runtime authentication', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const spoofed = await frame.evaluate(async () => {
    const response = await fetch('/api/founders-plot/tool/et.plot.get_state', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actor: 'AGENT' })
    });
    return await response.json().catch(() => ({}));
  });
  expect(spoofed?.ok).toBe(false);
  expect(spoofed?.error?.code).toBe('ACTOR_SPOOF_REJECTED');

  const noToken = await frame.evaluate(async () => {
    const response = await fetch('/api/founders-plot/foreman/tool/et.plot.get_state', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json().catch(() => ({}));
  });
  expect(noToken?.ok).toBe(false);
  expect(noToken?.error?.code).toBe('FOREMAN_RUNTIME_REQUIRED');
});

test('the Foreman runtime boots through OpenClaw Lite, exposes the observation packet, and acts through the authenticated route', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);
  expect(started?.runtime?.runtimeId).toMatch(/^rt_/);

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return state?.foreman?.runtime?.status === 'OBSERVING';
  }, null, { timeout: 10_000 });

  const runtimeState = await getPlotState(frame);
  expect(runtimeState?.foreman?.runtime?.status).toBe('OBSERVING');
  expect(runtimeState?.foreman?.runtime?.pack?.skillLoaded).toBe(true);
  expect(runtimeState?.foreman?.runtime?.pack?.toolsLoaded).toBe(true);
  expect(runtimeState?.foreman?.runtime?.pack?.goalsLoaded).toBe(true);

  const observation = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.getForemanObservation();
  });
  expect(observation?.ok).toBe(true);
  expect(observation?.observation?.schema).toBe('founders-plot.obs.v1.2');
  expect(Array.isArray(observation?.safeCandidates)).toBe(true);

  const placed = await placeFirstLumberCamp(frame, 'v11-runtime-lumber');
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberBuildingId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queued = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-runtime-lumber:queue'
  });
  expect(queued?.ok).toBe(true);

  await advancePlot(frame, 61_000);
  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
  const scheduler = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.enableCollectReadyOutputs();
  });
  expect(scheduler?.ok).toBe(true);

  const tick = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.runForemanTick();
  });
  expect(tick?.ok).toBe(true);
  expect(tick?.receipt?.action).toBe('collect_ready_outputs');

  const replay = await getJson(frame, '/api/founders-plot/replay');
  expect(replay?.ok).toBe(true);
  const foremanEvent = replay.replay.events.find((event) => event?.type === 'AGENT_ACTION_EXECUTED');
  expect(foremanEvent?.data?.runtimeId).toBe(started.runtime.runtimeId);
  expect(foremanEvent?.data?.foremanSessionId).toMatch(/^frs_/);
  expect(foremanEvent?.data?.tokenScope).toContain('founders_plot:tool');
});

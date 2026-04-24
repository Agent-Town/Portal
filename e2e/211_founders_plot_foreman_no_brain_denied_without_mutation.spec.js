const { test, expect } = require('@playwright/test');
const {
  getJson,
  getOpenFoundersPlotFrame,
  getPlotState
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('no-Brain Foreman start and mutation attempts leave the plot human-only', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);
  const before = await getPlotState(frame);

  const startAttempt = await frame.evaluate(async () => {
    const response = await fetch('/api/founders-plot/foreman/session/start', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brainReady: false })
    });
    return {
      status: response.status,
      body: await response.json().catch(() => ({}))
    };
  });
  expect(startAttempt.status).toBe(403);
  expect(startAttempt.body?.error?.code).toBe('BRAIN_REQUIRED');

  const toolAttempt = await frame.evaluate(async () => {
    const response = await fetch('/api/founders-plot/foreman/tool/et.plot.collect_outputs', {
      method: 'POST',
      credentials: 'include',
      headers: {
        authorization: 'Bearer fake-token',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        buildingId: 'bld_missing',
        idempotencyKey: 'v144-no-brain-e2e',
        origin: 'OPENCLAW_LITE_WORKER',
        runtimeId: 'rt_missing',
        workerCommandId: 'cmd-no-brain-e2e',
        workerTraceId: 'trace-no-brain-e2e'
      })
    });
    return {
      status: response.status,
      body: await response.json().catch(() => ({}))
    };
  });
  expect(toolAttempt.status).toBe(403);

  const after = await getPlotState(frame);
  expect(after?.plot?.inventory).toEqual(before?.plot?.inventory);

  const replay = await getJson(frame, '/api/founders-plot/replay');
  const events = Array.isArray(replay?.replay?.events) ? replay.replay.events : [];
  expect(events.some((event) => event?.actor === 'AGENT')).toBe(false);
  expect(events.some((event) => event?.type === 'AGENT_ACTION_EXECUTED')).toBe(false);
});

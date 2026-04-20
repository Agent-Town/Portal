const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getJson,
  getOpenFoundersPlotFrame,
  getPlotState,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  postJson,
  runPlotTool,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function prepareReadyAfterReload(frame, keyPrefix = 'v12-hardening-reload') {
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
  return lumberBuildingId;
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('reload shows a restart-needed Clover state instead of an actionable runtime', async ({ page }) => {
  let frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeEnabled();

  await page.reload();
  frame = await getOpenFoundersPlotFrame(page);

  await expect(frame.locator('#foremanToolsLine')).toContainText(/fresh start|restart clover/i);
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeDisabled();

  const schedulerStatus = await frame.evaluate(async () => {
    const gateway = window.__openclawLiteTest || await import('/openclaw-lite/gateway.js').then((module) => module.default || module);
    return await gateway.foundersPlotSchedulerStatus();
  });
  expect(Boolean(schedulerStatus?.active)).toBe(false);
});

test('restart restores local actionability and reactivates the scheduler loop', async ({ page }) => {
  let frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  await page.reload();
  frame = await getOpenFoundersPlotFrame(page);

  await frame.getByTestId('foreman-start-btn').click();
  await expect(frame.locator('#foremanToolsLine')).not.toContainText(/fresh start|restart clover/i);
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeEnabled();

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const diagnostics = await frame.evaluate(async () => {
    const gateway = window.__openclawLiteTest || await import('/openclaw-lite/gateway.js').then((module) => module.default || module);
    return {
      localRuntime: window.__foundersPlotTest.getLocalForemanRuntimeStatus?.() || null,
      scheduler: await gateway.foundersPlotSchedulerStatus()
    };
  });
  expect(diagnostics?.localRuntime?.actionable).toBe(true);
  expect(diagnostics?.localRuntime?.hasLocalToken).toBe(true);
  expect(diagnostics?.localRuntime?.localRuntimeId).toBe(diagnostics?.localRuntime?.serverRuntimeId);
  expect(Boolean(diagnostics?.scheduler?.active)).toBe(true);
});

test('reload prevents scheduler action until Clover is restarted in this tab', async ({ page }) => {
  let frame = await openFoundersPlotFrame(page);
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  await page.reload();
  frame = await getOpenFoundersPlotFrame(page);
  const lumberBuildingId = await prepareReadyAfterReload(frame, 'v12-hardening-reload-blocked');
  const before = await getPlotState(frame);
  const replayBefore = await getJson(frame, '/api/founders-plot/replay');
  const beforeActionCount = Array.isArray(replayBefore?.replay?.events)
    ? replayBefore.replay.events.filter((event) => event?.type === 'AGENT_ACTION_EXECUTED').length
    : 0;

  await frame.waitForTimeout(6_000);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());

  const after = await getPlotState(frame);
  expect(Number(after?.plot?.inventory?.wood || 0)).toBe(Number(before?.plot?.inventory?.wood || 0));
  expect(Number(after?.buildings?.find((entry) => entry?.buildingId === lumberBuildingId)?.outputBuffer?.wood || 0)).toBeGreaterThan(0);

  const replayAfter = await getJson(frame, '/api/founders-plot/replay');
  const afterActionCount = Array.isArray(replayAfter?.replay?.events)
    ? replayAfter.replay.events.filter((event) => event?.type === 'AGENT_ACTION_EXECUTED').length
    : 0;
  expect(afterActionCount).toBe(beforeActionCount);
  await expect(frame.locator('#foremanToolsLine')).toContainText(/fresh start|restart clover/i);
});

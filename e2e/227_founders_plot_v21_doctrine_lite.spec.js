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

async function prepareReadyLumberWithRuntime(frame) {
  const started = await startForemanRuntime(frame);
  expect(started?.ok).toBe(true);

  const placed = await placeFirstLumberCamp(frame, 'v21-doctrine-lumber');
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberBuildingId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v21-doctrine-lumber:queue'
  });
  expect(queueResp?.ok).toBe(true);

  await advancePlot(frame, 61_000);
  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);
}

test('V2.1 Doctrine Lite is reversible, scene-backed, and sends conflicts to the Exception Inbox', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));

  await expect(frame.getByTestId('foreman-doctrine-card')).toBeVisible();
  await expect(frame.getByTestId('foreman-doctrine-card')).toContainText('Teach one clear preference');

  await frame.getByTestId('foreman-doctrine-rule-PREFER_RESERVES').click();
  await expect(frame.getByTestId('foreman-doctrine-card')).toContainText('prefer reserves');

  const reservesState = await getPlotState(frame);
  expect(reservesState.foreman.doctrine.activeRules.map((rule) => rule.ruleId)).toContain('PREFER_RESERVES');
  expect(reservesState.foreman.doctrine.summary).toContain('prefer reserves');

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toContain('foreman-doctrine');
  expect(scene?.anchors?.find((entry) => entry.id === 'STATE:doctrine')?.status).toBe('PREFERENCES_SET');

  await frame.getByTestId('foreman-doctrine-rule-PREFER_SPEED').click();
  await expect(frame.getByTestId('foreman-exception-inbox')).toContainText('Choose Clover priority');
  await expect(frame.getByTestId('foreman-exception-item')).toHaveCount(1);

  const conflictState = await getPlotState(frame);
  expect(conflictState.foreman.doctrine.activeRules.map((rule) => rule.ruleId)).not.toContain('PREFER_SPEED');
  expect(conflictState.foreman.governance.openExceptions[0].requestedAction).toContain('PREFER_SPEED');

  await frame.getByTestId('foreman-doctrine-rule-PREFER_RESERVES').click();
  await frame.getByTestId('foreman-doctrine-rule-PREFER_SPEED').click();
  await expect(frame.getByTestId('foreman-doctrine-card')).toContainText('prefer speed');

  const speedState = await getPlotState(frame);
  expect(speedState.foreman.doctrine.activeRules.map((rule) => rule.ruleId)).toContain('PREFER_SPEED');
});

test('V2.1 Doctrine Lite appears in Foreman receipts and Morning Brief', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await prepareReadyLumberWithRuntime(frame);

  const doctrine = await frame.evaluate(async () => {
    return await window.__foundersPlotTest.setForemanDoctrineRule('PREFER_SPEED', true);
  });
  expect(doctrine?.result?.doctrine?.activeRules?.map((rule) => rule.ruleId)).toContain('PREFER_SPEED');

  const enabled = await frame.evaluate(async () => window.__foundersPlotTest.enableCollectReadyOutputs());
  expect(enabled?.ok).toBe(true);

  const tick = await frame.evaluate(async () => window.__foundersPlotTest.runForemanTick());
  expect(tick?.ok).toBe(true);
  expect(tick?.receipt?.doctrineUsed?.summary).toContain('prefer speed');

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frame.getByTestId('founders-receipt')).toContainText('prefer speed');

  const stateAfterTick = await getPlotState(frame);
  expect(stateAfterTick?.recap?.morningBrief?.doctrine).toContain('prefer speed');

  const recap = await getJson(frame, '/api/founders-plot/recap');
  expect(recap?.ok).toBe(true);
  expect(recap?.recap?.morningBrief?.doctrine).toContain('prefer speed');
});

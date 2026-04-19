const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
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

test('HQ2 surface shows the living Contract Board, Current Goal, and Standing Order controls without technical jargon', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  await expect(frame.getByTestId('founders-current-goal')).toBeVisible();
  await expect(frame.getByTestId('founders-current-goal')).toContainText(/farm|contract|tutorial/i);
  await expect(frame.getByTestId('founders-contract-board')).toBeVisible();
  await expect(frame.getByTestId('contract-offer')).toHaveCount(2);
  await expect(frame.getByTestId('founders-standing-order')).toBeVisible();
  await expect(frame.getByTestId('standing-order-careful')).toBeVisible();
  await expect(frame.getByTestId('standing-order-bold')).toBeVisible();
  await expect(frame.getByTestId('founders-foreman-status')).toContainText(/Foreman|Clover/i);

  const mainText = await frame.locator('body').textContent();
  expect(String(mainText || '')).not.toMatch(/\b(runtime|worker debug|json|mcp)\b/i);
});

test('the Foreman panel shows a plan and receipt controls after the first automated collect', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  await frame.getByTestId('foreman-start-btn').click();
  await expect(frame.getByTestId('founders-foreman-status')).toContainText(/watching|thinking|working/i);

  const standingOrderState = await getPlotState(frame);
  expect(standingOrderState?.foreman?.standingOrder).toBe('CAREFUL_STEWARD');

  const lumberId = String(
    (standingOrderState?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberId).toMatch(/^bld_/);

  const extraQueue = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberId,
    idempotencyKey: 'v11-ui-surfaces:lumber-queue'
  });
  expect(extraQueue?.ok).toBe(true);
  await advancePlot(frame, 61_000);
  const extraCollect = await runPlotTool(frame, 'et.plot.collect_outputs', {
    buildingId: lumberId,
    idempotencyKey: 'v11-ui-surfaces:lumber-collect'
  });
  expect(extraCollect?.ok).toBe(true);

  const firstOpenPad = (standingOrderState?.pads || []).find((pad) => pad && pad.occupied === false);
  expect(firstOpenPad).toBeTruthy();

  const farmPlaced = await runPlotTool(frame, 'et.plot.place_building', {
    type: 'FARM_PLOT',
    x: firstOpenPad.x,
    y: firstOpenPad.y,
    idempotencyKey: 'v11-ui-surfaces:place-farm'
  });
  expect(farmPlaced?.ok).toBe(true);
  await advancePlot(frame, 46_000);

  const farmId = String(
    (await getPlotState(frame))?.buildings?.find((building) => building?.type === 'FARM_PLOT')?.buildingId || ''
  );
  expect(farmId).toMatch(/^bld_/);

  const queueResp = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: farmId,
    idempotencyKey: 'v11-ui-surfaces:farm-queue'
  });
  expect(queueResp?.ok).toBe(true);
  await advancePlot(frame, 91_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  await frame.getByTestId('scheduler-collect-toggle').click();
  await frame.getByTestId('foreman-run-now-btn').click();

  await expect(frame.getByTestId('founders-plan-card')).toBeVisible();
  await expect(frame.getByTestId('founders-receipt')).toBeVisible();
  await expect(frame.getByTestId('founders-receipt')).toContainText(/Careful Steward|Collect ready outputs/i);
  await expect(frame.getByTestId('receipt-ask-next-time')).toBeVisible();
  await expect(frame.getByTestId('receipt-pause-foreman')).toBeVisible();
});

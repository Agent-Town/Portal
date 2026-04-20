const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getPlotState,
  openFoundersPlotFrame,
  runLumberCycle,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Welcome Sign upgrade becomes available, consumes resources once, and improves public charm', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String(state?.buildings?.find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  const extraWood = await runLumberCycle(frame, lumberBuildingId, 'v12-landmark-fund');
  expect(extraWood?.ok).toBe(true);

  const before = await getPlotState(frame);
  expect(before?.plot?.inventory?.wood).toBeGreaterThanOrEqual(4);
  expect(before?.plot?.inventory?.coin).toBeGreaterThanOrEqual(8);
  expect(before?.landmarks?.publicSquare?.level).toBe(0);

  const upgraded = await runPlotTool(frame, 'et.plot.town.upgrade_landmark', {
    landmarkId: 'public_square_welcome_sign',
    idempotencyKey: 'v12-landmark-upgrade'
  });
  expect(upgraded?.ok).toBe(true);
  expect(upgraded?.data?.landmark).toEqual(expect.objectContaining({
    landmarkId: 'public_square_welcome_sign',
    level: 1,
    label: 'Welcome Sign'
  }));
  expect(upgraded?.data?.signalDelta?.publicCharm).toBe(10);

  const after = await getPlotState(frame);
  expect(after?.landmarks?.publicSquare?.level).toBe(1);
  expect(after?.plot?.inventory?.wood).toBe(before.plot.inventory.wood - 4);
  expect(after?.plot?.inventory?.coin).toBe(before.plot.inventory.coin - 8);
  expect(after?.townSignals?.publicCharm).toBeGreaterThan(before?.townSignals?.publicCharm || 0);

  const second = await runPlotTool(frame, 'et.plot.town.upgrade_landmark', {
    landmarkId: 'public_square_welcome_sign',
    idempotencyKey: 'v12-landmark-upgrade'
  });
  expect(second?.ok).toBe(true);
  expect(second?.data?.landmark?.level).toBe(1);

  await advancePlot(frame, 1_000);
  await expect(frame.locator('body')).toContainText('Welcome Sign');
});

const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getPlotState,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('fresh Founders Plot shows one obvious first action without technical game-loop jargon', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('founders-quest-cta')).toContainText(/lumber|build|place/i);

  const mainText = await frame.locator('body').innerText();
  expect(String(mainText || '')).not.toMatch(/\b(provider|oauth|debug|runtime|wallet|blockchain)\b/i);

  const state = await getPlotState(frame);
  expect(state?.plot?.hqLevel).toBe(1);
  expect(state?.plot?.inventory).toEqual(expect.objectContaining({
    wood: 0,
    stone: 0,
    food: 0,
    coin: 20
  }));
  expect(state?.plot?.constructionSlots).toBe(1);
});

test('the first Lumber Camp is free, First Timber rewards once, and HQ2 becomes reachable', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const placed = await placeFirstLumberCamp(frame, 'v11-first-lumber');
  expect(placed?.ok).toBe(true);

  const afterPlace = await getPlotState(frame);
  expect(afterPlace?.plot?.inventory?.coin).toBe(20);
  expect(afterPlace?.plot?.inventory?.wood).toBe(0);

  const lumberBuildingId = String(
    (afterPlace?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || ''
  );
  expect(lumberBuildingId).toMatch(/^bld_/);

  await advancePlot(frame, 31_000);
  const firstQueue = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-first-timber:queue:1'
  });
  expect(firstQueue?.ok).toBe(true);

  await advancePlot(frame, 61_000);
  const firstCollect = await runPlotTool(frame, 'et.plot.collect_outputs', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-first-timber:collect:1'
  });
  expect(firstCollect?.ok).toBe(true);

  const afterFirstCollect = await getPlotState(frame);
  expect(afterFirstCollect?.plot?.inventory?.wood).toBe(6);
  expect(afterFirstCollect?.plot?.inventory?.food).toBe(10);
  expect(afterFirstCollect?.plot?.townXp).toBe(25);

  const secondQueue = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-first-timber:queue:2'
  });
  expect(secondQueue?.ok).toBe(true);

  await advancePlot(frame, 61_000);
  const secondCollect = await runPlotTool(frame, 'et.plot.collect_outputs', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v11-first-timber:collect:2'
  });
  expect(secondCollect?.ok).toBe(true);

  const afterSecondCollect = await getPlotState(frame);
  expect(afterSecondCollect?.plot?.inventory?.wood).toBe(12);
  expect(afterSecondCollect?.plot?.inventory?.food).toBe(10);
  expect(afterSecondCollect?.plot?.townXp).toBe(25);

  const hq2State = await bootstrapToHq2(frame);
  expect(hq2State?.plot?.hqLevel).toBe(2);
  expect(hq2State?.unlocks?.buildingTypes).toContain('FARM_PLOT');
});

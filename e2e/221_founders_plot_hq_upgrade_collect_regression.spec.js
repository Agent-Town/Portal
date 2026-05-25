const { test, expect } = require('@playwright/test');
const path = require('path');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  runLumberCycle,
  runPlotTool
} = require('./helpers/founders_plot');

process.env.STORE_PATH = process.env.STORE_PATH || path.join(process.cwd(), 'data', 'store.e2e.sqlite');
const { loadPlotByPairId, savePlotGraph } = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function firstBuildingId(frame, type) {
  const state = await getPlotState(frame);
  return String((state?.buildings || []).find((building) => building?.type === type)?.buildingId || '');
}

async function resolveEarlyHq2Choices(frame) {
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_campfire_choice',
    optionId: 'raise_waymarkers',
    idempotencyKey: 'hq2-collect-regression:first-choice'
  }))?.ok).toBe(true);
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_supply_council_choice',
    optionId: 'host_work_bee',
    idempotencyKey: 'hq2-collect-regression:supply-choice'
  }))?.ok).toBe(true);
}

async function resetSimulationClock(frame) {
  const view = await getPlotState(frame);
  const pairId = String(view?.plot?.pairId || '');
  expect(pairId).toBeTruthy();
  const graph = loadPlotByPairId(pairId);
  expect(graph).toBeTruthy();
  const nowMs = Date.now();
  graph.plot.lastSimulatedAt = nowMs;
  graph.plot.updatedAt = nowMs;
  savePlotGraph(graph);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
}

test('HQ level 2 upgrade in progress still allows browser collection from Lumber Camp', async ({ page }) => {
  test.setTimeout(60_000);
  const frame = await openFoundersPlotFrame(page);

  const placed = await placeFirstLumberCamp(frame, 'hq2-collect-regression:place-lumber');
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberId = await firstBuildingId(frame, 'LUMBER_CAMP');
  expect(lumberId).toMatch(/^bld_/);
  expect((await runLumberCycle(frame, lumberId, 'hq2-collect-regression:first-lumber'))?.ok).toBe(true);
  await resolveEarlyHq2Choices(frame);
  await resetSimulationClock(frame);

  expect((await runPlotTool(frame, 'et.plot.upgrade_building', {
    idempotencyKey: 'hq2-collect-regression:hq2'
  }))?.ok).toBe(true);

  await expect(frame.locator('#questTitle')).toHaveText('Headquarters level 2 is opening');
  await expect(frame.getByTestId('founders-quest-cta')).toHaveText('Work in progress');
  await expect(frame.getByTestId('founders-quest-cta')).toBeDisabled();

  expect((await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberId,
    idempotencyKey: 'hq2-collect-regression:lumber-during-hq'
  }))?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  let state = await getPlotState(frame);
  const woodBeforeCollect = Number(state?.plot?.inventory?.wood || 0);
  expect(state?.plot?.hqLevel).toBe(1);
  expect(state?.currentGoal?.title).toBe('Collect while Headquarters opens');
  expect(state?.currentGoal?.primaryAction).toEqual(expect.objectContaining({
    type: 'COLLECT_OUTPUTS',
    buildingId: lumberId
  }));

  await expect(frame.locator('#questTitle')).toHaveText('Collect while Headquarters opens');
  await expect(frame.getByTestId('founders-quest-cta')).toHaveText(/Collect/);
  await expect(frame.getByTestId('founders-quest-cta')).toBeEnabled();
  await frame.getByTestId('founders-quest-cta').click();

  await frame.waitForFunction((id) => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumber = state?.buildings?.find((building) => building?.buildingId === id);
    return lumber?.state === 'READY' && Number(state?.plot?.inventory?.wood || 0) > 0;
  }, lumberId);

  state = await getPlotState(frame);
  expect(Number(state?.plot?.inventory?.wood || 0)).toBeGreaterThan(woodBeforeCollect);
  expect(state?.plot?.hqLevel).toBe(1);
  expect(state?.buildings?.find((building) => building?.type === 'HQ')?.state).toBe('UPGRADING');
  expect(state?.currentGoal?.title).toBe('Headquarters level 2 is opening');

  await advancePlot(frame, 61_000);
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 2);
});

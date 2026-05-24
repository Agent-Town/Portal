const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame,
  startForemanRuntime
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function clickSceneAction(frame, testId) {
  const action = frame.getByTestId(testId);
  await expect(action).toBeVisible({ timeout: 5000 });
  await action.click();
}

async function waitForBuilding(frame, type, predicate = () => true) {
  await frame.waitForFunction(({ targetType }) => {
    const state = window.__foundersPlotTest.getState()?.state;
    const building = Array.isArray(state?.buildings)
      ? state.buildings.find((entry) => entry?.type === targetType)
      : null;
    return !!building;
  }, { targetType: type }, { timeout: 5000 });
  const state = await getPlotState(frame);
  const building = Array.isArray(state?.buildings)
    ? state.buildings.find((entry) => entry?.type === type) || null
    : null;
  expect(building).toBeTruthy();
  expect(predicate(building)).toBe(true);
  return building;
}

async function firstSceneLumberLoop(frame) {
  await clickSceneAction(frame, 'founders-scene-action-place-LUMBER_CAMP');
  await waitForBuilding(frame, 'LUMBER_CAMP');

  await advancePlot(frame, 31_000);
  await clickSceneAction(frame, 'founders-scene-action-queue');
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumber = Array.isArray(state?.buildings)
      ? state.buildings.find((entry) => entry?.type === 'LUMBER_CAMP')
      : null;
    return lumber?.runningJob?.status === 'RUNNING';
  }, null, { timeout: 5000 });

  await advancePlot(frame, 61_000);
  await clickSceneAction(frame, 'founders-scene-action-collect');
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_campfire_choice';
  }, null, { timeout: 5000 });
}

test('the extended first-session arc chains scene-first Public Square choices into HQ2 and Farm setup', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const frame = await openFoundersPlotFrame(page);

  await firstSceneLumberLoop(frame);

  await clickSceneAction(frame, 'founders-scene-action-town-option-host_neighbor_supper');
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_supply_council_choice';
  }, null, { timeout: 5000 });

  let state = await getPlotState(frame);
  expect(state?.townOpportunity?.completed?.map((entry) => entry.opportunityId)).toEqual(['first_campfire_choice']);
  expect(state?.townOpportunity?.active?.options?.map((option) => option.optionId)).toEqual([
    'hire_depot_haulers',
    'host_work_bee'
  ]);
  await expect(frame.getByTestId('founders-scene-actions')).toHaveAttribute('data-anchor-object-id', 'PUBLIC_SQUARE');
  await expect(frame.getByTestId('founders-scene-action-town-option-host_work_bee')).toContainText('+18 wood, 4 food');

  await startForemanRuntime(frame);
  const observation = await frame.evaluate(async () => window.__foundersPlotTest.getForemanObservation());
  expect(observation?.ok).toBe(true);
  expect(observation?.observation?.currentGoal?.owner).toBe('town_opportunity');
  expect(observation?.observation?.townOpportunity?.opportunityId).toBe('first_supply_council_choice');

  await clickSceneAction(frame, 'founders-scene-action-town-option-host_work_bee');
  await frame.waitForFunction(() => {
    return !window.__foundersPlotTest.getState()?.state?.townOpportunity?.active;
  }, null, { timeout: 5000 });

  state = await getPlotState(frame);
  expect(state?.plot?.inventory).toEqual(expect.objectContaining({
    wood: 24,
    food: 10,
    coin: 18
  }));
  expect(state?.plot?.townXp).toBe(35);
  expect(state?.townSignals?.neighborGoodwill).toBe(67);
  expect(state?.townSignals?.publicCharm).toBe(3);
  expect(state?.currentGoal?.primaryAction).toEqual(expect.objectContaining({ type: 'UPGRADE_HQ' }));

  await clickSceneAction(frame, 'founders-scene-action-upgrade');
  await advancePlot(frame, 121_000);
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 2
      && window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'level_two_charter_choice';
  }, null, { timeout: 5000 });

  state = await getPlotState(frame);
  expect(state?.plot?.hqLevel).toBe(2);
  expect(state?.townOpportunity?.completed?.map((entry) => entry.opportunityId)).toEqual([
    'first_campfire_choice',
    'first_supply_council_choice'
  ]);
  expect(state?.townOpportunity?.active?.options?.map((option) => option.optionId)).toEqual([
    'seed_farm_coop',
    'organize_request_board'
  ]);
  await expect(frame.getByTestId('founders-scene-action-town-option-seed_farm_coop')).toContainText('+10 wood, 8 food');

  await clickSceneAction(frame, 'founders-scene-action-town-option-seed_farm_coop');
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return !state?.townOpportunity?.active && state?.currentGoal?.primaryAction?.buildingType === 'FARM_PLOT';
  }, null, { timeout: 5000 });

  state = await getPlotState(frame);
  expect(state?.townOpportunity?.completed?.map((entry) => entry.opportunityId)).toEqual([
    'first_campfire_choice',
    'first_supply_council_choice',
    'level_two_charter_choice'
  ]);
  expect(state?.plot?.inventory).toEqual(expect.objectContaining({
    wood: 14,
    food: 8,
    coin: 15
  }));
  expect(state?.plot?.townXp).toBe(60);
  expect(state?.townSignals?.neighborGoodwill).toBe(73);

  await clickSceneAction(frame, 'founders-scene-action-place-FARM_PLOT');
  await waitForBuilding(frame, 'FARM_PLOT', (building) => building.state === 'UNDER_CONSTRUCTION');
  await clickSceneAction(frame, 'founders-scene-action-open-contract-board');
  await expect(frame.getByTestId('founders-contract-board')).toBeVisible({ timeout: 5000 });
});

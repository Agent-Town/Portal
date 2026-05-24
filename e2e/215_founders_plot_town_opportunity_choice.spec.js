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

async function bootstrapFirstTownOpportunity(frame) {
  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP');
  }, null, { timeout: 5000 });

  await advancePlot(frame, 31_000);
  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => (
      building?.type === 'LUMBER_CAMP' && building?.state === 'PRODUCING'
    ));
  }, null, { timeout: 5000 });

  await advancePlot(frame, 61_000);
  await frame.getByTestId('founders-quest-cta').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_campfire_choice';
  }, null, { timeout: 5000 });
}

async function threeInfo(frame) {
  return frame.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
}

test('first timber unlocks a Public Square opportunity that the Three.js scene and Clover can observe', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await bootstrapFirstTownOpportunity(frame);

  const state = await getPlotState(frame);
  expect(state?.currentGoal?.owner).toBe('opportunity');
  expect(state?.currentGoal?.primaryAction).toEqual(expect.objectContaining({
    type: 'VIEW_TOWN_OPPORTUNITY',
    opportunityId: 'first_campfire_choice'
  }));
  expect(state?.townOpportunity?.active?.options?.map((option) => option.optionId)).toEqual([
    'raise_waymarkers',
    'host_neighbor_supper'
  ]);
  expect(state?.foreman?.recommendation).toContain('town opportunity');

  await frame.waitForFunction(() => {
    const info = window.__foundersPlotTest.getThreeSceneInfo();
    return info?.parity?.badges?.some((badge) => badge.objectId === 'PUBLIC_SQUARE' && badge.type === 'opportunity');
  }, null, { timeout: 5000 });
  const info = await threeInfo(frame);
  const signalsAnchor = info.coverage.anchors.find((anchor) => anchor.id === 'STATE:signals');
  expect(signalsAnchor).toEqual(expect.objectContaining({
    targetObjectId: 'PUBLIC_SQUARE',
    status: 'READY',
    count: 1
  }));
  const sceneSignalsAnchor = await frame.evaluate(() => {
    return window.__foundersPlotTest.getScene()?.stateCoverage?.anchors?.find((anchor) => anchor.id === 'STATE:signals') || null;
  });
  expect(sceneSignalsAnchor).toEqual(expect.objectContaining({
    objectId: 'PUBLIC_SQUARE',
    status: 'READY',
    count: 1
  }));
  expect(sceneSignalsAnchor.value).toContain('A campfire decision');
  expect(info.parity.badges).toEqual(expect.arrayContaining([
    expect.objectContaining({ objectId: 'PUBLIC_SQUARE', type: 'opportunity', label: 'Choice' })
  ]));
  const sceneDrawerBadges = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.drawerBadges || {});
  expect(sceneDrawerBadges.signals).toBe(1);

  await startForemanRuntime(frame);
  const observation = await frame.evaluate(async () => window.__foundersPlotTest.getForemanObservation());
  expect(observation?.ok).toBe(true);
  expect(observation?.observation?.currentGoal?.owner).toBe('town_opportunity');
  expect(observation?.observation?.townOpportunity?.opportunityId).toBe('first_campfire_choice');

  await frame.getByTestId('founders-quest-cta').click();
  await expect(frame.getByTestId('town-opportunity-card')).toBeVisible();
  await expect(frame.getByTestId('town-opportunity-option-raise_waymarkers')).toContainText('Cost: 4 wood, 2 coin.');
  await expect(frame.getByTestId('town-opportunity-option-host_neighbor_supper')).toContainText('Cost: 4 food, 2 coin.');

  await frame.getByTestId('town-opportunity-option-raise_waymarkers').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_supply_council_choice';
  }, null, { timeout: 5000 });

  const after = await getPlotState(frame);
  expect(after?.townOpportunity?.completed?.[0]).toEqual(expect.objectContaining({
    opportunityId: 'first_campfire_choice',
    optionId: 'raise_waymarkers'
  }));
  expect(after?.plot?.inventory).toEqual(expect.objectContaining({
    wood: 2,
    food: 10,
    coin: 18
  }));
  expect(after?.plot?.townXp).toBe(31);
  expect(after?.townSignals?.depotReadiness).toBe(58);
  expect(after?.townSignals?.publicCharm).toBe(4);
  expect(after?.townOpportunity?.active?.opportunityId).toBe('first_supply_council_choice');
  expect(after?.currentGoal?.owner).toBe('opportunity');
  await expect(frame.getByTestId('town-opportunity-card')).toContainText('A supply council');
  await expect(frame.getByTestId('town-opportunity-option-hire_depot_haulers')).toContainText('Cost: 4 coin.');
  await expect(frame.getByTestId('town-opportunity-option-host_work_bee')).toContainText('+18 wood, 4 food');
});

test('the alternate town opportunity option changes goodwill instead of depot readiness', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await bootstrapFirstTownOpportunity(frame);
  await frame.getByTestId('founders-quest-cta').click();
  await expect(frame.getByTestId('town-opportunity-card')).toBeVisible();
  await frame.getByTestId('town-opportunity-option-host_neighbor_supper').click();
  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_supply_council_choice';
  }, null, { timeout: 5000 });

  const after = await getPlotState(frame);
  expect(after?.townOpportunity?.completed?.[0]).toEqual(expect.objectContaining({
    opportunityId: 'first_campfire_choice',
    optionId: 'host_neighbor_supper'
  }));
  expect(after?.plot?.inventory).toEqual(expect.objectContaining({
    wood: 6,
    food: 6,
    coin: 18
  }));
  expect(after?.plot?.townXp).toBe(31);
  expect(after?.townSignals?.neighborGoodwill).toBe(60);
  expect(after?.townSignals?.marketConfidence).toBe(53);
  expect(after?.townSignals?.depotReadiness).toBe(50);
  expect(after?.townOpportunity?.active?.opportunityId).toBe('first_supply_council_choice');
  expect(after?.townOpportunity?.active?.options?.map((option) => option.optionId)).toEqual([
    'hire_depot_haulers',
    'host_work_bee'
  ]);
});

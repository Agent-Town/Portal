const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame,
  postJson,
  runLumberCycle,
  runPlotTool,
  runProductionCycle
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const BUILD_COSTS = {
  QUARRY: { wood: 15, coin: 5 },
  FARM_PLOT: { wood: 10, coin: 5 },
  WORKSHOP: { wood: 20, stone: 10, coin: 10 },
  MARKET_STALL: { wood: 15, stone: 10, coin: 10 }
};

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function firstOpenPad(frame) {
  const state = await getPlotState(frame);
  return Array.isArray(state?.pads) ? state.pads.find((pad) => pad && pad.occupied === false) || null : null;
}

async function buildingId(frame, type) {
  const state = await getPlotState(frame);
  return String((state?.buildings || []).find((building) => building?.type === type)?.buildingId || '');
}

async function placeBuilding(frame, type, keyPrefix) {
  const pad = await firstOpenPad(frame);
  expect(pad).toBeTruthy();
  const placed = await runPlotTool(frame, 'et.plot.place_building', {
    type,
    x: pad.x,
    y: pad.y,
    idempotencyKey: `${keyPrefix}:place`
  });
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 91_000);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
  return await buildingId(frame, type);
}

async function collectUntil(frame, type, resource, amount, keyPrefix) {
  let id = await buildingId(frame, type);
  if (!id && type === 'QUARRY') id = await placeBuilding(frame, 'QUARRY', `${keyPrefix}:quarry`);
  expect(id).toMatch(/^bld_/);
  for (let index = 0; index < 12; index += 1) {
    const state = await getPlotState(frame);
    if (Number(state?.plot?.inventory?.[resource] || 0) >= amount) return;
    const response = type === 'LUMBER_CAMP'
      ? await runLumberCycle(frame, id, `${keyPrefix}:${resource}:${index}`)
      : await runProductionCycle(frame, id, `${keyPrefix}:${resource}:${index}`);
    expect(response?.ok).toBe(true);
  }
  const state = await getPlotState(frame);
  expect(Number(state?.plot?.inventory?.[resource] || 0)).toBeGreaterThanOrEqual(amount);
}

async function ensureCost(frame, cost = {}, keyPrefix = 'cost') {
  if (Number(cost.wood || 0) > 0) await collectUntil(frame, 'LUMBER_CAMP', 'wood', Number(cost.wood || 0), `${keyPrefix}:wood`);
  if (Number(cost.food || 0) > 0) await collectUntil(frame, 'FARM_PLOT', 'food', Number(cost.food || 0), `${keyPrefix}:food`);
  if (Number(cost.stone || 0) > 0) await collectUntil(frame, 'QUARRY', 'stone', Number(cost.stone || 0), `${keyPrefix}:stone`);
  const state = await getPlotState(frame);
  if (Number(cost.coin || 0) > 0) {
    expect(Number(state?.plot?.inventory?.coin || 0)).toBeGreaterThanOrEqual(Number(cost.coin || 0));
  }
}

async function reachV15SecondContractComplete(frame) {
  await placeBuilding(frame, 'LUMBER_CAMP', 'v16:lumber');
  const lumberId = await buildingId(frame, 'LUMBER_CAMP');
  expect((await runLumberCycle(frame, lumberId, 'v16:first-lumber'))?.ok).toBe(true);

  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_campfire_choice');
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_campfire_choice',
    optionId: 'raise_waymarkers',
    idempotencyKey: 'v16:opportunity:first'
  }))?.ok).toBe(true);
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_supply_council_choice',
    optionId: 'host_work_bee',
    idempotencyKey: 'v16:opportunity:supply'
  }))?.ok).toBe(true);
  expect((await runPlotTool(frame, 'et.plot.upgrade_building', {
    idempotencyKey: 'v16:hq2'
  }))?.ok).toBe(true);
  await advancePlot(frame, 121_000);
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 2);
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'level_two_charter_choice',
    optionId: 'seed_farm_coop',
    idempotencyKey: 'v16:opportunity:charter'
  }))?.ok).toBe(true);

  await placeBuilding(frame, 'FARM_PLOT', 'v16:farm');
  let state = await getPlotState(frame);
  const firstSupply = state.contracts.offers.find((offer) => offer.kind === 'SUPPLY');
  expect(firstSupply?.contractId).toBeTruthy();
  expect((await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: firstSupply.contractId,
    idempotencyKey: 'v16:first-contract:accept'
  }))?.ok).toBe(true);

  await collectUntil(frame, 'LUMBER_CAMP', 'wood', firstSupply.requirements.resources.wood, 'v16:first-contract');
  state = await getPlotState(frame);
  expect(state.contracts.activeContract.status).toBe('READY_TO_TURN_IN');
  expect((await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId: state.contracts.activeContract.contractId,
    idempotencyKey: 'v16:first-contract:turn-in'
  }))?.ok).toBe(true);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());

  const farmId = await buildingId(frame, 'FARM_PLOT');
  expect((await runProductionCycle(frame, farmId, 'v16:first-food'))?.ok).toBe(true);
  await collectUntil(frame, 'LUMBER_CAMP', 'wood', 30, 'v16:hq3');
  await collectUntil(frame, 'FARM_PLOT', 'food', 12, 'v16:hq3');
  expect((await runPlotTool(frame, 'et.plot.upgrade_building', {
    idempotencyKey: 'v16:hq3'
  }))?.ok).toBe(true);
  await advancePlot(frame, 181_000);
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 3);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());

  state = await getPlotState(frame);
  const readyOffer = state.contracts.offers.find((offer) => {
    const buildings = Array.isArray(offer?.requirements?.buildings) ? offer.requirements.buildings : [];
    const resources = offer?.requirements?.resources || {};
    const hasBuildings = buildings.every((req) => (
      (state.buildings || []).filter((building) => building.type === req.buildingType && building.state !== 'UNDER_CONSTRUCTION').length >= Number(req.minCount || 1)
    ));
    const hasResources = ['wood', 'stone', 'food', 'coin'].every((key) => Number(resources[key] || 0) <= Number(state.plot.inventory[key] || 0));
    return hasBuildings && hasResources;
  }) || state.contracts.offers[0];
  expect(readyOffer?.contractId).toBeTruthy();
  expect((await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: readyOffer.contractId,
    idempotencyKey: 'v16:second-contract:accept'
  }))?.ok).toBe(true);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
  state = await getPlotState(frame);

  const active = state.contracts.activeContract;
  const requirements = active.requirements || {};
  for (const req of Array.isArray(requirements.buildings) ? requirements.buildings : []) {
    const count = (state.buildings || []).filter((building) => building.type === req.buildingType && building.state !== 'UNDER_CONSTRUCTION').length;
    if (count < Number(req.minCount || 1)) {
      await ensureCost(frame, BUILD_COSTS[req.buildingType] || {}, `v16:second-contract:${req.buildingType}:cost`);
      await placeBuilding(frame, req.buildingType, `v16:second-contract:${req.buildingType}`);
    }
  }
  const resources = requirements.resources || {};
  if (Number(resources.wood || 0) > 0) await collectUntil(frame, 'LUMBER_CAMP', 'wood', resources.wood, 'v16:second-contract');
  if (Number(resources.food || 0) > 0) await collectUntil(frame, 'FARM_PLOT', 'food', resources.food, 'v16:second-contract');
  if (Number(resources.stone || 0) > 0) await collectUntil(frame, 'QUARRY', 'stone', resources.stone, 'v16:second-contract');

  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
  state = await getPlotState(frame);
  expect(state.contracts.activeContract.status).toBe('READY_TO_TURN_IN');
  expect((await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId: state.contracts.activeContract.contractId,
    idempotencyKey: 'v16:second-contract:turn-in'
  }))?.ok).toBe(true);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
}

test('V1.6 civic scenario starts at Public Square, appears in Three.js, completes, and recaps', async ({ page }) => {
  test.setTimeout(95_000);
  const frame = await openFoundersPlotFrame(page);

  await reachV15SecondContractComplete(frame);
  let state = await getPlotState(frame);
  expect(state.scenarios.offers[0]?.scenarioId).toBe('storm_prep');
  expect(state.currentGoal.owner).toBe('scenario');

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toEqual(expect.arrayContaining(['civic-scenarios']));
  expect(scene?.anchors?.find((entry) => entry.id === 'STATE:scenarios')?.value).toContain('Storm Prep');

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('signals'));
  await expect(frame.getByTestId('civic-scenario-offer')).toBeVisible();
  await frame.getByTestId('scenario-start-btn').click();
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.scenarios?.active?.scenarioId === 'storm_prep');

  state = await getPlotState(frame);
  expect(state.scenarios.active.status).toBe('ACTIVE');
  expect(state.foreman.companionAdvice.recommendation).toContain('Storm Prep');
  expect(state.foreman.companionAdvice.recommendation).toContain('competing with town requests');

  const thirdOffer = state.contracts.offers[0];
  expect(thirdOffer?.contractId).toBeTruthy();
  expect((await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: thirdOffer.contractId,
    idempotencyKey: 'v16:third-contract:accept'
  }))?.ok).toBe(true);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
  state = await getPlotState(frame);
  expect(state.contracts.activeContract?.contractId).toBe(thirdOffer.contractId);

  await collectUntil(frame, 'LUMBER_CAMP', 'wood', 12, 'v16:scenario');
  await collectUntil(frame, 'FARM_PLOT', 'food', 8, 'v16:scenario');
  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('signals'));
  await frame.getByTestId('scenario-task-brace_roofs').click();
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.scenarios?.active?.completedTasks === 1);
  await frame.getByTestId('scenario-task-stock_supper').click();
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.scenarios?.completed?.[0]?.status === 'COMPLETED');

  state = await getPlotState(frame);
  expect(state.scenarios.completed[0].title).toBe('Storm Prep');
  expect(state.scenarios.completed[0].completedTasks).toBeGreaterThanOrEqual(2);

  const recap = await frame.evaluate(async () => {
    const response = await fetch('/api/founders-plot/recap', { credentials: 'include' });
    return await response.json();
  });
  expect(JSON.stringify(recap.recap)).toContain('Storm Prep');
});

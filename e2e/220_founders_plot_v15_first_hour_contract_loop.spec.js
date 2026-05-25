const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getJson,
  getPlotState,
  openFoundersPlotFrame,
  postJson,
  runLumberCycle,
  runProductionCycle,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

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

async function buildLumberAndReachHq2(frame) {
  const pad = await firstOpenPad(frame);
  expect(pad).toBeTruthy();
  expect((await runPlotTool(frame, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: pad.x,
    y: pad.y,
    idempotencyKey: 'v15:lumber:place'
  }))?.ok).toBe(true);

  await advancePlot(frame, 31_000);
  const lumberId = await buildingId(frame, 'LUMBER_CAMP');
  expect(lumberId).toMatch(/^bld_/);
  expect((await runLumberCycle(frame, lumberId, 'v15:first-lumber'))?.ok).toBe(true);

  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_campfire_choice');
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_campfire_choice',
    optionId: 'raise_waymarkers',
    idempotencyKey: 'v15:opportunity:first'
  }))?.ok).toBe(true);
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_supply_council_choice',
    optionId: 'host_work_bee',
    idempotencyKey: 'v15:opportunity:supply'
  }))?.ok).toBe(true);
  expect((await runPlotTool(frame, 'et.plot.upgrade_building', {
    idempotencyKey: 'v15:hq2'
  }))?.ok).toBe(true);
  await advancePlot(frame, 121_000);
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 2);

  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'level_two_charter_choice',
    optionId: 'seed_farm_coop',
    idempotencyKey: 'v15:opportunity:charter'
  }))?.ok).toBe(true);
}

async function buildFirstFarm(frame) {
  const pad = await firstOpenPad(frame);
  expect(pad).toBeTruthy();
  expect((await runPlotTool(frame, 'et.plot.place_building', {
    type: 'FARM_PLOT',
    x: pad.x,
    y: pad.y,
    idempotencyKey: 'v15:farm:place'
  }))?.ok).toBe(true);
  await advancePlot(frame, 46_000);
  await frame.waitForFunction(() => {
    const farm = window.__foundersPlotTest.getState()?.state?.buildings?.find((building) => building?.type === 'FARM_PLOT');
    return farm?.state === 'READY';
  });
}

test('V1.5 first-hour loop offers named contracts, Morning Brief, and lightweight Clover teaching in Three.js', async ({ page }) => {
  test.setTimeout(75_000);
  let frame = await openFoundersPlotFrame(page);

  await buildLumberAndReachHq2(frame);
  await buildFirstFarm(frame);

  let state = await getPlotState(frame);
  expect(state?.currentGoal?.title).toMatch(/choose/i);
  expect(state?.contracts?.boardLocked).toBe(false);
  expect(state?.contracts?.offers?.length).toBeGreaterThanOrEqual(2);
  expect(state?.contracts?.recommendation).toEqual(expect.objectContaining({
    contractId: expect.any(String),
    reason: expect.stringContaining('Clover')
  }));
  expect([...new Set(state.contracts.offers.map((offer) => offer.kind))].sort()).toEqual(['BUILD', 'PREPARATION', 'SUPPLY']);

  for (const offer of state.contracts.offers) {
    expect(offer.requesterSnapshot?.displayName).toBeTruthy();
    expect(offer.requesterSnapshot?.institution).toBeTruthy();
  }

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(scene?.domains?.map((entry) => entry.id)).toEqual(expect.arrayContaining(['contracts', 'requesters', 'journal-recap']));
  expect(scene?.anchors?.find((entry) => entry.id === 'STATE:requesters')?.value).toMatch(/Depot|Market|Neighbor|Town Hall/i);

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('contracts'));
  await expect(frame.getByTestId('founders-contract-board')).toBeVisible();
  await expect(frame.getByTestId('contract-offer')).toHaveCount(state.contracts.offers.length);
  await expect(frame.getByTestId('contract-recommended-badge')).toBeVisible();
  await expect(frame.getByTestId('contract-clover-reason')).toContainText('Clover');

  const supply = state.contracts.offers.find((offer) => offer.kind === 'SUPPLY');
  expect(supply?.contractId).toBeTruthy();
  expect((await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: supply.contractId,
    idempotencyKey: 'v15:supply:accept'
  }))?.ok).toBe(true);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());

  state = await getPlotState(frame);
  expect(state?.contracts?.activeContract?.kind).toBe('SUPPLY');
  expect(state?.foreman?.companionAdvice?.recommendation).toContain(state.contracts.activeContract.requesterSnapshot.displayName);

  const blockedForeman = await postJson(frame, '/api/founders-plot/foreman/session/start', { brainReady: false });
  expect(blockedForeman?.ok).toBe(false);
  expect(blockedForeman?.error?.code).toBe('BRAIN_REQUIRED');

  const lumberId = await buildingId(frame, 'LUMBER_CAMP');
  for (let index = 0; index < 3; index += 1) {
    const cycle = await runLumberCycle(frame, lumberId, `v15:supply:lumber:${index}`);
    expect(cycle?.ok).toBe(true);
    const active = (await getPlotState(frame))?.contracts?.activeContract;
    if (active?.status === 'READY_TO_TURN_IN') break;
  }

  state = await getPlotState(frame);
  expect(state?.contracts?.activeContract?.status).toBe('READY_TO_TURN_IN');
  const completed = await postJson(frame, '/api/founders-plot/contracts/turn-in', {
    contractId: state.contracts.activeContract.contractId,
    idempotencyKey: 'v15:supply:turn-in'
  });
  expect(completed?.ok).toBe(true);
  expect(completed?.contract?.status).toBe('COMPLETED');
  expect(completed?.contract?.requesterSnapshot?.displayName).toBe(supply.requesterSnapshot.displayName);

  const recap = await getJson(frame, '/api/founders-plot/recap');
  expect(recap?.ok).toBe(true);
  expect(recap?.recap?.morningBrief).toEqual(expect.objectContaining({
    title: 'Morning brief',
    available: true,
    changed: expect.any(String),
    clover: expect.any(String),
    nextAction: expect.any(String)
  }));
  expect(JSON.stringify(recap.recap)).toContain(supply.requesterSnapshot.displayName);

  frame = await openFoundersPlotFrame(page);
  state = await getPlotState(frame);
  expect(state?.contracts?.completed?.[0]?.requesterSnapshot?.displayName).toBe(supply.requesterSnapshot.displayName);

  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('recap'));
  await expect(frame.getByTestId('founders-morning-brief')).toBeVisible();
  await expect(frame.getByTestId('founders-morning-brief')).toContainText('Clover');

  const preference = await frame.evaluate(async () => window.__foundersPlotTest.recordForemanPreference('PREFER_RESERVES'));
  expect(preference?.ok).toBe(true);
  expect(preference?.state?.foreman?.teachingPreferences?.contractPreference).toBe('RESERVES');
  expect(preference?.state?.contracts?.recommendation?.reason).toContain('reserves');

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frame.getByTestId('founders-teaching-actions')).toBeVisible();
  await expect(frame.getByTestId('founders-teaching-latest')).toContainText('Prefer reserves');

  const farmId = await buildingId(frame, 'FARM_PLOT');
  expect(farmId).toMatch(/^bld_/);
  expect((await runProductionCycle(frame, farmId, 'v15:hq3:farm'))?.ok).toBe(true);

  for (let index = 0; index < 8; index += 1) {
    state = await getPlotState(frame);
    if (
      Number(state?.plot?.inventory?.wood || 0) >= 30
      && Number(state?.plot?.inventory?.food || 0) >= 12
      && state?.currentGoal?.primaryAction?.type === 'UPGRADE_HQ'
    ) break;
    expect((await runLumberCycle(frame, lumberId, `v15:hq3:lumber:${index}`))?.ok).toBe(true);
  }

  state = await getPlotState(frame);
  expect(state?.currentGoal?.primaryAction?.type).toBe('UPGRADE_HQ');
  expect((await runPlotTool(frame, 'et.plot.upgrade_building', {
    idempotencyKey: 'v15:hq3:upgrade'
  }))?.ok).toBe(true);
  await advancePlot(frame, 181_000);
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.plot?.hqLevel === 3);

  state = await getPlotState(frame);
  expect(state?.currentGoal?.title).toBe('Choose the next town request');
  expect(state?.contracts?.offers?.length).toBeGreaterThanOrEqual(2);
  const secondChoiceScene = await frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
  expect(secondChoiceScene?.anchors?.find((entry) => entry.id === 'STATE:contracts')?.value).toMatch(/Clover pick|offer|request/i);

  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('contracts'));
  await expect(frame.getByTestId('contract-offer')).toHaveCount(state.contracts.offers.length);
  const second = state.contracts.offers[0];
  expect(second?.contractId).toBeTruthy();
  const acceptedSecond = await postJson(frame, '/api/founders-plot/contracts/accept', {
    contractId: second.contractId,
    idempotencyKey: 'v15:second:accept'
  });
  expect(acceptedSecond?.ok).toBe(true);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
  state = await getPlotState(frame);
  expect(state?.contracts?.activeContract?.contractId).toBe(second.contractId);
  expect(state?.foreman?.companionAdvice?.recommendation).toContain(state.contracts.activeContract.requesterSnapshot.displayName);

  await expect(frame.locator('body')).not.toContainText(/Worker Tools|Skill Context|Worker Traffic|Session Context/);
});

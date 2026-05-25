const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame,
  runLumberCycle,
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

async function selectPad(frame, pad) {
  await frame.evaluate(({ x, y }) => {
    const stage = document.getElementById('plotBoard');
    stage?.dispatchEvent(new CustomEvent('founders:three-pick', {
      bubbles: true,
      detail: {
        objectId: `PAD:${x},${y}`,
        selectionKey: `pad:${x},${y}`,
        activation: true,
        source: 'test'
      }
    }));
  }, { x: pad.x, y: pad.y });
  await expect(frame.getByTestId('founders-selection-panel')).toBeVisible({ timeout: 5000 });
}

async function reachHq2BeforeCharter(frame) {
  const pad = await firstOpenPad(frame);
  expect(pad).toBeTruthy();
  expect((await runPlotTool(frame, 'et.plot.place_building', {
    type: 'LUMBER_CAMP',
    x: pad.x,
    y: pad.y,
    idempotencyKey: 'hq2-build-catalog:lumber'
  }))?.ok).toBe(true);

  await advancePlot(frame, 31_000);
  const lumberId = await buildingId(frame, 'LUMBER_CAMP');
  expect(lumberId).toMatch(/^bld_/);
  expect((await runLumberCycle(frame, lumberId, 'hq2-build-catalog:first-lumber'))?.ok).toBe(true);

  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.townOpportunity?.active?.opportunityId === 'first_campfire_choice');
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_campfire_choice',
    optionId: 'raise_waymarkers',
    idempotencyKey: 'hq2-build-catalog:first-choice'
  }))?.ok).toBe(true);
  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'first_supply_council_choice',
    optionId: 'host_work_bee',
    idempotencyKey: 'hq2-build-catalog:supply-choice'
  }))?.ok).toBe(true);
  expect((await runPlotTool(frame, 'et.plot.upgrade_building', {
    idempotencyKey: 'hq2-build-catalog:hq2'
  }))?.ok).toBe(true);
  await advancePlot(frame, 121_000);
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return state?.plot?.hqLevel === 2
      && state?.townOpportunity?.active?.opportunityId === 'level_two_charter_choice';
  }, null, { timeout: 5000 });
}

test('HQ2 build options show Farm Plot resource needs and unlock the build after the charter reward', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const frame = await openFoundersPlotFrame(page);

  await reachHq2BeforeCharter(frame);

  let state = await getPlotState(frame);
  expect(state?.plot?.inventory).toEqual(expect.objectContaining({ wood: 0, coin: 18 }));
  expect(state?.unlocks?.buildingTypes).toEqual(['LUMBER_CAMP', 'FARM_PLOT']);
  expect(state?.unlocks?.buildingCatalog?.find((entry) => entry.type === 'FARM_PLOT')).toEqual(expect.objectContaining({
    unlocked: true,
    affordable: false,
    missing: { wood: 10 }
  }));

  const pad = await firstOpenPad(frame);
  expect(pad).toBeTruthy();
  await selectPad(frame, pad);

  await expect(frame.getByTestId('place-lumber_camp')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('place-farm_plot')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('place-farm_plot')).toBeDisabled();
  await expect(frame.getByTestId('place-farm_plot')).toContainText('Needs 10 wood');
  await expect(frame.getByTestId('place-quarry')).toBeVisible();
  await expect(frame.getByTestId('place-quarry')).toBeDisabled();
  await expect(frame.getByTestId('place-quarry')).toContainText('Unlocks at HQ 3');
  await expect(frame.getByTestId('founders-scene-action-place-FARM_PLOT')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('founders-scene-action-place-FARM_PLOT')).toBeDisabled();
  await expect(frame.getByTestId('founders-scene-action-place-FARM_PLOT')).toContainText('Needs 10 wood');

  expect((await runPlotTool(frame, 'et.plot.town.resolve_opportunity', {
    opportunityId: 'level_two_charter_choice',
    optionId: 'seed_farm_coop',
    idempotencyKey: 'hq2-build-catalog:charter-choice'
  }))?.ok).toBe(true);
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return !state?.townOpportunity?.active && state?.currentGoal?.primaryAction?.buildingType === 'FARM_PLOT';
  }, null, { timeout: 5000 });

  state = await getPlotState(frame);
  expect(state?.plot?.inventory).toEqual(expect.objectContaining({ wood: 10, coin: 15 }));
  await selectPad(frame, pad);
  await expect(frame.getByTestId('place-farm_plot')).toBeEnabled({ timeout: 5000 });
  await expect(frame.getByTestId('place-farm_plot')).toContainText('Cost 10 wood, 5 coin');
  await frame.getByTestId('place-farm_plot').click();

  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => building?.type === 'FARM_PLOT');
  }, null, { timeout: 5000 });
});

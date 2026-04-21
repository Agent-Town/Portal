const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('scene objects render the live plot states and clicking them opens the action sheet', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await expect(frame.getByTestId('founders-stage-object-HQ')).toBeVisible();
  await expect(frame.getByTestId('founders-stage-object-CONTRACT_BOARD')).toBeVisible();
  await expect(frame.getByTestId('founders-stage-object-PUBLIC_SQUARE')).toBeVisible();
  await expect(frame.getByTestId('founders-stage-object-FOREMAN_HUT')).toBeVisible();
  await expect(frame.getByTestId('founders-stage-object-lot-0-0')).toBeVisible();

  const sampledStates = await frame.evaluate(() => {
    const base = window.__foundersPlotTest.getState()?.state;
    const buildable = window.FoundersPlotSceneState.createSceneState(base, {});
    const locked = window.FoundersPlotSceneState.createSceneState({
      ...base,
      unlocks: {
        ...(base?.unlocks || {}),
        buildingTypes: []
      }
    }, {});
    return {
      buildable: buildable.objects.find((object) => object.id === 'PAD:0,0')?.state || '',
      locked: locked.objects.find((object) => object.id === 'PAD:0,0')?.state || ''
    };
  });
  expect(sampledStates).toEqual({ buildable: 'BUILDABLE', locked: 'LOCKED' });

  const placed = await placeFirstLumberCamp(frame, 'v13-scene-object');
  expect(placed?.ok).toBe(true);
  const lumber = frame.getByTestId('founders-stage-object-LUMBER_CAMP');
  await expect(lumber).toBeVisible();
  await expect(lumber).toHaveClass(/at-fp-stage-object--under-construction/);

  await advancePlot(frame, 31_000);
  await lumber.click();
  await expect(frame.getByTestId('founders-selection-panel')).toContainText(/Lumber Camp/i);
  await expect(frame.getByTestId('selection-queue')).toBeVisible();

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String((state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queued = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v13-scene-object:queue'
  });
  expect(queued?.ok).toBe(true);
  await expect(lumber).toHaveClass(/at-fp-stage-object--producing/);
  await expect(lumber.locator('[data-testid="founders-timer-ring"]')).toBeVisible();

  await advancePlot(frame, 61_000);
  await expect(lumber).toHaveClass(/at-fp-stage-object--ready/);
  await expect(lumber.locator('[data-badge-type="ready"]')).toBeVisible();

  await lumber.click();
  await expect(frame.getByTestId('selection-collect')).toBeVisible();
  await expect(frame.locator('#selectionSheetTitle')).toHaveText(/Lumber Camp/i);
  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-3-object-selected-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

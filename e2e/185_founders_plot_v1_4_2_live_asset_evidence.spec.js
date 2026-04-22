const { test, expect } = require('@playwright/test');
const {
  acceptContractOffer,
  bootstrapToHq2,
  getOfferByKind,
  openFoundersPlotFrame,
  runLumberCycle,
  runPlotTool,
  startForemanRuntime,
  turnInActiveContract
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Start Gate uses the normalized hero-cast portraits in the live shell', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto('/start.html');

  await expect(page.getByTestId('hero-cast-card-prairie-dog').locator('img')).toHaveAttribute('src', '/assets/hero-cast/prairie-dog-ranger.webp');
  await expect(page.getByTestId('hero-cast-card-sheriff-lobster').locator('img')).toHaveAttribute('src', '/assets/hero-cast/sheriff-lobster.webp');
  await expect(page.getByTestId('hero-cast-card-chibi-homesteader').locator('img')).toHaveAttribute('src', '/assets/hero-cast/chibi-homesteader.webp');
  await expect(page.getByTestId('hero-cast-card-wizard-kid').locator('img')).toHaveAttribute('src', '/assets/hero-cast/wizard-kid.webp');

  await expect(page.locator('[data-testid="start-card"]')).toHaveScreenshot('start-v1-4-2-hero-cast-strip-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

test('Founders Plot stage uses the promoted civic props in the live scene', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const journal = frame.getByTestId('founders-stage-object-JOURNAL');
  const inbox = frame.getByTestId('founders-stage-object-APPROVAL_INBOX');
  await expect(journal).toBeVisible();
  await expect(inbox).toBeVisible();
  await expect(journal.locator('img')).toHaveAttribute('src', /town-journal\.webp$/);
  await expect(inbox.locator('img')).toHaveAttribute('src', /approval-inbox\.webp$/);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-civic-props-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

test('live contract completion uses Clover celebrating art in the running game', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);
  await startForemanRuntime(frame);

  const buildOffer = await getOfferByKind(frame, 'BUILD');
  expect(buildOffer?.contractId).toBeTruthy();
  const accepted = await acceptContractOffer(frame, buildOffer.contractId, 'v142-evidence-build');
  expect(accepted?.ok).toBe(true);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String((state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);
  const extraWood = await runLumberCycle(frame, lumberBuildingId, 'v142-evidence-farm-fund');
  expect(extraWood?.ok).toBe(true);

  const openPad = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return Array.isArray(state?.pads) ? state.pads.find((pad) => pad && pad.occupied === false) || null : null;
  });
  expect(openPad?.x).toBeDefined();
  expect(openPad?.y).toBeDefined();

  const placed = await runPlotTool(frame, 'et.plot.place_building', {
    type: 'FARM_PLOT',
    x: openPad.x,
    y: openPad.y,
    idempotencyKey: 'v142-evidence-farm-plot'
  });
  expect(placed?.ok).toBe(true);

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return Array.isArray(state?.buildings) && state.buildings.some((building) => building?.type === 'FARM_PLOT');
  }, null, { timeout: 5_000 });
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.advance(46_000);
  });

  const turnedIn = await turnInActiveContract(frame, buildOffer.contractId, 'v142-evidence-turnin');
  expect(turnedIn?.ok).toBe(true);

  await frame.waitForFunction(() => {
    const scene = window.__foundersPlotTest.getScene?.();
    return scene?.clover?.state === 'CELEBRATING' && scene?.clover?.assetId === 'clover_celebrating_v1_4_2';
  }, null, { timeout: 5_000 });

  const clover = frame.getByTestId('founders-clover-avatar');
  await expect(clover).toHaveAttribute('data-target-object-id', 'CONTRACT_BOARD');
  await expect(clover.locator('img')).toHaveAttribute('src', /clover-celebrating\.webp$/);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-clover-celebrating-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

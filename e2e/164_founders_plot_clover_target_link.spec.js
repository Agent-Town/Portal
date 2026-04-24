const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  openFoundersPlotFrame,
  runPlotTool,
  seedForemanBrain
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function putCloverIntoActingState(frame) {
  await bootstrapToHq2(frame);
  await seedForemanBrain(frame);
  await frame.getByTestId('founders-clover-avatar').click();
  await frame.getByTestId('foreman-start-btn').click();

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String((state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);

  await frame.getByTestId('permission-collectOutputs').click();
  await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v131-clover-link:queue'
  });
  await advancePlot(frame, 61_000);
  await frame.getByTestId('scheduler-collect-toggle').click();
  await frame.getByTestId('foreman-run-now-btn').click();
}

test('Clover acting is target-linked to the world object and exposed through DOM hooks', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await putCloverIntoActingState(frame);

  const clover = frame.getByTestId('clover-foreman');
  await expect(clover).toHaveAttribute('data-state', 'acting');

  const targetObjectId = await clover.getAttribute('data-target-object-id');
  expect(String(targetObjectId || '')).not.toEqual('');

  const targetLink = frame.getByTestId('clover-target-link');
  await expect(targetLink).toBeVisible();
  await expect(targetLink).toHaveAttribute('data-target-object-id', String(targetObjectId));

  const targetObject = frame.locator(`[data-scene-object-id="${String(targetObjectId)}"]`);
  await expect(targetObject).toHaveAttribute('data-action-linked', 'true');
  await expect(clover).toHaveAttribute('aria-label', /Clover is .* from .*|Clover is .* the .*/i);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-3-1-clover-acting-target-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

test('reduced motion still shows Clover target linkage without relying on animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const frame = await openFoundersPlotFrame(page);
  await putCloverIntoActingState(frame);

  const targetLink = frame.getByTestId('clover-target-link');
  await expect(targetLink).toBeVisible();
  await expect(targetLink).toHaveAttribute('data-reduced-motion', 'true');
});

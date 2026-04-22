const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  openFoundersPlotFrame,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function putCloverIntoActingState(frame) {
  await bootstrapToHq2(frame);
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
    idempotencyKey: 'v142-cleanup-clover:queue'
  });
  await advancePlot(frame, 61_000);
  await frame.getByTestId('scheduler-collect-toggle').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await frame.evaluate(() => window.__foundersPlotTest.closeDrawer());
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Clover stays grounded and visibly linked to the target without the drawer open', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await putCloverIntoActingState(frame);

  const clover = frame.getByTestId('clover-foreman');
  await expect(clover).toBeVisible();
  await expect(clover).toHaveAttribute('data-state', 'acting');
  await expect(clover).toHaveAttribute('data-grounded', 'true');

  const targetObjectId = await clover.getAttribute('data-target-object-id');
  expect(String(targetObjectId || '')).not.toEqual('');
  await expect(frame.getByTestId('clover-target-link')).toBeVisible();

  const targetObject = frame.locator(`[data-scene-object-id="${String(targetObjectId)}"]`);
  await expect(targetObject).toBeVisible();
  await expect(targetObject).toHaveAttribute('data-clover-linked', 'true');
  await expect(targetObject).toHaveClass(/at-fp-stage-object--action-linked/);
  await expect(frame.locator('#foundersDrawerLayer')).toBeHidden();
  await expect(frame.locator('.at-fp-cloverGroundShadow')).toBeVisible();

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-cleanup-clover-acting-no-drawer-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

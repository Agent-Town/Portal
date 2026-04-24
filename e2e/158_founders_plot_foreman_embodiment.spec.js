const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  openFoundersPlotFrame,
  postJson,
  runPlotTool,
  seedForemanBrain
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const FORBIDDEN = /\b(runtime|token|openclaw|json|schema|worker)\b/i;

async function bubbleOpacity(locator) {
  return await locator.evaluate((node) => Number(window.getComputedStyle(node).opacity || '0'));
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Clover stays quiet until selected or active, then shows a compact in-world action receipt', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);
  await seedForemanBrain(frame);

  const clover = frame.getByTestId('founders-clover-avatar');
  const bubble = frame.getByTestId('founders-clover-bubble');
  await expect(clover).toBeVisible();
  expect(await bubbleOpacity(bubble)).toBeLessThan(0.1);
  const bubbleText = String(await bubble.textContent() || '').trim();
  expect(bubbleText.length).toBeLessThanOrEqual(90);
  expect(bubbleText).not.toMatch(FORBIDDEN);

  await clover.hover();
  await expect.poll(() => bubbleOpacity(bubble)).toBeGreaterThan(0.5);

  await clover.click();
  await expect(frame.getByTestId('founders-foreman-panel')).toBeVisible();
  await frame.getByTestId('foreman-start-btn').click();
  await expect(clover).toHaveClass(/at-fp-clover--observing|at-fp-clover--thinking/);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String((state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queued = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v13-foreman:queue'
  });
  expect(queued?.ok).toBe(true);
  await advancePlot(frame, 61_000);

  const policy = await postJson(frame, '/api/founders-plot/policy', { key: 'collectOutputs', value: true });
  expect(policy?.ok).toBe(true);

  await expect(frame.getByTestId('permission-collectOutputs')).toContainText(/Disable|Enable/i);
  await frame.getByTestId('scheduler-collect-toggle').click();

  const runNow = frame.getByTestId('foreman-run-now-btn');
  await expect(runNow).toBeEnabled();
  const actionPromise = runNow.click();
  await expect(clover).toHaveClass(/at-fp-clover--acting/);
  await actionPromise;
  await expect.poll(() => bubbleOpacity(bubble)).toBeGreaterThan(0.5);
  await frame.waitForFunction(() => {
    return document.querySelector('[data-testid="founders-stage-object-LUMBER_CAMP"]')?.classList.contains('is-action-highlight') === true;
  }, null, { timeout: 5_000 }).catch(() => null);

  await frame.waitForFunction(() => {
    return !!window.__foundersPlotTest.getState()?.state?.foreman?.receipt?.receiptId;
  }, null, { timeout: 10_000 });

  await expect(frame.getByTestId('founders-receipt')).toBeVisible();
  await expect(frame.getByTestId('founders-receipt')).toContainText(/collect/i);
  await expect(bubble).not.toContainText(FORBIDDEN);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-clover-action-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

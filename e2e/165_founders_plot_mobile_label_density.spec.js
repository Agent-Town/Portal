const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mobile hides nonessential labels by default and avoids label overlap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openFoundersPlotFrame(page);

  const metrics = await frame.evaluate(() => window.__foundersPlotTest.collectSurfaceMetrics());
  expect(metrics.mobileVisibleStageLabels).toBeLessThanOrEqual(3);
  expect(metrics.visibleWords).toBeLessThanOrEqual(80);
  expect(metrics.mobileLabelOverlapCount).toBe(0);

  await frame.getByTestId('founders-stage-object-HQ').click();
  await expect(frame.getByTestId('founders-selection-panel')).toContainText(/Headquarters/i);

  const selectedMetrics = await frame.evaluate(() => window.__foundersPlotTest.collectSurfaceMetrics());
  expect(selectedMetrics.mobileVisibleStageLabels).toBeLessThanOrEqual(3);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-3-1-mobile-selected-object-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Founders Plot defaults to a scenic game surface with one obvious CTA and stable screenshots', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();
  await expect(frame.getByTestId('founders-plot-stage')).toBeVisible();
  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible();

  const cases = [
    { width: 390, height: 844, maxWords: 80, minStageRatio: 0.58, maxPanels: 2, screenshot: 'founders-v1-3-home-390.png' },
    { width: 768, height: 1024, maxWords: 120, minStageRatio: 0.52, maxPanels: 3, screenshot: 'founders-v1-3-home-768.png' },
    { width: 1280, height: 900, maxWords: 120, minStageRatio: 0.56, maxPanels: 3, screenshot: 'founders-v1-3-home-1280.png' }
  ];

  for (const entry of cases) {
    await page.setViewportSize({ width: entry.width, height: entry.height });
    await page.waitForTimeout(120);

    const metrics = await frame.evaluate(() => window.__foundersPlotTest.collectSurfaceMetrics());
    expect(metrics?.visibleWords).toBeLessThanOrEqual(entry.maxWords);
    expect(metrics?.debugTerminologyCount).toBe(0);
    expect(metrics?.duplicateDomIdCount).toBe(0);
    expect(metrics?.visiblePanels).toBeLessThanOrEqual(entry.maxPanels);
    expect(metrics?.stageVisibleAreaRatio).toBeGreaterThanOrEqual(entry.minStageRatio);
    expect(metrics?.horizontalOverflow).toBe(false);

    await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot(entry.screenshot, {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.03
    });
  }
});

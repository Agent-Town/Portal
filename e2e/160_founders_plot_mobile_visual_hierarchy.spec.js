const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mobile Founders Plot keeps the stage first, the tray compact, and the layout free of horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openFoundersPlotFrame(page);

  await expect(frame.getByTestId('founders-status-strip')).toBeVisible();
  await expect(frame.getByTestId('founders-plot-stage')).toBeVisible();
  await expect(frame.getByTestId('founders-drawer-tray')).toBeVisible();
  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible();

  const layout = await frame.evaluate(() => {
    const metrics = window.__foundersPlotTest.collectSurfaceMetrics();
    const hud = document.querySelector('[data-testid="founders-status-strip"]');
    const stage = document.querySelector('[data-testid="founders-plot-stage"]');
    const tray = document.querySelector('[data-testid="founders-drawer-tray"]');
    const hudRect = hud?.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    const trayRect = tray?.getBoundingClientRect();
    return {
      metrics,
      hudRect,
      stageRect,
      trayRect,
      sidebarPresent: !!document.querySelector('.foundersSidebar')
    };
  });

  expect(layout.sidebarPresent).toBe(false);
  expect(layout.metrics.visibleWords).toBeLessThanOrEqual(80);
  expect(layout.metrics.visiblePanels).toBeLessThanOrEqual(2);
  expect(layout.metrics.horizontalOverflow).toBe(false);
  expect(layout.hudRect.height).toBeLessThan(310);
  expect(layout.stageRect.top).toBeGreaterThanOrEqual(layout.hudRect.bottom - 8);
  expect(layout.trayRect.top).toBeGreaterThanOrEqual(layout.stageRect.bottom - 4);

  await frame.getByTestId('founders-stage-object-HQ').click();
  await expect(frame.getByTestId('founders-selection-panel')).toContainText(/Headquarters/i);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-3-object-selected-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });

  await frame.locator('[data-drawer-trigger="contracts"]').click();
  await expect(frame.getByTestId('founders-contract-board')).toBeVisible();
  await expect(frame.locator('#foundersDrawer-contracts')).toHaveScreenshot('founders-v1-3-contract-drawer-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

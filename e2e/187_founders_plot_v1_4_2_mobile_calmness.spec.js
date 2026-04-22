const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('390px route stays calm, unclipped, and touchable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openFoundersPlotFrame(page);

  const metrics = await frame.evaluate(() => {
    const isVisible = (node) => {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) return false;
      if (node.hidden) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const textNodes = Array.from(document.querySelectorAll('.at-fp-objectLabel, .at-fp-overlayPill, .at-fp-cloverBubble'))
      .filter(isVisible);
    const clippedCount = textNodes.filter((node) => node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1).length;
    const buildHereCount = textNodes.filter((node) => /build here/i.test(node.textContent || '')).length;
    const tapTargets = Array.from(document.querySelectorAll('[data-scene-object-id], [data-drawer-trigger], #questCtaBtn'))
      .filter(isVisible)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return Math.min(rect.width, rect.height);
      });
    return {
      floatingLabelCount: textNodes.length,
      buildHereCount,
      clippedCount,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      minTapTarget: tapTargets.length ? Math.min(...tapTargets) : 0,
      sheetVisible: !!document.querySelector('#selectionSheet:not([hidden])'),
      goalObjectId: window.__foundersPlotTest.getScene()?.currentGoal?.recommendedObjectId || '',
      objectiveCovered: (() => {
        const goalObjectId = window.__foundersPlotTest.getScene()?.currentGoal?.recommendedObjectId || '';
        const sheet = document.querySelector('#selectionSheet:not([hidden])');
        const target = goalObjectId ? document.querySelector(`[data-scene-object-id="${goalObjectId}"]`) : null;
        if (!sheet || !target) return false;
        const sheetRect = sheet.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const intersects = sheetRect.left < targetRect.right
          && sheetRect.right > targetRect.left
          && sheetRect.top < targetRect.bottom
          && sheetRect.bottom > targetRect.top;
        return intersects && sheetRect.top <= targetRect.top && sheetRect.bottom >= targetRect.bottom;
      })()
    };
  });

  expect(metrics.floatingLabelCount).toBeLessThanOrEqual(6);
  expect(metrics.buildHereCount).toBeLessThanOrEqual(1);
  expect(metrics.clippedCount).toBe(0);
  expect(metrics.horizontalOverflow).toBe(false);
  expect(metrics.minTapTarget).toBeGreaterThanOrEqual(44);
  expect(metrics.objectiveCovered).toBe(false);
  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible();

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-cleanup-mobile-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

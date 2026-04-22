const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  openFoundersPlotFrame,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const ALLOWED_MOBILE_ROLES = new Set(['objective', 'selected', 'clover', 'critical']);

function visibleStageMetrics(frame) {
  return frame.evaluate(({ allowedRoles }) => {
    const stage = document.querySelector('.at-fp-stage');
    const stageRect = stage?.getBoundingClientRect();
    const isVisible = (node) => {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) return false;
      if (node.hidden) return false;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      if (!stageRect) return true;
      return rect.right > stageRect.left && rect.left < stageRect.right && rect.bottom > stageRect.top && rect.top < stageRect.bottom;
    };
    const textElements = Array.from(document.querySelectorAll([
      '[data-world-label]',
      '[data-scene-chip]',
      '[data-object-label]',
      '[data-lot-label]',
      '[data-status-badge]',
      '[data-object-state-badge]',
      '.scene-chip',
      '.world-label',
      '.object-label',
      '.lot-label',
      '.at-fp-objectLabel',
      '.at-fp-overlayPill',
      '.at-fp-cloverBubble'
    ].join(',')))
      .filter(isVisible)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
        return {
          text,
          role: String(node.getAttribute('data-label-role') || '').trim(),
          clipped: node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1
            || rect.left < -2
            || rect.top < -2
            || rect.right > window.innerWidth + 2
            || rect.bottom > window.innerHeight + 2,
          overlayWeight: String(node.getAttribute('data-overlay-weight') || '').trim()
        };
      })
      .filter((item) => item.text.length > 0);

    const visibleWords = textElements.reduce((sum, item) => sum + item.text.split(/\s+/).filter(Boolean).length, 0);
    const persistentWorldLabels = textElements.length;
    const clippedLabelCount = textElements.filter((item) => item.clipped).length;
    const nonObjectiveTextLabels = textElements.filter((item) => !allowedRoles.includes(item.role)).length;
    const sameWeightPillCount = Array.from(document.querySelectorAll('.at-fp-overlayPill'))
      .filter(isVisible)
      .filter((node) => ['medium', 'strong'].includes(String(node.getAttribute('data-overlay-weight') || '')))
      .length;
    const primaryAttentionObjects = Array.from(document.querySelectorAll('[data-scene-object-id]'))
      .filter(isVisible)
      .filter((node) => {
        const weight = String(node.getAttribute('data-overlay-weight') || '');
        const attention = String(node.getAttribute('data-attention') || '');
        return weight === 'strong' || attention === 'recommended';
      }).length;

    return {
      visibleWords,
      persistentWorldLabels,
      clippedLabelCount,
      nonObjectiveTextLabels,
      sameWeightPillCount,
      primaryAttentionObjects
    };
  }, { allowedRoles: [...ALLOWED_MOBILE_ROLES] });
}

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
    idempotencyKey: 'patch2-mobile:queue'
  });
  await advancePlot(frame, 61_000);
  await frame.getByTestId('scheduler-collect-toggle').click();
  await frame.getByTestId('foreman-run-now-btn').click();
  await frame.evaluate(() => window.__foundersPlotTest.closeDrawer());
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('390px default route obeys Patch 2 calmness budgets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openFoundersPlotFrame(page);
  const metrics = await visibleStageMetrics(frame);

  expect(metrics.persistentWorldLabels).toBeLessThanOrEqual(3);
  expect(metrics.visibleWords).toBeLessThanOrEqual(24);
  expect(metrics.nonObjectiveTextLabels).toBe(0);
  expect(metrics.clippedLabelCount).toBe(0);
  expect(metrics.primaryAttentionObjects).toBeLessThanOrEqual(2);
  expect(metrics.sameWeightPillCount).toBeLessThanOrEqual(2);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-patch2-mobile-default-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

test('390px Clover acting route keeps the target readable without clutter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openFoundersPlotFrame(page);
  await putCloverIntoActingState(frame);

  const metrics = await frame.evaluate(() => {
    const clover = document.querySelector('[data-testid="clover-foreman"]');
    const targetId = String(clover?.getAttribute('data-target-object-id') || '');
    const target = targetId ? document.querySelector(`[data-scene-object-id="${targetId}"]`) : null;
    const targetRect = target?.getBoundingClientRect();
    const isVisible = (node) => {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) return false;
      if (node.hidden) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    const targetSignals = Array.from(document.querySelectorAll('.at-fp-objectLabel, .at-fp-overlayPill, .at-fp-cloverBubble, [data-testid="clover-target-link"]'))
      .filter(isVisible)
      .filter((node) => {
        if (!targetRect) return false;
        const rect = node.getBoundingClientRect();
        const expanded = {
          left: targetRect.left - 36,
          right: targetRect.right + 36,
          top: targetRect.top - 36,
          bottom: targetRect.bottom + 36
        };
        return rect.right > expanded.left
          && rect.left < expanded.right
          && rect.bottom > expanded.top
          && rect.top < expanded.bottom;
      });
    return {
      targetId,
      targetSignals: targetSignals.length
    };
  });

  expect(metrics.targetId).not.toEqual('');
  expect(metrics.targetSignals).toBeLessThanOrEqual(2);
  await expect(frame.getByTestId('clover-target-link')).toBeVisible();
  await expect(frame.getByTestId('founders-quest-cta')).toBeVisible();

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-patch2-mobile-clover-acting-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

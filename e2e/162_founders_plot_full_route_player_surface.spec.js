const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame, openFoundersPlotRoute } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const FORBIDDEN_LABELS = [
  'Agent Comms',
  'Worker Tools',
  'Skill Context',
  'Worker Traffic',
  'Brain',
  'Session Context',
  'Trainer'
];
const ALLOWED_MOBILE_ROLES = new Set(['objective', 'selected', 'clover', 'critical']);

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function hostSurfaceState(page) {
  return await page.evaluate((labels) => {
    function isVisible(node) {
      if (!(node instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      if (node.hidden) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && node.getClientRects().length > 0;
    }
    const foundLabels = [];
    for (const label of labels) {
      const match = Array.from(document.querySelectorAll('body *')).find((node) => {
        if (!(node instanceof HTMLElement) || !isVisible(node)) return false;
        return String(node.textContent || '').trim() === String(label);
      });
      if (match) foundLabels.push(label);
    }
    const agentSidebar = document.getElementById('agentSidebar');
    const debugPane = document.getElementById('agentDebugPane');
    return {
      foundLabels,
      agentSidebarVisible: isVisible(agentSidebar),
      debugPaneVisible: isVisible(debugPane)
    };
  }, FORBIDDEN_LABELS);
}

async function visibleStageMetrics(frame) {
  return frame.evaluate(({ allowedRoles }) => {
    const stage = document.querySelector('.at-fp-stage');
    const stageRect = stage?.getBoundingClientRect();
    const isVisible = (node) => {
      if (!(node instanceof HTMLElement)) return false;
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
          clipped: node.scrollWidth > node.clientWidth + 1
            || node.scrollHeight > node.clientHeight + 1
            || rect.left < stageRect.left - 2
            || rect.top < stageRect.top - 2
            || rect.right > stageRect.right + 2
            || rect.bottom > stageRect.bottom + 2,
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

test('normal full route hides Agent Comms and the debug surface during Founders Plot gameplay', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFoundersPlotRoute(page);
  const frame = await getOpenFoundersPlotFrame(page);

  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();

  const state = await hostSurfaceState(page);
  expect(state.foundLabels).toEqual([]);
  expect(state.agentSidebarVisible).toBe(false);
  expect(state.debugPaneVisible).toBe(false);

  await expect(page).toHaveScreenshot('founders-v1-4-2-full-route-hero-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(120);

  const mobileState = await hostSurfaceState(page);
  expect(mobileState.foundLabels).toEqual([]);
  expect(mobileState.agentSidebarVisible).toBe(false);
  expect(mobileState.debugPaneVisible).toBe(false);

  const mobileMetrics = await visibleStageMetrics(frame);
  expect(mobileMetrics.persistentWorldLabels).toBeLessThanOrEqual(3);
  expect(mobileMetrics.visibleWords).toBeLessThanOrEqual(24);
  expect(mobileMetrics.nonObjectiveTextLabels).toBe(0);
  expect(mobileMetrics.clippedLabelCount).toBe(0);
  expect(mobileMetrics.primaryAttentionObjects).toBeLessThanOrEqual(2);
  expect(mobileMetrics.sameWeightPillCount).toBeLessThanOrEqual(2);

  await expect(page).toHaveScreenshot('founders-v1-4-2-full-route-mobile-390.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

test('explicit debug route reveals the Agent Comms and debug surface', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFoundersPlotRoute(page, { debug: true });
  await getOpenFoundersPlotFrame(page);

  const sidebar = page.getByTestId('agent-panel');
  await expect(sidebar).toBeVisible();
  await expect(page.getByText('Agent Comms', { exact: true })).toBeVisible();
  await expect(page.getByText('Worker Tools', { exact: true })).toBeVisible();
  await expect(page.getByText('Worker Traffic', { exact: true })).toBeVisible();
  await expect(page.getByText('Trainer', { exact: true })).toBeVisible();

  await expect(page).toHaveScreenshot('founders-v1-4-2-debug-enabled-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

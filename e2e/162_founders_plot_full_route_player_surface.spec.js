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

test('normal full route hides Agent Comms and the debug surface during Founders Plot gameplay', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFoundersPlotRoute(page);
  const frame = await getOpenFoundersPlotFrame(page);

  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();

  const state = await hostSurfaceState(page);
  expect(state.foundLabels).toEqual([]);
  expect(state.agentSidebarVisible).toBe(false);
  expect(state.debugPaneVisible).toBe(false);

  await expect(page).toHaveScreenshot('founders-v1-3-1-full-route-hero-1280.png', {
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

  await expect(page).toHaveScreenshot('founders-v1-3-1-full-route-mobile-390.png', {
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

  await expect(page).toHaveScreenshot('founders-v1-3-1-debug-enabled-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

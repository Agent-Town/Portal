const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame, openFoundersPlotRoute } = require('./helpers/founders_plot');
const { configureOpenRouterBrain } = require('./helpers/founders_plot_foreman');

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
    return {
      foundLabels,
      agentSidebarVisible: isVisible(document.getElementById('agentSidebar')),
      debugPaneVisible: isVisible(document.getElementById('agentDebugPane'))
    };
  }, FORBIDDEN_LABELS);
}

test('full-route Founders Plot stays player-facing after the V1.4 LLM port', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFoundersPlotRoute(page);
  await configureOpenRouterBrain(page);
  const frame = await getOpenFoundersPlotFrame(page);
  await frame.evaluate(async () => window.__foundersPlotTest.startForemanRuntime());

  await expect(frame.getByTestId('founders-game-shell')).toBeVisible();
  const state = await hostSurfaceState(page);
  expect(state.foundLabels).toEqual([]);
  expect(state.agentSidebarVisible).toBe(false);
  expect(state.debugPaneVisible).toBe(false);
});

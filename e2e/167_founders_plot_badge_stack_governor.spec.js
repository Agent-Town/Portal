const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  openFoundersPlotFrame,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function objectBadgeMetrics(frame) {
  return await frame.evaluate(() => {
    function isVisible(node) {
      if (!(node instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
    return Array.from(document.querySelectorAll('[data-scene-object-id]'))
      .filter((node) => node.getAttribute('data-scene-object-id') !== 'CLOVER')
      .map((node) => ({
        objectId: node.getAttribute('data-scene-object-id') || '',
        selected: node.classList.contains('at-fp-stage-object--selected'),
        badges: Array.from(node.querySelectorAll('.at-fp-state-badge')).filter(isVisible).length
      }));
  });
}

test('unselected objects keep badge stacks governed on desktop and mobile', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String((state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);
  await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v131-badges:queue'
  });
  await advancePlot(frame, 61_000);

  const desktop = await objectBadgeMetrics(frame);
  expect(Math.max(...desktop.filter((entry) => !entry.selected).map((entry) => entry.badges))).toBeLessThanOrEqual(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(120);
  const mobile = await objectBadgeMetrics(frame);
  expect(Math.max(...mobile.filter((entry) => !entry.selected).map((entry) => entry.badges))).toBeLessThanOrEqual(1);
});

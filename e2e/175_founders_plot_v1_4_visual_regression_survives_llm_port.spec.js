const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');
const { configureOpenRouterBrain, prepareReadyCollectScenario } = require('./helpers/founders_plot_foreman');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('stage-first visual metrics survive the V1.4 LLM port', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);
  await configureOpenRouterBrain(page);
  await prepareReadyCollectScenario(frame, { enableScheduler: false, keyPrefix: 'v14-visual' });

  const metrics = await frame.evaluate(() => window.__foundersPlotTest.collectSurfaceMetrics());
  expect(metrics.visiblePanels).toBeLessThanOrEqual(4);
  expect(metrics.primaryCtasAboveFold).toBeLessThanOrEqual(1);
  expect(metrics.debugTerminologyCount).toBe(0);
  expect(metrics.stageVisibleAreaRatio).toBeGreaterThan(0.28);
  expect(metrics.horizontalOverflow).toBe(false);
});

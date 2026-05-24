const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  openFoundersPlotFrame
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function clickSceneAction(frame, testId) {
  const action = frame.getByTestId(testId);
  await expect(action).toBeVisible({ timeout: 5000 });
  await action.click();
}

async function feedbackMetrics(frame) {
  return frame.getByTestId('founders-scene-feedback').evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const stage = document.querySelector('[data-testid="founders-plot-stage"]')?.getBoundingClientRect();
    const strong = node.querySelector('strong');
    const detail = node.querySelector('span');
    const strongStyle = strong ? window.getComputedStyle(strong) : null;
    const detailStyle = detail ? window.getComputedStyle(detail) : null;
    return {
      text: node.textContent.trim(),
      rect: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      },
      stage: stage ? {
        left: stage.left,
        right: stage.right,
        top: stage.top,
        bottom: stage.bottom,
        width: stage.width,
        height: stage.height
      } : null,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      strongFontSize: strongStyle ? Number.parseFloat(strongStyle.fontSize) : 0,
      detailFontSize: detailStyle ? Number.parseFloat(detailStyle.fontSize) : 0
    };
  });
}

function expectFeedbackReadable(metrics) {
  expect(metrics.stage).toBeTruthy();
  expect(metrics.rect.width).toBeGreaterThan(170);
  expect(metrics.rect.left).toBeGreaterThanOrEqual(metrics.stage.left - 1);
  expect(metrics.rect.right).toBeLessThanOrEqual(metrics.stage.right + 1);
  expect(metrics.rect.top).toBeGreaterThanOrEqual(metrics.stage.top - 1);
  expect(metrics.rect.bottom).toBeLessThanOrEqual(metrics.stage.bottom + 1);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
  expect(metrics.strongFontSize).toBeGreaterThanOrEqual(14);
  expect(metrics.detailFontSize).toBeGreaterThanOrEqual(12);
}

async function expectSceneFeedback(frame, expectedText) {
  const feedback = frame.getByTestId('founders-scene-feedback');
  await expect(feedback).toBeVisible({ timeout: 5000 });
  await expect(feedback).toContainText(expectedText, { timeout: 5000 });
  expectFeedbackReadable(await feedbackMetrics(frame));
}

test('Three.js scene feedback explains build, queue, collect, choice, and HQ unlock events', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const frame = await openFoundersPlotFrame(page);

  await clickSceneAction(frame, 'founders-scene-action-place-LUMBER_CAMP');
  await expectSceneFeedback(frame, /Lumber Camp started/);

  await advancePlot(frame, 31_000);
  await clickSceneAction(frame, 'founders-scene-action-queue');
  await expectSceneFeedback(frame, /Lumber Camp is working/);

  await advancePlot(frame, 61_000);
  await expectSceneFeedback(frame, /Lumber Camp output ready/);

  await clickSceneAction(frame, 'founders-scene-action-collect');
  await expectSceneFeedback(frame, /Collected Lumber Camp/);
  await expect(frame.getByTestId('founders-scene-feedback')).toContainText(/town choice unlocked/i);

  await clickSceneAction(frame, 'founders-scene-action-town-option-host_neighbor_supper');
  await expectSceneFeedback(frame, /Neighbor supper hosted/);

  await clickSceneAction(frame, 'founders-scene-action-town-option-host_work_bee');
  await expectSceneFeedback(frame, /Work bee hosted/);

  await clickSceneAction(frame, 'founders-scene-action-upgrade');
  await advancePlot(frame, 121_000);
  await expectSceneFeedback(frame, /Headquarters level 2/);
  await expect(frame.getByTestId('founders-scene-feedback')).toContainText(/New town options unlocked/);
});

test('scene feedback remains readable on a narrow fullscreen-style viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  const frame = await openFoundersPlotFrame(page);

  await clickSceneAction(frame, 'founders-scene-action-place-LUMBER_CAMP');
  await expectSceneFeedback(frame, /Lumber Camp started/);
});

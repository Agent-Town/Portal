const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('default route has one clear objective and quiet non-objective overlays', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const metrics = await frame.evaluate(() => {
    const visibleElementCount = (selector, root = document) => {
      return Array.from(root.querySelectorAll(selector)).filter((node) => {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) return false;
        if (node.hidden) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
    };
    const strongPills = visibleElementCount('.at-fp-overlayPill[data-overlay-weight="strong"]');
    const objectiveObjects = visibleElementCount('[data-scene-object-id].fp-overlay-objective');
    const visibleText = document.body.innerText;
    const availableLots = Array.from(document.querySelectorAll('[data-world-object="lot"]')).map((node) => ({
      objectId: node.getAttribute('data-scene-object-id') || '',
      overlayRole: node.getAttribute('data-overlay-role') || '',
      overlayWeight: node.getAttribute('data-overlay-weight') || '',
      attention: node.getAttribute('data-attention') || ''
    }));
    return {
      strongPills,
      objectiveObjects,
      visibleText,
      availableLots
    };
  });

  expect(metrics.objectiveObjects).toBe(1);
  expect(metrics.strongPills).toBeLessThanOrEqual(3);
  expect(metrics.visibleText).not.toMatch(/Worker Tools|Skill Context|Worker Traffic|Brain|Session Context|runtimeId|OpenRouter|provider/i);

  const objectiveLot = metrics.availableLots.find((item) => item.overlayRole === 'objective');
  const nonObjectiveLots = metrics.availableLots.filter((item) => item.overlayRole !== 'objective');
  expect(objectiveLot).toBeTruthy();
  expect(objectiveLot.overlayWeight).toBe('strong');
  nonObjectiveLots.forEach((lot) => {
    expect(lot.overlayWeight).not.toBe('strong');
  });

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-cleanup-overlay-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

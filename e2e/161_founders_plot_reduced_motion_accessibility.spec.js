const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('reduced motion disables continuous motion while scene buttons stay keyboard- and screen-reader-friendly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  const frame = await openFoundersPlotFrame(page);

  const accessibility = await frame.evaluate(() => {
    const stageButtons = Array.from(document.querySelectorAll('[data-scene-object-id]'));
    const animatedSprites = Array.from(document.querySelectorAll('.at-fp-objectSprite')).filter((node) => {
      return window.getComputedStyle(node).animationName !== 'none';
    });
    return {
      stageButtonCount: stageButtons.length,
      missingAriaLabels: stageButtons.filter((node) => !String(node.getAttribute('aria-label') || '').trim()).length,
      animatedSpriteCount: animatedSprites.length
    };
  });

  expect(accessibility.stageButtonCount).toBeGreaterThan(6);
  expect(accessibility.missingAriaLabels).toBe(0);
  expect(accessibility.animatedSpriteCount).toBe(0);

  await frame.getByTestId('founders-quest-cta').focus();
  await page.keyboard.press('Tab');
  const focused = await frame.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return null;
    const style = window.getComputedStyle(active);
    return {
      testId: active.getAttribute('data-testid'),
      outlineWidth: Number.parseFloat(style.outlineWidth || '0'),
      boxShadow: style.boxShadow || 'none'
    };
  });
  expect(String(focused?.testId || '')).toMatch(/founders-stage-object|founders-clover-avatar/);
  expect((focused?.outlineWidth || 0) > 0 || focused?.boxShadow !== 'none').toBe(true);

  const beforeWood = await frame.getByTestId('inventory-wood').textContent();
  const placed = await placeFirstLumberCamp(frame, 'v13-reduced-motion');
  expect(placed?.ok).toBe(true);
  await advancePlot(frame, 31_000);

  const lumberBuildingId = await frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return String((state?.buildings || []).find((building) => building?.type === 'LUMBER_CAMP')?.buildingId || '');
  });
  expect(lumberBuildingId).toMatch(/^bld_/);

  const queued = await runPlotTool(frame, 'et.plot.queue_job', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v13-reduced-motion:queue'
  });
  expect(queued?.ok).toBe(true);
  await advancePlot(frame, 61_000);
  const collected = await runPlotTool(frame, 'et.plot.collect_outputs', {
    buildingId: lumberBuildingId,
    idempotencyKey: 'v13-reduced-motion:collect'
  });
  expect(collected?.ok).toBe(true);

  const afterWood = await frame.getByTestId('inventory-wood').textContent();
  expect(afterWood).not.toBe(beforeWood);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-3-reduced-motion-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

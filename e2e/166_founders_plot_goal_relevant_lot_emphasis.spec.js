const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('multiple buildable lots still resolve to one recommended next object', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const alignment = await frame.evaluate(() => {
    const recommended = Array.from(document.querySelectorAll('[data-attention="recommended"]'))
      .map((node) => node.getAttribute('data-scene-object-id'))
      .filter(Boolean);
    const available = Array.from(document.querySelectorAll('[data-attention="available"]'))
      .map((node) => node.getAttribute('data-scene-object-id'))
      .filter(Boolean);
    const ribbon = document.querySelector('[data-testid="founders-current-goal"]');
    const cta = document.getElementById('questCtaBtn');
    const clover = document.querySelector('[data-testid="founders-clover-avatar"]');
    return {
      recommended,
      available,
      ribbonTarget: ribbon?.getAttribute('data-target-object-id') || '',
      ctaTarget: cta?.getAttribute('data-target-object-id') || '',
      ctaText: String(cta?.textContent || '').trim(),
      cloverTarget: clover?.getAttribute('data-target-object-id') || ''
    };
  });

  expect(alignment.recommended).toHaveLength(1);
  expect(alignment.available.length).toBeGreaterThanOrEqual(1);
  expect(alignment.ribbonTarget).toBe(alignment.recommended[0]);
  expect(alignment.ctaTarget).toBe(alignment.recommended[0]);
  expect(alignment.ctaText.length).toBeGreaterThan(0);
  expect(alignment.cloverTarget).toBe(alignment.recommended[0]);

  await expect(frame.getByTestId('founders-game-shell')).toHaveScreenshot('founders-v1-4-2-objective-lot-emphasis-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

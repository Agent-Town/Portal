const { test, expect } = require('@playwright/test');
const { reachCreateViaLite, attachPathRecorder } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('create canvas click paints only human pixel and does not auto-call agent paint API', async ({ page }) => {
  await reachCreateViaLite(page);

  const paintCalls = attachPathRecorder(page, ['/api/agent/canvas/paint']);

  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', /[1-9]/);
  await page.waitForTimeout(1200);

  expect(paintCalls.length).toBe(0);

  const hasNonHumanInk = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-testid^="px-"]'));
    return nodes.some((node) => {
      const id = node.getAttribute('data-testid') || '';
      const color = node.getAttribute('data-color') || '0';
      return id !== 'px-0-0' && color !== '0';
    });
  });
  expect(hasNonHumanInk).toBe(false);
});

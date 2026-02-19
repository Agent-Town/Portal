const { test, expect } = require('@playwright/test');
const { reachCreateViaLite, attachPathRecorder } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('create canvas shows runtime agent contribution through agent paint API', async ({ page }) => {
  await reachCreateViaLite(page);

  const paintCalls = attachPathRecorder(page, ['/api/agent/canvas/paint']);

  await page.getByTestId('px-0-0').click();
  await expect(page.getByTestId('px-0-0')).toHaveAttribute('data-color', /[1-9]/);

  await expect.poll(() => paintCalls.length > 0, { timeout: 2000 }).toBe(true);

  const parsedCalls = paintCalls
    .map((call) => {
      try {
        return JSON.parse(call.postData || '{}');
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  expect(parsedCalls.length).toBeGreaterThan(0);
  expect(parsedCalls.some((body) => Number.isInteger(body.x) && Number.isInteger(body.y))).toBe(true);
  expect(parsedCalls.some((body) => !(body.x === 0 && body.y === 0))).toBe(true);

  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('[data-testid^="px-"]'));
    return nodes.some((node) => {
      const id = node.getAttribute('data-testid') || '';
      const color = node.getAttribute('data-color') || '0';
      return id !== 'px-0-0' && color !== '0';
    });
  }, { timeout: 2000 });
});


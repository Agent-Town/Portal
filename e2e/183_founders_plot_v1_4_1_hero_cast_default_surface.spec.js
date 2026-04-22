const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame, openFoundersPlotRoute } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const forbiddenNames = [
  'Prairie Dog Ranger',
  'Sheriff Lobster',
  'Chibi Homesteader Girl',
  'Wizard Kid'
];

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('default Founders Plot surface does not present the hero-cast ensemble', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFoundersPlotRoute(page);
  const frame = await getOpenFoundersPlotFrame(page);

  const pageText = await frame.locator('body').innerText();
  forbiddenNames.forEach((name) => {
    expect(pageText).not.toContain(name);
  });
});

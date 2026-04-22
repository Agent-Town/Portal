const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const forbiddenNames = [
  'Prairie Dog Ranger',
  'Sheriff Lobster',
  'Chibi Homesteader',
  'Wizard Kid'
];

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Start Gate preserves the approved AI SLOP copy', async ({ page }) => {
  await page.goto('/start.html');
  await expect(page.getByLabel('AI warning')).toContainText('WARNING! CONTAINS AND PRODUCES AI SLOP');
});

test('normal Founders Plot route stays free of debug chrome and hero-cast gameplay leakage', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const frameText = await frame.locator('body').innerText();
  expect(frameText).not.toMatch(/Agent Comms|Worker Tools|Skill Context|Worker Traffic|Session Context/i);
  forbiddenNames.forEach((name) => {
    expect(frameText).not.toContain(name);
  });

  const heroCastRefs = await frame.evaluate(() => {
    return Array.from(document.images)
      .map((img) => String(img.getAttribute('src') || ''))
      .filter((src) => src.includes('/assets/hero-cast/'));
  });
  expect(heroCastRefs).toHaveLength(0);
});

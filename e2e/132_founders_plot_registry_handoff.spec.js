const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, pressOpenViaAgentApi, unlockGateWithSigil } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Founders Plot appears in the experience registry with manifest metadata', async ({ request }) => {
  const resp = await request.get('/api/experiences');
  expect(resp.ok()).toBeTruthy();
  const payload = await resp.json();

  expect(payload?.ok).toBe(true);
  expect(Array.isArray(payload?.experiences)).toBe(true);

  const foundersPlot = payload.experiences.find((entry) => entry?.id === 'founders-plot');
  expect(foundersPlot).toBeTruthy();
  expect(foundersPlot.name).toBe('Founders Plot');
  expect(foundersPlot.kind).toBe('district');
  expect(foundersPlot.route).toBe('/founders-plot');
  expect(foundersPlot.modalRoute).toBe('/?district=founders-plot');
  expect(foundersPlot.manifestHash).toMatch(/^[a-f0-9]{64}$/);
  expect(foundersPlot.manifest?.docs?.skill).toBe('/experiences/founders-plot/skill.md');
  expect(foundersPlot.manifest?.tools).toContain('et.plot.get_state');
  expect(foundersPlot.manifest?.tools).toContain('et.plot.request_user_approval');
});

test('post-onboarding handoff opens Founders Plot in the town modal without route replacement', async ({ page }) => {
  await hatchAndConnectLite(page, 'signup');
  await unlockGateWithSigil(page, 'key');

  await page.getByTestId('open-btn').click();
  await pressOpenViaAgentApi(page);

  const foundersPlotLink = page.locator('#openReady a[href="/founders-plot"]');
  await expect(foundersPlotLink).toBeVisible({ timeout: 5000 });

  const pathBefore = await page.evaluate(() => window.location.pathname);
  await foundersPlotLink.click();

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Founders Plot');
  await expect(page.locator('#districtModalBody iframe.districtFrame')).toHaveCount(1);

  const pathAfter = await page.evaluate(() => window.location.pathname);
  expect(pathAfter).toBe(pathBefore);

  const frame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await expect(frame.locator('[data-testid="founders-hero"]')).toBeVisible({ timeout: 5000 });
  await expect(frame.locator('[data-testid="founders-status-strip"]')).toBeVisible();
  await expect(frame.locator('[data-testid="founders-board"]')).toBeVisible();
});

const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function openDistrict(page, district) {
  await page.waitForFunction(() => typeof window.showDistrict === 'function');
  await page.evaluate(async (target) => {
    await window.showDistrict(target);
  }, district);
  await expect(page.locator('#districtModalBackdrop')).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('secondary platform surfaces render the V1.4.3 asset pack', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });

  await page.goto('/house');
  await expect(page.getByTestId('house-route-platform-illustration')).toBeVisible();
  await expect(page.locator('.wrap')).toHaveScreenshot('agent-town-v1-4-3-house-route-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });

  await page.goto('/inbox/test-house');
  await expect(page.getByTestId('inbox-platform-illustration')).toBeVisible();
  await expect(page.locator('.wrap')).toHaveScreenshot('agent-town-v1-4-3-inbox-route-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });

  await page.goto('/leaderboard');
  await expect(page.getByTestId('leaderboard-route-platform-illustration')).toBeVisible();
  await expect(page.locator('.wrap')).toHaveScreenshot('agent-town-v1-4-3-leaderboard-route-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });

  await page.goto('/app');
  await openDistrict(page, 'atlas');
  const atlasFrame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await atlasFrame.getByTestId('atlas-hero').scrollIntoViewIfNeeded();
  await expect(atlasFrame.getByTestId('atlas-hero-illustration')).toBeVisible();
  await expect(atlasFrame.getByTestId('atlas-hero')).toHaveScreenshot('agent-town-v1-4-3-atlas-route-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });

  await openDistrict(page, 'saloon');
  await expect(page.getByTestId('saloon-platform-illustration')).toBeVisible();
  await expect(page.locator('#districtModalBackdrop .districtModal').first()).toHaveScreenshot('agent-town-v1-4-3-saloon-modal-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });

  await openDistrict(page, 'sigil');
  await expect(page.getByTestId('sigil-platform-illustration')).toBeVisible();
  await expect(page.locator('#districtModalBackdrop .districtModal').first()).toHaveScreenshot('agent-town-v1-4-3-sigil-modal-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });
});

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

test('Town Hall and Brain modals use the V1.4.3 route illustrations', async ({ page, request }) => {
  const townhallHtml = await request.get('/views/townhall.html').then((response) => response.text());
  const brainHtml = await request.get('/views/brain.html').then((response) => response.text());
  expect(townhallHtml).toContain('/assets/platform/townhall/townhall-onboarding-illustration-v1_4_3.webp');
  expect(brainHtml).toContain('/assets/platform/brain/brain-connect-illustration-v1_4_3.webp');

  await page.setViewportSize({ width: 1280, height: 1200 });
  await page.goto('/app');

  await openDistrict(page, 'townhall');
  await expect(page.getByTestId('townhall-onboarding-illustration')).toBeVisible();
  await expect(page.locator('#districtModalBackdrop .districtModal').first()).toHaveScreenshot('agent-town-v1-4-3-townhall-modal-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });

  await openDistrict(page, 'brain');
  await expect(page.getByTestId('brain-connect-illustration')).toBeVisible();
  await expect(page.locator('#brainTierApiKeyDetails')).not.toHaveAttribute('open', /./);
  await expect(page.locator('#districtModalBackdrop .districtModal').first()).toHaveScreenshot('agent-town-v1-4-3-brain-modal-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.04
  });
});

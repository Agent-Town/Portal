const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('Town Hall full onboarding remains reachable from the town hub', async ({ page }) => {
  await page.goto('/app?district=townhall');
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Town Hall');
  await expect(page.locator('#townhallRegisterPanel')).toBeVisible();
  await expect(page.getByTestId('townhall-single-path-note')).toBeVisible();
});

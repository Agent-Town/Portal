const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('atlas route renders and nav exposes Atlas link across core pages', async ({ page }) => {
  await page.goto('/atlas');
  await expect(page.getByTestId('atlas-root')).toBeVisible();

  const pages = ['/leaderboard', '/house', '/s/sh_missing'];
  for (const path of pages) {
    await page.goto(path);
    const atlasLink = page.getByRole('link', { name: 'Atlas' });
    await expect(atlasLink).toBeVisible();
    await expect(atlasLink).toHaveAttribute('href', '/atlas');
  }

  await page.goto('/');
  await expect(page.locator('.townDistrictHotspot[data-district="atlas"] .townDistrictLabel')).toContainText('Atlas Depot');
  await page.locator('.townDistrictHotspot[data-district="atlas"]').click();
  await expect(page.locator('#districtModalTitle')).toHaveText('Atlas Depot');
  await expect(page.locator('#districtModalBody iframe.districtFrame')).toBeVisible();
});

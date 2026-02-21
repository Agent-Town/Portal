const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('atlas district click opens detail panel and agent click opens storefront drawer', async ({ page }) => {
  await page.goto('/atlas');

  await page.getByTestId('district-open-ethereum').click();
  await expect(page.getByTestId('district-detail')).toBeVisible();
  await expect(page.locator('#atlasDistrictTitle')).toContainText('Ethereum');

  await page.getByTestId('agent-open-1:1001').click();
  await expect(page.getByTestId('storefront-drawer')).toBeVisible();
  await expect(page.getByTestId('storefront-agent-id')).toHaveText('1:1001');
  await expect(page.getByTestId('storefront-share-link')).toHaveAttribute('href', '/s/sh_fixture_eth');
});

test('atlas deep link opens storefront drawer by agent id', async ({ page }) => {
  await page.goto('/atlas?agent=1%3A1001');
  await expect(page.getByTestId('storefront-drawer')).toBeVisible();
  await expect(page.getByTestId('storefront-agent-id')).toHaveText('1:1001');
});

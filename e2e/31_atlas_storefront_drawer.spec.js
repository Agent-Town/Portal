const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openAtlasFrame(page) {
  await page.goto('/atlas');
  await expect(page.locator('#districtModalTitle')).toHaveText('Atlas Depot');
  const frame = page.locator('#districtModalBody iframe.districtFrame');
  await expect(frame).toBeVisible();
  return page.frameLocator('#districtModalBody iframe.districtFrame');
}

test('atlas district click opens detail panel and agent click opens storefront drawer', async ({ page }) => {
  const atlasFrame = await openAtlasFrame(page);

  await atlasFrame.getByTestId('district-open-ethereum').click();
  await expect(atlasFrame.getByTestId('district-detail')).toBeVisible();
  await expect(atlasFrame.locator('#atlasDistrictTitle')).toContainText('Ethereum');

  await atlasFrame.getByTestId('agent-open-1:1001').click();
  await expect(atlasFrame.getByTestId('storefront-drawer')).toBeVisible();
  await expect(atlasFrame.getByTestId('storefront-agent-id')).toHaveText('1:1001');
  await expect(atlasFrame.getByTestId('storefront-share-link')).toHaveAttribute('href', '/s/sh_fixture_eth');
});

test('atlas district network switch toggles mainnet/testnet scoped list', async ({ page }) => {
  const atlasFrame = await openAtlasFrame(page);

  await atlasFrame.getByTestId('district-open-ethereum').click();
  await expect(atlasFrame.getByTestId('agent-open-1:1001')).toBeVisible();

  await atlasFrame.locator('#atlasDistrictNetworkTest').click();
  await expect(atlasFrame.locator('#atlasDistrictStats')).toContainText('0 testnet storefront profiles');
  await expect(atlasFrame.getByText('No storefront agents listed yet.')).toBeVisible();

  await atlasFrame.locator('#atlasDistrictNetworkMain').click();
  await expect(atlasFrame.locator('#atlasDistrictStats')).toContainText('1 mainnet storefront profiles');
  await expect(atlasFrame.getByTestId('agent-open-1:1001')).toBeVisible();
});

test('atlas deep link opens storefront drawer by agent id', async ({ page }) => {
  const atlasFrame = await openAtlasFrame(page);
  await page.locator('#districtModalBody iframe.districtFrame').evaluate((iframe) => {
    iframe.src = '/atlas?embed=1&agent=1%3A1001';
  });
  await expect(atlasFrame.getByTestId('storefront-drawer')).toBeVisible();
  await expect(atlasFrame.getByTestId('storefront-agent-id')).toHaveText('1:1001');
});

test('atlas invalid district deep link shows district-specific error', async ({ page }) => {
  const atlasFrame = await openAtlasFrame(page);
  await page.locator('#districtModalBody iframe.districtFrame').evaluate((iframe) => {
    iframe.src = '/atlas?embed=1&district=not-a-district';
  });
  await expect(atlasFrame.locator('#atlasErr')).toContainText('District not found in current atlas source.');
});

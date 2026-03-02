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

test('atlas search API returns stable lexical results and chain-family filtering', async ({ request }) => {
  const byNameResp = await request.get('/api/atlas/search?q=sentinel');
  expect(byNameResp.ok()).toBeTruthy();
  const byName = await byNameResp.json();
  expect(byName.ok).toBeTruthy();
  expect(byName.results?.[0]?.erc8004Id).toBe('1:1001');

  const byIdResp = await request.get('/api/atlas/search?q=143:2001');
  expect(byIdResp.ok()).toBeTruthy();
  const byId = await byIdResp.json();
  expect(byId.ok).toBeTruthy();
  expect(byId.results?.[0]?.erc8004Id).toBe('143:2001');

  const filteredResp = await request.get('/api/atlas/search?family=monad');
  expect(filteredResp.ok()).toBeTruthy();
  const filtered = await filteredResp.json();
  expect(filtered.ok).toBeTruthy();
  expect((filtered.results || []).every((row) => row.districtKey === 'monad')).toBeTruthy();
  expect(filtered.results?.[0]?.erc8004Id).toBe('143:2001');

  const emptyResp = await request.get('/api/atlas/search');
  expect(emptyResp.ok()).toBeTruthy();
  const empty = await emptyResp.json();
  expect(empty.ok).toBeTruthy();
  expect(empty.results?.[0]?.erc8004Id).toBe('1:1001');
});

test('atlas UI search foldout and family filter update district list deterministically', async ({ page }) => {
  const atlasFrame = await openAtlasFrame(page);

  const toggle = atlasFrame.getByTestId('atlas-search-toggle');
  const input = atlasFrame.getByTestId('atlas-search-input');
  const family = atlasFrame.getByTestId('atlas-filter-chain-family');
  await expect(toggle).toBeVisible();
  await expect(input).toBeHidden();
  await toggle.click();
  await expect(input).toBeVisible();
  await expect(family).toBeVisible();

  await input.fill('zzzzzz');
  await expect(atlasFrame.getByText('No districts match this filter.')).toBeVisible();

  await input.fill('');
  await family.selectOption('ethereum');
  await expect(atlasFrame.getByTestId('district-open-ethereum')).toBeVisible();
  await expect(atlasFrame.getByTestId('district-open-monad')).toHaveCount(0);
});

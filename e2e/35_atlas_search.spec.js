const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

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

test('atlas UI search and family filter use API results deterministically', async ({ page }) => {
  await page.goto('/atlas');

  const toggle = page.getByTestId('atlas-search-toggle');
  const input = page.getByTestId('atlas-search-input');
  const family = page.getByTestId('atlas-filter-chain-family');
  await expect(toggle).toBeVisible();
  await expect(input).toBeHidden();
  await toggle.click();
  await expect(input).toBeVisible();
  await expect(family).toBeVisible();

  await input.fill('courier');
  await expect(page.getByTestId('atlas-search-result-143:2001')).toBeVisible();

  await input.fill('');
  await family.selectOption('ethereum');
  await expect(page.getByTestId('atlas-search-result-1:1001')).toBeVisible();
  await expect(page.getByTestId('atlas-search-result-143:2001')).toHaveCount(0);
});

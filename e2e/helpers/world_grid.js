const { expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function resetWorldGrid(request) {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
}

async function seedFoundersPlot(page) {
  const response = await page.goto('/api/founders-plot/state');
  expect(response?.status()).toBe(200);
}

async function openWorldGrid(page, flags = 'v50') {
  await page.goto(`/experiences/world-grid/index.html?worldGridFeatureFlags=${encodeURIComponent(flags)}`);
  await expect(page.getByText('Territory survey ready')).toBeVisible();
  await expect(page.locator('[data-world-grid-stage]')).toBeVisible();
}

async function openSeededWorldGrid(page, flags = 'all') {
  await seedFoundersPlot(page);
  await openWorldGrid(page, flags);
}

async function worldGridApi(page, path, { method = 'GET', body = null, flags = 'all' } = {}) {
  return await page.evaluate(async ({ path, method, body, flags }) => {
    const response = await fetch(path, {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-world-grid-feature-flags': flags
      },
      body: body == null ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: response.status, ok: response.ok, body: json, text };
  }, { path, method, body, flags });
}

module.exports = {
  openSeededWorldGrid,
  openWorldGrid,
  resetWorldGrid,
  seedFoundersPlot,
  worldGridApi
};

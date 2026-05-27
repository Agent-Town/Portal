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
    const normalizedMethod = String(method || 'GET').toUpperCase();
    const mutating = normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD';
    const headers = {
      'content-type': 'application/json',
      'x-world-grid-feature-flags': flags
    };
    if (mutating) {
      const tokenResponse = await fetch('/api/world/mutation-token', {
        credentials: 'include',
        headers: {
          'x-world-grid-feature-flags': flags
        }
      });
      if (tokenResponse.ok) {
        const tokenBody = await tokenResponse.json().catch(() => null);
        if (typeof tokenBody?.csrfToken === 'string' && tokenBody.csrfToken) {
          headers['x-world-grid-csrf'] = tokenBody.csrfToken;
        }
      }
    }
    const response = await fetch(path, {
      method: normalizedMethod,
      credentials: 'include',
      headers,
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

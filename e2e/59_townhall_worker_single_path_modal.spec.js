const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function ensureTownhallVisible(page) {
  const panel = page.locator('#townhallRegisterPanel');
  if (await panel.isVisible()) return;

  const modal = page.locator('#districtModalBackdrop');
  if (!(await modal.isVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect(panel).toBeVisible({ timeout: 5000 });
}

test('town hall exposes only the single worker path controls', async ({ page }) => {
  await page.goto('/app');
  await ensureTownhallVisible(page);

  await expect(page.getByTestId('townhall-single-path-note')).toBeVisible();
  await expect(page.getByTestId('path-human')).toHaveCount(0);
  await expect(page.getByTestId('path-coop')).toHaveCount(0);
  await expect(page.getByTestId('path-agent')).toHaveCount(0);
});

test('town hall opens /create inside the district modal frame', async ({ page }) => {
  const createResp = await page.request.get('/create');
  expect(createResp.ok()).toBeTruthy();
  expect(String(createResp.headers()['x-frame-options'] || '').toUpperCase()).toContain('SAMEORIGIN');

  await page.goto('/app');
  await ensureTownhallVisible(page);

  await page.evaluate(() => {
    const link = document.querySelector('#openReady a[href="/create"]');
    if (!link) throw new Error('MISSING_CREATE_LINK');
    link.click();
  });

  await expect(page).toHaveURL(/\/app/);
  await expect(page.locator('#districtModalTitle')).toHaveText('Ceremony');
  const frame = page.locator('#districtModalBody iframe.districtFrame');
  await expect(frame).toBeVisible({ timeout: 5000 });
  await expect(frame).toHaveAttribute('src', /\/create/);
});

const { test, expect } = require('@playwright/test');
const { openSeededWorldGrid, resetWorldGrid, worldGridApi } = require('./helpers/world_grid');

test.beforeEach(async ({ request }) => {
  await resetWorldGrid(request);
});

test('V5.2 Public Presence and Safe Player Discovery smoke escapes malicious public names', async ({ page }) => {
  await openSeededWorldGrid(page, 'v50,v52');

  await page.evaluate(() => {
    window.__worldGridXssExecuted = false;
  });

  const townName = 'Bad <img src=x onerror="window.__worldGridXssExecuted=true">';
  const displayName = 'Founder <svg onload="window.__worldGridXssExecuted=true"></svg>';
  const optIn = await worldGridApi(page, '/api/world/public-presence/opt-in', {
    method: 'POST',
    flags: 'v50,v52',
    body: {
      displayName,
      townName,
      idempotencyKey: 'e2e_v52_public_presence_xss',
      privacy: { showOperatingStyle: true, showRegion: true, allowVisits: true }
    }
  });
  expect(optIn.status).toBe(200);

  await page.evaluate(() => window.__worldGridTest.refreshPublicPresence());
  const list = page.locator('[data-world-grid-public-list]');
  await expect(list).toContainText('Bad <img');
  await expect(list).toContainText('Founder <svg');
  await expect(list.locator('img, svg, script')).toHaveCount(0);
  expect(await page.evaluate(() => window.__worldGridXssExecuted === true)).toBe(false);

  await page.getByRole('button', { name: 'Opt out' }).click();
  await expect(list).toContainText('No public neighbors yet.');
});

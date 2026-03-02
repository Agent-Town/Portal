const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function openAnyDistrictModal(page) {
  const districts = ['townhall', 'house', 'leaderboard', 'pony', 'saloon'];
  for (const district of districts) {
    const hotspot = page.locator(`[data-district="${district}"]`).first();
    if (await hotspot.count()) {
      await hotspot.click({ force: true });
      await page.waitForTimeout(250);
      const isOpen = await page.evaluate(() => {
        const backdrop = document.getElementById('districtModalBackdrop');
        return !!backdrop && !backdrop.classList.contains('is-hidden');
      });
      if (isOpen) return true;
    }
  }
  return false;
}

test('town district modal stays above expanded agent panel', async ({ page }) => {
  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        config: null,
        startPageEnabled: false,
        appPath: '/app',
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  await page.goto('/app');
  await expect(page.getByTestId('agent-panel')).toBeVisible({ timeout: 3000 });

  const opened = await openAnyDistrictModal(page);
  expect(opened).toBe(true);

  const metrics = await page.evaluate(() => {
    const panel = document.getElementById('agentSidebar');
    const modal = document.querySelector('.districtModal');
    const backdrop = document.getElementById('districtModalBackdrop');
    if (!panel || !modal || !backdrop) return null;
    const panelRect = panel.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    const backdropRect = backdrop.getBoundingClientRect();
    return {
      panelTop: Math.round(panelRect.top),
      modalBottom: Math.round(modalRect.bottom),
      backdropBottom: Math.round(backdropRect.bottom),
      panelHeight: Math.round(panelRect.height),
      insetVar: String(getComputedStyle(document.documentElement).getPropertyValue('--agent-panel-page-inset') || '').trim(),
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics.panelHeight).toBeGreaterThan(100);
  expect(metrics.modalBottom).toBeLessThanOrEqual(metrics.panelTop + 2);
  expect(metrics.backdropBottom).toBeLessThanOrEqual(metrics.panelTop + 2);
});

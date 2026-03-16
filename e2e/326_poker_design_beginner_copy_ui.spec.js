const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D5 copy: lobby and live table use beginner-friendly teammate language', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 1440, height: 1200 },
  });

  try {
    const { page } = resources;

    await page.goto('/poker/play?embed=1');
    const quickSeat = page.locator('[data-poker-section="quick-seat"]');
    await expect(quickSeat).toContainText('Find Or Create Table');
    await expect(quickSeat).toContainText('Watch Public Tables');
    await expect(quickSeat).not.toContainText('Native Season');

    await page.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
    await expect(page.locator('[data-poker-section="worker-seat-agent"] h2')).toHaveText('AI Teammate Suggestion');
    await expect(page.locator('[data-poker-section="seat-thread"] h2')).toHaveText('Team Notes');
    await expect(page.locator('[data-poker-section="auto-act"] h2')).toHaveText('Auto Play Help');
    await expect(page.locator('[data-poker-section="submit-action"] h2')).toHaveText('Submit Action');

    const bodyText = ((await page.locator('body').textContent()) || '').toLowerCase();
    expect(bodyText).not.toMatch(/worker seat agent/);
    expect(bodyText).not.toMatch(/seat-agent/);
    expect(bodyText).not.toMatch(/\bauto-act\b/);
  } finally {
    await closeDesignLiveTable(resources);
  }
});

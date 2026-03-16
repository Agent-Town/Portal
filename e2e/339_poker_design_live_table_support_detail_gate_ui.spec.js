const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 detail gate: live table reveals thread and auto-play controls only after explicit open', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request);
  const { page } = resources;

  await page.locator('[data-poker-section="seat-thread"] details summary').click();
  await expect(page.locator('#pokerPlayMessageForm')).toBeVisible();

  await page.locator('[data-poker-section="auto-act"] details summary').click();
  await expect(page.locator('#pokerPlayAutoActForm')).toBeVisible();

  await page.locator('[data-poker-section="flag-review"] details summary').click();
  await expect(page.locator('#pokerPlayDisputeForm')).toBeVisible();

  await closeDesignLiveTable(resources);
});

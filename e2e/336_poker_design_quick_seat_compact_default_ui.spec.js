const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignPage,
  openDesignLobby,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 dead-simple default: quick seat keeps only game choice and primary join action visible', async ({ browser, request }) => {
  const resources = await openDesignLobby(browser, request, {
    viewport: { width: 390, height: 844 },
  });
  const { page } = resources;

  const quickSeatSection = page.locator('[data-poker-section="quick-seat"]');
  await expect(quickSeatSection.locator('#pokerPlayMatchmakeType')).toBeVisible();
  await expect(quickSeatSection.locator('#pokerPlayMatchmakeForm button[type="submit"]')).toBeVisible();
  await expect(quickSeatSection.locator('#pokerPlayMatchmakeSimpleSummary')).toContainText('Default:');
  await expect(quickSeatSection.locator('#pokerPlayMatchmakeAccess')).toBeHidden();
  await expect(quickSeatSection.locator('#pokerPlayMatchmakeSmallBlind')).toBeHidden();
  await expect(quickSeatSection.locator('#pokerPlayMatchmakeBuyIn')).toBeHidden();

  await closeDesignPage(resources);
});

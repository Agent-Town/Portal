const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D6 international: Chinese live table keeps the action lane visible while support tools stay collapsed', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
    uiLocale: 'zh-Hans',
  });
  const { page } = resources;

  await expect(page.locator('[data-poker-section="submit-action"] h2')).toHaveText('提交动作');
  await expect(page.locator('#pokerPlayActionForm button[type="submit"]')).toBeVisible();
  await expect(page.locator('#pokerPlayMessageForm')).toBeHidden();
  await expect(page.locator('#pokerPlayAutoActForm')).toBeHidden();

  await closeDesignLiveTable(resources);
});

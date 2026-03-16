const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 accessibility: disabled poker controls are visibly inactive instead of merely unavailable', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request);
  const { page } = resources;

  const returnButton = page.locator('#pokerPlayReturnButton');
  await expect(returnButton).toBeDisabled();

  const disabledStyle = await returnButton.evaluate((node) => {
    const computed = window.getComputedStyle(node);
    return {
      opacity: Number(computed.opacity || 1),
      cursor: computed.cursor,
      filter: computed.filter,
    };
  });

  expect(disabledStyle.opacity).toBeLessThan(0.6);
  expect(disabledStyle.cursor).toBe('not-allowed');
  expect(disabledStyle.filter).not.toBe('none');

  await closeDesignLiveTable(resources);
});

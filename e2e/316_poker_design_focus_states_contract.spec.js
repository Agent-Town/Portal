const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignLiveTable, openDesignLiveTable } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D4 accessibility: keyboard focus exposes a visible ring on live-table action controls', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
  });
  const { page } = resources;

  let found = false;
  for (let index = 0; index < 24; index += 1) {
    await page.keyboard.press('Tab');
    found = await page.evaluate(() => {
      const active = document.activeElement;
      return !!active && !!active.closest('[data-poker-section="submit-action"]');
    });
    if (found) break;
  }
  expect(found).toBe(true);

  const focusStyle = await page.evaluate(() => {
    const active = document.activeElement;
    const computed = window.getComputedStyle(active);
    return {
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      boxShadow: computed.boxShadow,
    };
  });

  expect(focusStyle.outlineWidth).not.toBe('0px');
  expect(focusStyle.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(focusStyle.boxShadow).not.toBe('none');

  await closeDesignLiveTable(resources);
});

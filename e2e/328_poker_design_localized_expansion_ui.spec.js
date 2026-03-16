const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignLiveTable,
  closeDesignPage,
  openDesignLiveTable,
  openDesignSchedule,
} = require('./helpers/poker_design');

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D5 localization stress: schedule actions stay within bounds under Chinese expansion', async ({ browser, request }) => {
  const resources = await openDesignSchedule(browser, request, {
    viewport: { width: 390, height: 844 },
    uiLocale: 'zh-Hans',
    uiCopy: 'stress',
  });

  try {
    const { page } = resources;
    await expect(page.locator('#pokerTitle')).toHaveText('赛事日程');
    await expect(page.locator('[data-poker-section="schedule-snapshot"] h2')).toHaveText('今日赛事');
    const firstAction = page.locator('[data-schedule-action-kind]').first();
    await expect(firstAction).toBeVisible();
    const actionBox = await firstAction.boundingBox();
    expect(actionBox).toBeTruthy();
    expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(390);
    await expectNoHorizontalOverflow(page);
  } finally {
    await closeDesignPage(resources);
  }
});

test('D5 localization stress: live table primary action keeps room for longer Chinese labels', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
    uiLocale: 'zh-Hans',
    uiCopy: 'stress',
  });

  try {
    const { page } = resources;
    const submitButton = page.locator('#pokerPlayActionForm button[type="submit"]');
    await expect(submitButton).toHaveText('确认当前团队动作');
    const submitBox = await submitButton.boundingBox();
    expect(submitBox).toBeTruthy();
    expect(submitBox.x + submitBox.width).toBeLessThanOrEqual(390);

    const teammateButton = page.locator('#pokerSeatAgentProposeButton');
    await expect(teammateButton).toBeVisible();
    const teammateBox = await teammateButton.boundingBox();
    expect(teammateBox).toBeTruthy();
    expect(teammateBox.x + teammateBox.width).toBeLessThanOrEqual(390);
    await expectNoHorizontalOverflow(page);
  } finally {
    await closeDesignLiveTable(resources);
  }
});

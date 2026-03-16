const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignLiveTable,
  closeDesignPage,
  openDesignCentaurTable,
  openDesignLiveTable,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D5 international persona: Chinese live table keeps the action lane ahead of team support', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
    uiLocale: 'zh-Hans',
  });

  try {
    const { page } = resources;
    await expect(page.locator('#pokerTitle')).toHaveText('实时牌桌');
    await expect(page.locator('[data-poker-section="current-hand"] h2')).toHaveText('当前手牌');
    await expect(page.locator('[data-poker-section="submit-action"] h2')).toHaveText('提交动作');
    await expect(page.locator('[data-poker-section="seat-thread"] h2')).toHaveText('团队笔记');

    const currentHand = page.locator('[data-poker-section="current-hand"]');
    const submitAction = page.locator('[data-poker-section="submit-action"]');
    const seatThread = page.locator('[data-poker-section="seat-thread"]');

    const [currentHandBox, submitActionBox, seatThreadBox] = await Promise.all([
      currentHand.boundingBox(),
      submitAction.boundingBox(),
      seatThread.boundingBox(),
    ]);

    expect(currentHandBox).toBeTruthy();
    expect(submitActionBox).toBeTruthy();
    expect(seatThreadBox).toBeTruthy();
    expect(currentHandBox.y).toBeLessThan(submitActionBox.y);
    expect(submitActionBox.y).toBeLessThan(seatThreadBox.y);
  } finally {
    await closeDesignLiveTable(resources);
  }
});

test('D5 international persona: Chinese centaur table keeps commit controls ahead of discussion', async ({ browser, request }) => {
  const resources = await openDesignCentaurTable(browser, request, {
    viewport: { width: 390, height: 844 },
    uiLocale: 'zh-Hans',
  });

  try {
    const { page } = resources;
    await expect(page.locator('#pokerTitle')).toHaveText('半人马牌桌');
    await expect(page.locator('[data-poker-section="centaur-live-hand"] h2')).toHaveText('实时手牌');
    await expect(page.locator('[data-poker-section="centaur-submit-action"] h2')).toHaveText('锁定团队动作');
    await expect(page.locator('[data-poker-section="centaur-discussion"] h2')).toHaveText('团队讨论');

    const liveHand = page.locator('[data-poker-section="centaur-live-hand"]');
    const submitAction = page.locator('[data-poker-section="centaur-submit-action"]');
    const discussion = page.locator('[data-poker-section="centaur-discussion"]');

    const [liveHandBox, submitActionBox, discussionBox] = await Promise.all([
      liveHand.boundingBox(),
      submitAction.boundingBox(),
      discussion.boundingBox(),
    ]);

    expect(liveHandBox).toBeTruthy();
    expect(submitActionBox).toBeTruthy();
    expect(discussionBox).toBeTruthy();
    expect(liveHandBox.y).toBeLessThan(submitActionBox.y);
    expect(submitActionBox.y).toBeLessThan(discussionBox.y);
  } finally {
    await closeDesignPage(resources);
  }
});

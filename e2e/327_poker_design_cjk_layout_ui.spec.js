const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignLiveTable,
  closeDesignPage,
  openDesignLiveTable,
  openDesignNativeSeason,
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

test('D5 international: live table keeps Chinese primary controls visible on mobile', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
    uiLocale: 'zh-Hans',
  });

  try {
    const { page } = resources;
    await expect(page.locator('html[data-poker-locale="zh-Hans"]')).toBeVisible();
    await expect(page.locator('#pokerTitle')).toHaveText('实时牌桌');
    await expect(page.locator('[data-poker-section="current-hand"] h2')).toHaveText('当前手牌');
    await expect(page.locator('[data-poker-section="worker-seat-agent"] h2')).toHaveText('AI 队友建议');
    await expect(page.locator('[data-poker-section="submit-action"] h2')).toHaveText('提交动作');

    const submitButton = page.locator('#pokerPlayActionForm button[type="submit"]');
    const teammateButton = page.locator('#pokerSeatAgentProposeButton');
    await expect(submitButton).toBeVisible();
    await expect(teammateButton).toBeVisible();

    const [submitBox, teammateBox] = await Promise.all([
      submitButton.boundingBox(),
      teammateButton.boundingBox(),
    ]);
    expect(submitBox).toBeTruthy();
    expect(teammateBox).toBeTruthy();
    expect(submitBox.x + submitBox.width).toBeLessThanOrEqual(390);
    expect(teammateBox.x + teammateBox.width).toBeLessThanOrEqual(390);
    await expectNoHorizontalOverflow(page);
  } finally {
    await closeDesignLiveTable(resources);
  }
});

test('D5 international: native season keeps Chinese layout composed on desktop', async ({ browser, request }) => {
  const resources = await openDesignNativeSeason(browser, request, {
    viewport: { width: 1280, height: 960 },
    uiLocale: 'zh-Hans',
  });

  try {
    const { page } = resources;
    await expect(page.locator('html[data-poker-locale="zh-Hans"]')).toBeVisible();
    await expect(page.locator('#pokerTitle')).toHaveText('实时赛季');
    await expect(page.locator('[data-poker-section="season-leaderboard"]')).toBeVisible();
    await expect(page.locator('[data-poker-section="season-leaderboard"] [data-native-season-rank]').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  } finally {
    await closeDesignPage(resources);
  }
});

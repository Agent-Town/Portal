const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

const AS_OF = '2026-03-16T09:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D0 harness: lobby and live table expose stable design view and section hooks', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockDesignA11111111111111111111111111111',
    houseId: 'house_design_a',
    streamId: 'stream-design-a',
  };
  const userB = {
    address: 'So1anaMockDesignB11111111111111111111111111111',
    houseId: 'house_design_b',
    streamId: 'stream-design-b',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: userA.address,
        streamId: userA.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: userB.address,
        streamId: userB.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  await bindPageSession(pageA, userA);
  await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Design Alpha',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Design Bravo',
      buyInOil: 400,
    },
  });
  expect(resp.ok).toBe(true);

  await pageA.goto('/poker/play?embed=1');
  await expect(pageA.locator('body[data-poker-view="play-lobby"]')).toBeVisible();
  await expect(pageA.locator('[data-poker-section="quick-seat"]')).toBeVisible();
  await expect(pageA.locator('[data-poker-section="live-tables"]')).toBeVisible();

  await pageA.evaluate(() => window.localStorage.setItem('poker.adminToken', 'test-admin'));
  await pageA.goto('/poker/play/tables/pkt_play_cash_01?embed=1');
  await expect(pageA.locator('body[data-poker-view="play-table"]')).toBeVisible();
  await expect(pageA.locator('[data-poker-section="table-summary"]')).toBeVisible();
  await expect(pageA.locator('[data-poker-section="current-hand"]')).toBeVisible();
  await expect(pageA.locator('[data-poker-section="submit-action"]')).toBeVisible();
  await expect(pageA.locator('[data-poker-section="seat-thread"]')).toBeVisible();
  await expect(pageA.locator('[data-poker-section="operator-review"]')).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test('D0 harness: schedule, review, and native season routes expose stable design hooks', async ({ browser, request }) => {
  const seededSchedule = await seedPokerPlayHarness(request, {
    scenario: 'schedule_calendar_story',
    asOf: AS_OF,
    tableId: 'pkt_play_design_schedule_story',
    actors: [
      {
        seatNumber: 1,
        address: 'So1anaMockDesignSched111111111111111111111111',
        houseId: 'house_design_schedule',
        displayName: 'Schedule Viewer',
      },
    ],
  });
  const seededReview = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: AS_OF,
    tableId: 'pkt_play_design_review_story',
  });
  await seedPokerPlayHarness(request, {
    scenario: 'economy_native_season_story',
    asOf: AS_OF,
    tableId: 'pkt_play_design_season_story',
  });

  const viewer = seededReview?.actors?.[0] || seededSchedule?.actors?.[0];
  const tableId = String(seededReview?.tableIds?.[0] || seededReview?.tableId || '');
  expect(viewer?.address).toBeTruthy();
  expect(tableId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: viewer.address,
    houseId: viewer.houseId,
  });

  await page.goto(`/poker/play/schedule?asOf=${encodeURIComponent(AS_OF)}&embed=1`);
  await expect(page.locator('body[data-poker-view="play-schedule"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="schedule-snapshot"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="schedule-day"]').first()).toBeVisible();

  const historyResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history?status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(historyResp.ok).toBe(true);
  const handId = String(historyResp.body?.data?.items?.[0]?.handId || '');
  expect(handId).toBeTruthy();

  await page.goto(`/poker/play/hands/${encodeURIComponent(handId)}/review?embed=1&asOf=${encodeURIComponent(AS_OF)}`);
  await expect(page.locator('body[data-poker-view="play-hand-review"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="review-result-summary"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="review-notebook"]')).toBeVisible();

  await page.goto(`/poker/play/seasons/native?asOf=${encodeURIComponent(AS_OF)}&embed=1`);
  await expect(page.locator('body[data-poker-view="play-native-season"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="season-summary"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="season-leaderboard"]')).toBeVisible();

  await context.close();
});

test('D0 harness: centaur routes expose stable design hooks', async ({ browser, request }) => {
  await seedPokerPlayHarness(request, {
    scenario: 'economy_native_season_story',
    asOf: AS_OF,
    tableId: 'pkt_play_design_centaur_anchor',
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/poker/centaur?embed=1');

  await expect(page.locator('body[data-poker-view="centaur-lobby"]')).toBeVisible();
  await expect(page.locator('[data-poker-section="centaur-eligibility"]')).toBeVisible();

  await context.close();
});

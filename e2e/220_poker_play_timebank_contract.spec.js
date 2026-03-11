const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.5: seats can spend time bank explicitly and the timeout loop auto-consumes the remainder once', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaPhase22TimeBankA1111111111111111111111',
    houseId: 'house_phase22_timebank_a',
  };
  const actorSet = [
    {
      seatNumber: 1,
      address: userA.address,
      houseId: userA.houseId,
      displayName: 'Clock Alpha',
    },
    {
      seatNumber: 2,
      address: 'So1anaPhase22TimeBankB1111111111111111111111',
      houseId: 'house_phase22_timebank_b',
      displayName: 'Clock Bravo',
    },
  ];

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, userA);

  const manual = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: '2026-03-11T10:20:00.000Z',
    actors: actorSet,
  });
  const initialDetail = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(manual.tableId)}?asOf=${encodeURIComponent('2026-03-11T10:20:00.000Z')}`, {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(initialDetail.ok).toBe(true);
  const initialExpiryMs = Date.parse(String(initialDetail.body?.data?.hand?.actionExpiresAt || ''));
  expect(initialDetail.body?.data?.hand?.timeBankRemainingSeconds).toBe(15);
  expect(initialDetail.body?.data?.hand?.canUseTimeBank).toBe(true);

  const manualResp = await browserJson(page, `/api/poker/play/hands/${encodeURIComponent(manual.handId)}/timebank`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      asOf: '2026-03-11T10:20:01.000Z',
    },
  });
  expect(manualResp.ok).toBe(true);
  const manualData = manualResp.body?.data || {};
  expect(manualData?.hand?.status).toBe('live');
  expect(manualData?.hand?.timeBankRemainingSeconds).toBe(0);
  expect(manualData?.hand?.canUseTimeBank).toBe(false);
  expect(Date.parse(String(manualData?.hand?.actionExpiresAt || ''))).toBe(initialExpiryMs + 15000);
  expect((manualData?.messages || []).some((message) => String(message?.body || '').includes('uses 15s of time bank'))).toBe(true);

  const manualReview = await browserJson(page, `/api/poker/play/admin/tables/${encodeURIComponent(manual.tableId)}/review`, {
    headers: {
      'x-wallet-solana-address': userA.address,
      'x-admin-token': 'test-admin',
    },
  });
  expect(manualReview.ok).toBe(true);
  expect((manualReview.body?.data?.auditEvents || []).some((event) => event?.eventKind === 'time_bank_used')).toBe(true);

  const autoSeed = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: '2026-03-11T10:25:00.000Z',
    actors: actorSet,
  });
  const autoResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(autoSeed.tableId)}?asOf=${encodeURIComponent('2026-03-11T10:25:11.000Z')}`, {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(autoResp.ok).toBe(true);
  const autoData = autoResp.body?.data || {};
  expect(autoData?.hand?.status).toBe('live');
  expect(autoData?.hand?.timeBankRemainingSeconds).toBe(0);
  expect(Date.parse(String(autoData?.hand?.actionExpiresAt || ''))).toBe(Date.parse('2026-03-11T10:25:11.000Z') + 15000);

  const autoReview = await browserJson(page, `/api/poker/play/admin/tables/${encodeURIComponent(autoSeed.tableId)}/review?asOf=${encodeURIComponent('2026-03-11T10:25:11.000Z')}`, {
    headers: {
      'x-wallet-solana-address': userA.address,
      'x-admin-token': 'test-admin',
    },
  });
  expect(autoReview.ok).toBe(true);
  expect((autoReview.body?.data?.auditEvents || []).some((event) => event?.eventKind === 'time_bank_auto_used')).toBe(true);

  await context.close();
});

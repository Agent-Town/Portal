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

test('M22.1: the Phase 22 poker harness seeds deterministic live scenarios for table detail reads', async ({ browser, request }) => {
  const actingUser = {
    address: 'So1anaPhase22HarnessC1111111111111111111111111',
    houseId: 'house_phase22_harness_c',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'sidepot_live',
    asOf: '2026-03-11T10:00:00.000Z',
    actors: [
      {
        seatNumber: 1,
        address: 'So1anaPhase22HarnessA1111111111111111111111111',
        houseId: 'house_phase22_harness_a',
        displayName: 'Harness Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaPhase22HarnessB1111111111111111111111111',
        houseId: 'house_phase22_harness_b',
        displayName: 'Harness Bravo',
      },
      {
        seatNumber: 3,
        address: actingUser.address,
        houseId: actingUser.houseId,
        displayName: 'Harness Charlie',
      },
    ],
  });
  expect(seeded?.scenario).toBe('sidepot_live');
  expect(seeded?.tableId).toBeTruthy();
  expect(seeded?.handId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, actingUser);

  const detailResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}?asOf=${encodeURIComponent('2026-03-11T10:00:00.000Z')}`, {
    headers: { 'x-wallet-solana-address': actingUser.address },
  });
  expect(detailResp.ok).toBe(true);
  expect(detailResp.body?.data?.hand?.handId).toBe(seeded.handId);
  expect(detailResp.body?.data?.hand?.status).toBe('live');
  expect(detailResp.body?.data?.hand?.actingSeat).toBe(3);
  expect(detailResp.body?.data?.hand?.viewerAllowedActions).toContain('check');

  await context.close();
});

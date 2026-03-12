const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T14:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

async function loadCompletedCashHistory(page, tableId) {
  const historyResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history?status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(historyResp.ok).toBe(true);
  return historyResp.body?.data || {};
}

test('M25.5: notebook entries persist privately for the bound wallet and stay attached to the reviewed hand', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_study_contract',
  });
  const tableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  const actor = seeded?.actors?.[0] || null;
  expect(tableId).toBeTruthy();
  expect(actor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  const history = await loadCompletedCashHistory(page, tableId);
  const handId = String(history?.items?.[0]?.handId || '');
  expect(handId).toBeTruthy();

  const createResp = await browserJson(page, '/api/poker/play/notebook', {
    method: 'POST',
    data: {
      tableId,
      handId,
      topic: 'River bluff-catch',
      body: 'Call down on paired turns against one barrel and tag the blocker logic.',
      tags: ['river', 'bluff-catch', 'paired-turn'],
    },
  });
  expect(createResp.ok).toBe(true);
  expect(createResp.body?.data?.entry?.entryKind).toBe('notebook');
  expect(createResp.body?.data?.entry?.authorRole).toBe('human');
  expect(createResp.body?.data?.entry?.handId).toBe(handId);

  const listResp = await browserJson(page, `/api/poker/play/notebook?handId=${encodeURIComponent(handId)}&asOf=${encodeURIComponent(AS_OF)}`);
  expect(listResp.ok).toBe(true);
  expect(listResp.body?.data?.viewerMode).toBe('player');
  expect(listResp.body?.data?.items).toHaveLength(1);
  expect(listResp.body?.data?.items?.[0]?.body).toContain('Call down on paired turns');
  expect(listResp.body?.data?.items?.[0]?.tags).toEqual(['river', 'bluff-catch', 'paired-turn']);
  expect(listResp.body?.data?.items?.[0]?.tableId).toBe(tableId);
  expect(listResp.body?.data?.items?.[0]?.handId).toBe(handId);

  const publicResp = await request.get(`/api/poker/play/notebook?handId=${encodeURIComponent(handId)}&asOf=${encodeURIComponent(AS_OF)}`);
  expect(publicResp.status()).toBe(401);
  const publicBody = await publicResp.json();
  expect(publicBody.ok).toBe(false);
  expect(publicBody.error?.code).toBe('AUTH_REQUIRED');

  await context.close();
});

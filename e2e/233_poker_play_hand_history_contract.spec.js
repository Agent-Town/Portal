const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

async function requestJson(responsePromise) {
  const response = await responsePromise;
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.10: player hand history stays ordered, filterable, and privacy-safe while results reconcile to seeded seats', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: '2026-03-11T14:00:00.000Z',
    tableId: 'pkt_play_phase22_history_story',
  });
  const cashTableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  const tournamentTableId = String(seeded?.tableIds?.[1] || '');
  const actor = seeded?.actors?.[0] || null;
  expect(cashTableId).toBeTruthy();
  expect(tournamentTableId).toBeTruthy();
  expect(actor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  const historyResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(cashTableId)}/history?status=completed&asOf=2026-03-11T14%3A00%3A00.000Z`);
  expect(historyResp.ok).toBe(true);
  expect(historyResp.body?.data?.viewerMode).toBe('player');
  expect(historyResp.body?.data?.table?.tableId).toBe(cashTableId);
  expect(historyResp.body?.data?.filter?.status).toBe('completed');
  expect(historyResp.body?.data?.items).toHaveLength(2);
  expect(historyResp.body?.data?.items?.map((item) => Number(item?.handNumber || 0))).toEqual([2, 1]);
  expect(historyResp.body?.data?.items?.[0]?.agentProposal?.body).toBe('Call once and re-evaluate on the river if the board pairs.');

  const repeatHistoryResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(cashTableId)}/history?status=completed&asOf=2026-03-11T14%3A00%3A00.000Z`);
  expect(repeatHistoryResp.ok).toBe(true);
  expect(repeatHistoryResp.body?.data?.items?.map((item) => item?.handId)).toEqual(historyResp.body?.data?.items?.map((item) => item?.handId));

  const publicHistoryResp = await requestJson(
    request.get(`/api/poker/play/tables/${encodeURIComponent(cashTableId)}/history?status=completed&asOf=2026-03-11T14%3A00%3A00.000Z`)
  );
  expect(publicHistoryResp.response.ok()).toBe(true);
  expect(publicHistoryResp.body?.data?.viewerMode).toBe('public');
  expect(publicHistoryResp.body?.data?.items).toHaveLength(2);
  expect(JSON.stringify(publicHistoryResp.body?.data?.items || [])).not.toContain('Call once and re-evaluate on the river if the board pairs.');
  expect(JSON.stringify(publicHistoryResp.body?.data?.items || [])).not.toContain('"holeCards"');
  expect(JSON.stringify(publicHistoryResp.body?.data?.items || [])).not.toContain('Kh');
  expect(JSON.stringify(publicHistoryResp.body?.data?.items || [])).not.toContain('Qs');

  const resultsResp = await browserJson(page, '/api/poker/play/results/me?asOf=2026-03-11T14%3A00%3A00.000Z');
  expect(resultsResp.ok).toBe(true);
  expect(Number(resultsResp.body?.data?.summary?.tableCount || 0)).toBe(2);
  expect(Number(resultsResp.body?.data?.summary?.buyInOil || 0)).toBe(1000);
  expect(Number(resultsResp.body?.data?.summary?.prizeOil || 0)).toBe(450);
  expect(Number(resultsResp.body?.data?.summary?.netOil || 0)).toBe(-550);
  const tournamentRow = (resultsResp.body?.data?.items || []).find((item) => String(item?.tableId || '') === tournamentTableId);
  expect(tournamentRow).toBeTruthy();
  expect(tournamentRow?.seriesTitle).toBe('Harness Results Series');
  expect(Number(tournamentRow?.finishPosition || 0)).toBe(2);
  expect(Number(tournamentRow?.prizeOil || 0)).toBe(450);

  await context.close();
});

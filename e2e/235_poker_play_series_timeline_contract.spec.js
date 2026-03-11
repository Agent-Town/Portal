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

test('M22.11: series timeline stays ordered across tables and public-safe while preserving player-private bodies only for the bound seat', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'series_timeline_story',
    asOf: '2026-03-11T15:00:00.000Z',
    tableId: 'pkt_play_phase22_timeline_story',
  });
  const seriesId = String(seeded?.seriesId || '');
  const actor = seeded?.actors?.[0] || null;
  expect(seriesId).toBeTruthy();
  expect(actor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  const playerResp = await browserJson(page, `/api/poker/play/series/${encodeURIComponent(seriesId)}/timeline?asOf=2026-03-11T15%3A00%3A00.000Z`);
  expect(playerResp.ok).toBe(true);
  expect(playerResp.body?.data?.viewerMode).toBe('player');
  expect(Number(playerResp.body?.data?.summary?.tableCount || 0)).toBe(2);
  expect(Number(playerResp.body?.data?.summary?.eventCount || 0)).toBe(10);
  expect((playerResp.body?.data?.items || []).map((item) => item?.eventKind)).toEqual([
    'director_table_started',
    'seat_agent_proposal',
    'director_registration_closed',
    'dispute_opened',
    'dispute_resolved',
    'director_seat_moved',
    'director_table_broken',
    'tournament_payout_paid',
    'tournament_refund_issued',
    'table_closed',
  ]);
  expect(playerResp.body?.data?.items?.[1]?.payload?.body).toBe('Jam the turn and deny the redraw.');

  const repeatPlayerResp = await browserJson(page, `/api/poker/play/series/${encodeURIComponent(seriesId)}/timeline?asOf=2026-03-11T15%3A00%3A00.000Z`);
  expect(repeatPlayerResp.ok).toBe(true);
  expect((repeatPlayerResp.body?.data?.items || []).map((item) => `${item?.createdAt}:${item?.eventKind}`))
    .toEqual((playerResp.body?.data?.items || []).map((item) => `${item?.createdAt}:${item?.eventKind}`));

  const publicResp = await requestJson(
    request.get(`/api/poker/play/rail/series/${encodeURIComponent(seriesId)}/timeline?asOf=2026-03-11T15%3A00%3A00.000Z`)
  );
  expect(publicResp.response.ok()).toBe(true);
  expect(publicResp.body?.data?.viewerMode).toBe('public');
  expect(Number(publicResp.body?.data?.summary?.eventCount || 0)).toBe(10);
  expect((publicResp.body?.data?.items || []).map((item) => item?.eventKind))
    .toEqual((playerResp.body?.data?.items || []).map((item) => item?.eventKind));
  const privateBodyCount = (publicResp.body?.data?.items || []).filter((item) => typeof item?.payload?.body === 'string' && item.payload.body.trim()).length;
  expect(privateBodyCount).toBe(0);
  expect(JSON.stringify(publicResp.body?.data?.items || [])).not.toContain('Jam the turn and deny the redraw.');

  await context.close();
});

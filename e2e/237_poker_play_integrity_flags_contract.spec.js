const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

async function requestJson(responsePromise) {
  const response = await responsePromise;
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.12: seeded suspicious patterns create durable integrity flags and operator review resolves them without leaking private seat-thread bodies', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'integrity_flag_story',
    asOf: '2026-03-11T16:00:00.000Z',
    tableId: 'pkt_play_phase22_integrity_story',
  });
  const tableId = String(seeded?.tableId || '');
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

  const tableResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-11T16%3A00%3A00.000Z`);
  expect(tableResp.ok).toBe(true);
  expect(Number(tableResp.body?.data?.review?.integrity?.openFlagCount || 0)).toBe(2);

  const queueResp = await requestJson(
    request.get('/api/poker/play/admin/integrity?asOf=2026-03-11T16%3A00%3A00.000Z', {
      headers: ADMIN_HEADERS,
    })
  );
  expect(queueResp.response.ok()).toBe(true);
  expect(Number(queueResp.body?.data?.summary?.openFlagCount || 0)).toBe(2);
  expect(Number(queueResp.body?.data?.summary?.resolvedFlagCount || 0)).toBe(0);
  expect((queueResp.body?.data?.items || []).map((item) => String(item?.category || '')).sort()).toEqual([
    'multi_dispute_cluster',
    'shared_house_multi_seat',
  ]);
  expect(JSON.stringify(queueResp.body?.data || {})).not.toContain('Do not leak this private seat note outside the review queue.');
  expect(JSON.stringify(queueResp.body?.data || {})).not.toContain('Keep this private seat-agent warning inside the seat thread.');

  const flagsByCategory = new Map(
    (queueResp.body?.data?.items || []).map((item) => [String(item?.category || ''), String(item?.flagId || '')])
  );
  const sharedFlagId = flagsByCategory.get('shared_house_multi_seat');
  const disputeFlagId = flagsByCategory.get('multi_dispute_cluster');
  expect(sharedFlagId).toBeTruthy();
  expect(disputeFlagId).toBeTruthy();

  let resolveResp = await requestJson(
    request.post(`/api/poker/play/admin/integrity/${encodeURIComponent(sharedFlagId)}/resolve`, {
      headers: {
        ...ADMIN_HEADERS,
        'content-type': 'application/json',
      },
      data: {
        status: 'resolved',
        resolutionNote: 'Operator verified the shared-house collision signal.',
        asOf: '2026-03-11T16:00:05.000Z',
      },
    })
  );
  expect(resolveResp.response.ok()).toBe(true);
  expect(Number(resolveResp.body?.data?.summary?.openFlagCount || 0)).toBe(1);
  expect(Number(resolveResp.body?.data?.summary?.resolvedFlagCount || 0)).toBe(1);

  resolveResp = await requestJson(
    request.post(`/api/poker/play/admin/integrity/${encodeURIComponent(disputeFlagId)}/resolve`, {
      headers: {
        ...ADMIN_HEADERS,
        'content-type': 'application/json',
      },
      data: {
        status: 'dismissed',
        resolutionNote: 'Operator dismissed the review-cluster signal after inspection.',
        asOf: '2026-03-11T16:00:06.000Z',
      },
    })
  );
  expect(resolveResp.response.ok()).toBe(true);
  expect(Number(resolveResp.body?.data?.summary?.openFlagCount || 0)).toBe(0);
  expect(Number(resolveResp.body?.data?.summary?.resolvedFlagCount || 0)).toBe(1);
  expect(Number(resolveResp.body?.data?.summary?.dismissedFlagCount || 0)).toBe(1);

  const allQueueResp = await requestJson(
    request.get('/api/poker/play/admin/integrity?status=all&asOf=2026-03-11T16%3A00%3A06.000Z', {
      headers: ADMIN_HEADERS,
    })
  );
  expect(allQueueResp.response.ok()).toBe(true);
  expect(Number(allQueueResp.body?.data?.summary?.openFlagCount || 0)).toBe(0);
  expect(Number(allQueueResp.body?.data?.summary?.resolvedFlagCount || 0)).toBe(1);
  expect(Number(allQueueResp.body?.data?.summary?.dismissedFlagCount || 0)).toBe(1);

  const afterTableResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-11T16%3A00%3A06.000Z`);
  expect(afterTableResp.ok).toBe(true);
  expect(Number(afterTableResp.body?.data?.review?.integrity?.openFlagCount || 0)).toBe(0);

  await context.close();
});

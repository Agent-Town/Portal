const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M23.29: admin can export one split tournament series review across all member tables', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSeriesExportA11111111111111111111111', houseId: 'house_series_export_a', streamId: 'stream-series-export-a' },
    { address: 'So1anaMockSeriesExportB11111111111111111111111', houseId: 'house_series_export_b', streamId: 'stream-series-export-b' },
    { address: 'So1anaMockSeriesExportC11111111111111111111111', houseId: 'house_series_export_c', streamId: 'stream-series-export-c' },
    { address: 'So1anaMockSeriesExportD11111111111111111111111', houseId: 'house_series_export_d', streamId: 'stream-series-export-d' },
  ];

  await seedStreamflowLocks(request, {
    locks: users.map((user) => ({
      address: user.address,
      streamId: user.streamId,
      tokenSymbol: '$AGENTTOWN',
      locked: true,
      lockedAmountAtomic: '2500000',
    })),
  });

  const contexts = [];
  const pages = [];
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    await verifyStreamflowAndFundOil(page, request, {
      address: user.address,
      streamId: user.streamId,
    });
  }

  let resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Export Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdA = String(resp.body?.data?.table?.tableId || '');
  const seriesId = String(resp.body?.data?.series?.seriesId || resp.body?.data?.table?.rules?.seriesId || '');
  expect(tableIdA).toBeTruthy();
  expect(seriesId).toBeTruthy();

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Export Bravo',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[2], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Export Charlie',
    },
  });
  expect(resp.ok).toBe(true);

  const detailResp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableIdA)}?asOf=2026-03-10T12%3A00%3A03.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(detailResp.ok).toBe(true);
  const actingSeat = Number(detailResp.body?.data?.hand?.actingSeat || 0);
  const actorPage = actingSeat === 1 ? pages[0] : pages[1];
  const actorAddress = actingSeat === 1 ? users[0].address : users[1].address;
  resp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(detailResp.body?.data?.hand?.handId || '')}/actions`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': actorAddress },
    data: {
      actionKind: 'fold',
      amountOil: 0,
      asOf: '2026-03-10T12:00:03.000Z',
    },
  });
  expect(resp.ok).toBe(true);

  resp = await browserJson(pages[3], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[3].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 75,
      bigBlindOil: 150,
      buyInOil: 600,
      lateRegistrationHands: 1,
      displayName: 'Series Export Delta',
      asOf: '2026-03-10T12:00:04.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const tableIdB = String(resp.body?.data?.table?.tableId || '');
  expect(tableIdB).toBeTruthy();
  expect(tableIdB).not.toBe(tableIdA);

  const refreshedDetailResp = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableIdA)}?asOf=2026-03-10T12%3A00%3A04.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(refreshedDetailResp.ok).toBe(true);
  const reviewHandId = String(refreshedDetailResp.body?.data?.hand?.handId || '');
  expect(reviewHandId).toBeTruthy();

  const disputeResp = await browserJson(pages[0], `/api/poker/play/hands/${encodeURIComponent(reviewHandId)}/disputes`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      category: 'turn_order',
      note: 'Series export review should include this dispute.',
      asOf: '2026-03-10T12:00:04.500Z',
    },
  });
  expect(disputeResp.ok).toBe(true);

  const exportResp = await request.get(`/api/poker/play/admin/series/${encodeURIComponent(seriesId)}/export?asOf=2026-03-10T12%3A00%3A05.000Z`, {
    headers: ADMIN_HEADERS,
  });
  expect(exportResp.ok()).toBe(true);
  const exportBody = await exportResp.json();
  expect(exportBody?.data?.exportVersion).toBe('poker-play-admin-series-export-v1');
  expect(exportBody?.data?.seriesId).toBe(seriesId);
  expect(Number(exportBody?.data?.summary?.tableCount || 0)).toBe(2);
  expect(Number(exportBody?.data?.summary?.openDisputeCount || 0)).toBe(1);
  expect(Number(exportBody?.data?.summary?.reviewDisputeCount || 0)).toBeGreaterThanOrEqual(1);
  expect(Number(exportBody?.data?.summary?.auditEventCount || 0)).toBeGreaterThan(0);
  expect(exportBody?.data?.review?.reviewVersion).toBe('poker-play-admin-series-review-v1');
  expect(exportBody?.data?.review?.series?.seriesId).toBe(seriesId);
  expect(Array.isArray(exportBody?.data?.review?.tables)).toBe(true);
  expect(exportBody.data.review.tables).toHaveLength(2);
  const exportedTableIds = exportBody.data.review.tables.map((item) => String(item?.tableId || ''));
  expect(exportedTableIds).toEqual(expect.arrayContaining([tableIdA, tableIdB]));
  const disputedTable = exportBody.data.review.tables.find((item) => String(item?.tableId || '') === tableIdA);
  expect(disputedTable).toBeTruthy();
  expect(Array.isArray(disputedTable?.review?.openDisputes)).toBe(true);
  expect(disputedTable.review.openDisputes.some((dispute) => String(dispute?.note || '').includes('Series export review should include this dispute.'))).toBe(true);

  await Promise.all(contexts.map((context) => context.close()));
});

const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { seedPokerPlayHarness } = require('./helpers/poker_play');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.15: ledger reconciliation reports zero clean mismatches and exact corrupted row categories', async ({ request }) => {
  const cleanSeed = await seedPokerPlayHarness(request, {
    scenario: 'ledger_reconciliation_story',
    asOf: '2026-03-11T17:00:00.000Z',
    tableId: 'pkt_play_phase22_reconcile_clean',
  });
  const cleanResp = await request.get('/api/poker/play/admin/reconciliation?asOf=2026-03-11T17%3A00%3A00.000Z', {
    headers: ADMIN_HEADERS,
  });
  expect(cleanResp.ok()).toBe(true);
  const cleanBody = await cleanResp.json();
  expect(Number(cleanBody?.data?.summary?.mismatchCount || 0)).toBe(0);
  expect(Number(cleanBody?.data?.summary?.walletCount || 0)).toBe(2);
  expect(Array.isArray(cleanBody?.data?.items)).toBe(true);
  expect(cleanBody.data.items).toHaveLength(0);
  for (const actor of cleanSeed?.actors || []) {
    const walletRow = (cleanBody?.data?.wallets || []).find((item) => String(item?.walletSubject || '') === String(actor.address || ''));
    expect(walletRow).toBeTruthy();
    expect(Number(walletRow?.balanceDelta || 0)).toBe(Number(cleanSeed?.debug?.reconciliation?.expectedWalletBalanceDeltaByWallet?.[actor.address] || 0));
  }

  await resetPortalWebState(request);
  const corruptedSeed = await seedPokerPlayHarness(request, {
    scenario: 'ledger_reconciliation_corrupt_story',
    asOf: '2026-03-11T17:30:00.000Z',
    tableId: 'pkt_play_phase22_reconcile_corrupt',
  });
  const corruptedResp = await request.get('/api/poker/play/admin/reconciliation?asOf=2026-03-11T17%3A30%3A00.000Z', {
    headers: ADMIN_HEADERS,
  });
  expect(corruptedResp.ok()).toBe(true);
  const corruptedBody = await corruptedResp.json();
  const data = corruptedBody?.data || {};
  expect(Number(data?.summary?.mismatchCount || 0)).toBe(Number(corruptedSeed?.debug?.reconciliation?.expectedMismatchCount || 0));
  expect(Array.isArray(data?.items)).toBe(true);
  expect(data.items).toHaveLength(3);

  const categories = data.items.map((item) => String(item?.category || '')).sort();
  expect(categories).toEqual([
    'reload_amount_mismatch',
    'unexpected_prize_entry',
    'unexpected_refund_entry',
  ]);

  for (const item of data.items) {
    expect(String(item?.walletSubject || '')).toBeTruthy();
    expect(String(item?.ledgerEntryId || '')).toBeTruthy();
    expect(String(item?.category || '')).toBeTruthy();
    expect(Boolean(item?.tableId || item?.seriesId)).toBe(true);
  }

  for (const actor of corruptedSeed?.actors || []) {
    const walletRow = (data?.wallets || []).find((item) => String(item?.walletSubject || '') === String(actor.address || ''));
    expect(walletRow).toBeTruthy();
    expect(Number(walletRow?.balanceDelta || 0)).toBe(Number(corruptedSeed?.debug?.reconciliation?.expectedWalletBalanceDeltaByWallet?.[actor.address] || 0));
  }
});

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

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.9: late-stage tournament chop requires unanimity, operator approval, and exact settlement totals', async ({ browser, request }) => {
  const users = [
    { seatNumber: 1, address: 'So1anaMockChopA111111111111111111111111111', houseId: 'house_chop_a', streamId: 'stream-chop-a', displayName: 'Deal Alpha' },
    { seatNumber: 2, address: 'So1anaMockChopB111111111111111111111111111', houseId: 'house_chop_b', streamId: 'stream-chop-b', displayName: 'Deal Bravo' },
    { seatNumber: 3, address: 'So1anaMockChopC111111111111111111111111111', houseId: 'house_chop_c', streamId: 'stream-chop-c', displayName: 'Deal Charlie' },
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
  const funded = [];
  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();
    contexts.push(context);
    pages.push(page);
    await page.goto('/');
    await bindPageSession(page, user);
    funded.push(await verifyStreamflowAndFundOil(page, request, {
      address: user.address,
      streamId: user.streamId,
      asOfVerify: '2026-03-12T22:00:00.000Z',
      asOfProcess: '2026-03-12T22:59:59.000Z',
    }));
  }

  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'chop_deal_story',
    asOf: '2026-03-12T22:00:00.000Z',
    actors: users,
  });
  const tableId = String(seeded?.tableIds?.[0] || '');
  const seriesId = String(seeded?.seriesId || '');
  expect(tableId).toBeTruthy();
  expect(seriesId).toBeTruthy();

  const openingView = await browserJson(pages[0], `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-12T22%3A00%3A01.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(openingView.ok).toBe(true);
  expect(openingView.body?.data?.table?.status).toBe('paused');
  expect(openingView.body?.data?.chopProposal).toBeNull();
  expect(Number(openingView.body?.data?.series?.prizePoolOil || 0)).toBe(1800);
  expect(openingView.body?.data?.series?.payoutModel).toBe('top2_70_30');

  const proposedPayouts = [
    { seatNumber: 1, amountOil: 900 },
    { seatNumber: 2, amountOil: 500 },
    { seatNumber: 3, amountOil: 400 },
  ];

  let resp = await browserJson(pages[0], `/api/poker/play/series/${encodeURIComponent(seriesId)}/chop-proposals`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      payouts: proposedPayouts,
      note: 'Lock a deterministic final-table deal.',
      asOf: '2026-03-12T22:00:10.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.proposal?.status).toBe('open');
  expect(Number(resp.body?.data?.proposal?.agreementCount || 0)).toBe(1);
  expect(resp.body?.data?.proposal?.allAgreed).toBe(false);
  expect(Number(resp.body?.data?.proposal?.settlement?.payablePoolOil || 0)).toBe(1800);
  const proposalId = String(resp.body?.data?.proposal?.proposalId || '');
  expect(proposalId).toBeTruthy();

  const prematureApproval = await request.post(`/api/poker/play/admin/chop-proposals/${encodeURIComponent(proposalId)}/review`, {
    headers: ADMIN_HEADERS,
    data: {
      status: 'approved',
      approvedBy: 'test-admin',
      asOf: '2026-03-12T22:00:10.500Z',
    },
  });
  expect(prematureApproval.ok()).toBe(false);
  const prematureBody = await prematureApproval.json();
  expect(prematureBody?.error?.code).toBe('POKER_PLAY_CHOP_AGREEMENTS_INCOMPLETE');

  resp = await browserJson(pages[1], `/api/poker/play/chop-proposals/${encodeURIComponent(proposalId)}/agree`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      asOf: '2026-03-12T22:00:11.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.proposal?.status).toBe('open');
  expect(Number(resp.body?.data?.proposal?.agreementCount || 0)).toBe(2);

  resp = await browserJson(pages[2], `/api/poker/play/chop-proposals/${encodeURIComponent(proposalId)}/agree`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[2].address },
    data: {
      asOf: '2026-03-12T22:00:12.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.proposal?.status).toBe('pending_approval');
  expect(Number(resp.body?.data?.proposal?.agreementCount || 0)).toBe(3);
  expect(resp.body?.data?.proposal?.allAgreed).toBe(true);

  const approvalResp = await request.post(`/api/poker/play/admin/chop-proposals/${encodeURIComponent(proposalId)}/review`, {
    headers: ADMIN_HEADERS,
    data: {
      status: 'approved',
      approvedBy: 'test-admin',
      asOf: '2026-03-12T22:00:13.000Z',
    },
  });
  expect(approvalResp.ok()).toBe(true);
  const approvalBody = await approvalResp.json();
  expect(approvalBody?.data?.proposal?.status).toBe('settled');
  expect(approvalBody?.data?.review?.series?.seriesId).toBe(seriesId);
  expect(Number(approvalBody?.data?.review?.summary?.chopProposalCount || 0)).toBe(1);
  expect(Array.isArray(approvalBody?.data?.review?.chopProposals)).toBe(true);
  expect(approvalBody.data.review.chopProposals[0]?.proposalId).toBe(proposalId);

  const expectedPrizeBySeat = new Map(proposedPayouts.map((item) => [item.seatNumber, item.amountOil]));
  const settledPrizeTotals = [];
  for (let index = 0; index < users.length; index += 1) {
    const detail = await browserJson(pages[index], `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=2026-03-12T22%3A00%3A14.000Z`, {
      headers: { 'x-wallet-solana-address': users[index].address },
    });
    expect(detail.ok).toBe(true);
    expect(detail.body?.data?.table?.summary?.completedAt).toBeTruthy();
    expect(detail.body?.data?.series?.payoutModel).toBe('deal_custom');
    expect(detail.body?.data?.chopProposal?.status).toBe('settled');
    expect(Number(detail.body?.data?.mySeat?.prizeOil || 0)).toBe(Number(expectedPrizeBySeat.get(users[index].seatNumber) || 0));
    settledPrizeTotals.push(Number(detail.body?.data?.mySeat?.prizeOil || 0));
    expect(Number(detail.body?.data?.oilBalance?.balance || 0)).toBe(
      Number(funded[index]?.oilBalance?.balance || 0) + Number(expectedPrizeBySeat.get(users[index].seatNumber) || 0)
    );
  }
  expect(settledPrizeTotals.reduce((sum, amount) => sum + amount, 0)).toBe(1800);

  const timelineResp = await browserJson(pages[0], `/api/poker/play/series/${encodeURIComponent(seriesId)}/timeline?asOf=2026-03-12T22%3A00%3A15.000Z`, {
    headers: { 'x-wallet-solana-address': users[0].address },
  });
  expect(timelineResp.ok).toBe(true);
  const eventKinds = (Array.isArray(timelineResp.body?.data?.items) ? timelineResp.body.data.items : []).map((item) => String(item?.eventKind || ''));
  expect(eventKinds).toEqual(expect.arrayContaining([
    'chop_proposed',
    'chop_agreed',
    'chop_approved',
    'chop_settled',
  ]));

  await Promise.all(contexts.map((context) => context.close()));
});

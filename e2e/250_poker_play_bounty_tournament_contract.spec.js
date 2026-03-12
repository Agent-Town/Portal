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

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

async function getTable(page, address, tableId, { asOf } = {}) {
  const path = asOf
    ? `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(asOf)}`
    : `/api/poker/play/tables/${encodeURIComponent(tableId)}`;
  const resp = await browserJson(page, path, {
    headers: { 'x-wallet-solana-address': address },
  });
  expect(resp.ok).toBe(true);
  return resp.body?.data || {};
}

async function playAggressiveTournamentHand(tableId, seatActors, { asOfPrefix }) {
  const observer = Object.values(seatActors)[0];
  let detail = await getTable(observer.page, observer.address, tableId, {
    asOf: `${asOfPrefix}:00.000Z`,
  });
  const startingHandNumber = Number(detail?.hand?.handNumber || 0);
  expect(startingHandNumber).toBeGreaterThan(0);
  for (let tick = 1; tick <= 24; tick += 1) {
    const actingSeat = Number(detail?.hand?.actingSeat || 0);
    const actor = seatActors[actingSeat];
    expect(actor).toBeTruthy();
    const atIso = `${asOfPrefix}:${String(tick).padStart(2, '0')}.000Z`;
    const actorDetail = await getTable(actor.page, actor.address, tableId, { asOf: atIso });
    const handId = String(actorDetail?.hand?.handId || '');
    expect(handId).toBeTruthy();
    const allowed = Array.isArray(actorDetail?.hand?.viewerAllowedActions) ? actorDetail.hand.viewerAllowedActions : [];
    let actionKind = 'fold';
    let amountOil = 0;
    if (allowed.includes('raise')) {
      actionKind = 'raise';
      amountOil = Number(actorDetail?.mySeat?.stackOil || actorDetail?.hand?.minRaiseToOil || actorDetail?.table?.buyInOil || 0);
    } else if (allowed.includes('bet')) {
      actionKind = 'bet';
      amountOil = Number(actorDetail?.mySeat?.stackOil || actorDetail?.hand?.minRaiseToOil || actorDetail?.table?.buyInOil || 0);
    } else if (allowed.includes('call')) {
      actionKind = 'call';
    } else if (allowed.includes('check')) {
      actionKind = 'check';
    } else if (allowed.length) {
      actionKind = String(allowed[0] || 'check');
      amountOil = Number(actorDetail?.hand?.minRaiseToOil || 0);
    }
    let resp = await browserJson(actor.page, `/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
      method: 'POST',
      headers: { 'x-wallet-solana-address': actor.address },
      data: {
        actionKind,
        amountOil,
        asOf: atIso,
      },
    });
    if (!resp.ok && actionKind === 'raise') {
      const requiredOil = Number(resp.body?.error?.details?.requiredOil || 0);
      if (resp.status === 409 && requiredOil > amountOil) {
        resp = await browserJson(actor.page, `/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
          method: 'POST',
          headers: { 'x-wallet-solana-address': actor.address },
          data: {
            actionKind,
            amountOil: requiredOil,
            asOf: atIso,
          },
        });
      }
    }
    if (!resp.ok) {
      throw new Error(`POKER_ACTION_FAILED:${resp.status}:${actionKind}:${amountOil}:${JSON.stringify(allowed)}:${JSON.stringify(resp.body)}`);
    }
    detail = await getTable(observer.page, observer.address, tableId, { asOf: atIso });
    if (detail?.table?.summary?.completedAt) return detail;
    if (Number(detail?.hand?.handNumber || 0) > startingHandNumber) return detail;
  }
  throw new Error('TOURNAMENT_HAND_DID_NOT_ADVANCE');
}

test('M23.28: PKO tournaments split buy-ins into prize and bounty accounting and settle knockout rewards deterministically', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockBountyA11111111111111111111111111', houseId: 'house_bounty_a', streamId: 'stream-bounty-a' },
    { address: 'So1anaMockBountyB11111111111111111111111111', houseId: 'house_bounty_b', streamId: 'stream-bounty-b' },
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
    }));
  }

  let resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 50,
      bigBlindOil: 100,
      buyInOil: 1000,
      maxSeats: 2,
      lateRegistrationHands: 0,
      bountyModel: 'pko_50',
      displayName: 'Bounty Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const tableId = String(resp.body?.data?.table?.tableId || '');
  expect(tableId).toBeTruthy();

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'tournament',
      smallBlindOil: 50,
      bigBlindOil: 100,
      buyInOil: 1000,
      maxSeats: 2,
      lateRegistrationHands: 0,
      bountyModel: 'pko_50',
      displayName: 'Bounty Bravo',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableId);

  const openingView = await getTable(pages[0], users[0].address, tableId, {
    asOf: '2026-03-12T13:00:00.000Z',
  });
  expect(openingView?.series?.bountyModel).toBe('pko_50');
  expect(Number(openingView?.series?.prizePoolOil || 0)).toBe(1000);
  expect(Number(openingView?.series?.bountyPoolOil || 0)).toBe(1000);
  expect(Number(openingView?.mySeat?.currentBountyOil || 0)).toBe(500);
  expect(openingView?.series?.payouts).toEqual([
    { place: 1, percent: 100, amountOil: 1000 },
  ]);

  let finalHandDetail = null;
  for (const asOfPrefix of ['2026-03-12T13:10', '2026-03-12T13:11', '2026-03-12T13:12', '2026-03-12T13:13']) {
    finalHandDetail = await playAggressiveTournamentHand(tableId, {
      1: { page: pages[0], address: users[0].address },
      2: { page: pages[1], address: users[1].address },
    }, { asOfPrefix });
    if (finalHandDetail?.table?.summary?.completedAt) break;
  }
  expect(finalHandDetail?.table?.summary?.completedAt).toBeTruthy();

  const settledViews = [];
  for (let index = 0; index < users.length; index += 1) {
    settledViews.push(await getTable(pages[index], users[index].address, tableId, {
      asOf: '2026-03-12T13:15:30.000Z',
    }));
  }

  const firstView = settledViews[0];
  expect(firstView?.series?.bountyModel).toBe('pko_50');
  expect(Number(firstView?.series?.prizePoolOil || 0)).toBe(1000);
  expect(Number(firstView?.series?.bountyPoolOil || 0)).toBe(1000);
  expect(Number(firstView?.series?.totalBountyAwardedOil || 0)).toBe(1000);
  expect(firstView?.series?.payoutModel).toBe('winner_take_all');
  expect(firstView?.series?.payouts).toEqual([
    { place: 1, percent: 100, amountOil: 1000 },
  ]);
  expect(Array.isArray(firstView?.series?.standings)).toBe(true);
  expect(firstView.series.standings).toHaveLength(2);
  expect(Number(firstView.series.standings[0]?.bountyWonOil || 0)).toBe(1000);
  expect(Number(firstView.series.standings[0]?.totalWonOil || 0)).toBe(2000);

  const placements = settledViews
    .map((view) => ({
      finish: Number(view?.mySeat?.finishPosition || 0),
      prizeOil: Number(view?.mySeat?.prizeOil || 0),
      bountyWonOil: Number(view?.mySeat?.bountyWonOil || 0),
      currentBountyOil: Number(view?.mySeat?.currentBountyOil || 0),
      balance: Number(view?.oilBalance?.balance || 0),
    }))
    .sort((left, right) => left.finish - right.finish);
  expect(placements.map((item) => item.finish)).toEqual([1, 2]);
  expect(placements.map((item) => item.prizeOil)).toEqual([1000, 0]);
  expect(placements.map((item) => item.bountyWonOil)).toEqual([1000, 0]);
  expect(placements.map((item) => item.currentBountyOil)).toEqual([0, 0]);

  const fundedBalances = funded.map((entry) => Number(entry?.oilBalance?.balance || 0)).sort((a, b) => a - b);
  expect(placements.map((item) => item.balance).sort((a, b) => a - b)).toEqual([
    fundedBalances[0] - 1000,
    fundedBalances[1] + 1000,
  ]);

  await Promise.all(contexts.map((context) => context.close()));
});

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
    let actingSeat = Number(detail?.hand?.actingSeat || 0);
    if (!actingSeat) {
      if (detail?.table?.summary?.completedAt) return detail;
      const recoveryIso = `${asOfPrefix}:${String(tick).padStart(2, '0')}.500Z`;
      detail = await getTable(observer.page, observer.address, tableId, { asOf: recoveryIso });
      if (detail?.table?.summary?.completedAt) return detail;
      if (Number(detail?.hand?.handNumber || 0) > startingHandNumber) return detail;
      actingSeat = Number(detail?.hand?.actingSeat || 0);
    }
    const actor = seatActors[actingSeat];
    if (!actor) {
      const settleIso = `${asOfPrefix}:${String(tick).padStart(2, '0')}.900Z`;
      detail = await getTable(observer.page, observer.address, tableId, { asOf: settleIso });
      if (detail?.table?.summary?.completedAt) return detail;
      if (Number(detail?.hand?.handNumber || 0) > startingHandNumber) return detail;
      continue;
    }
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
  throw new Error('BOUNTY_HAND_DID_NOT_ADVANCE');
}

function addSecondsToIso(iso, seconds) {
  const baseMs = Date.parse(String(iso || ''));
  const safeMs = Number.isFinite(baseMs) ? baseMs : Date.parse('2026-03-12T21:05:00.000Z');
  return new Date(safeMs + (Number(seconds || 0) * 1000)).toISOString();
}

for (const scenario of [
  {
    bountyModel: 'pko_75',
    walletPrefix: 'Pk75',
    expectedPrizePoolOil: 500,
    expectedBountyPoolOil: 1500,
    expectedWinnerPrizeOil: 500,
    expectedWinnerBountyOil: 1500,
  },
  {
    bountyModel: 'full_bounty',
    walletPrefix: 'Fbnty',
    expectedPrizePoolOil: 0,
    expectedBountyPoolOil: 2000,
    expectedWinnerPrizeOil: 0,
    expectedWinnerBountyOil: 2000,
  },
]) {
  test(`M25.9: ${scenario.bountyModel} settles deterministic knockout and final bounty totals`, async ({ browser, request }) => {
    const users = [
      { address: `So1anaMock${scenario.walletPrefix}A111111111111111111111`, houseId: `house_${scenario.bountyModel}_a`, streamId: `stream-${scenario.bountyModel}-a`, displayName: `${scenario.bountyModel} Alpha` },
      { address: `So1anaMock${scenario.walletPrefix}B111111111111111111111`, houseId: `house_${scenario.bountyModel}_b`, streamId: `stream-${scenario.bountyModel}-b`, displayName: `${scenario.bountyModel} Bravo` },
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
        smallBlindOil: 50,
        bigBlindOil: 100,
        buyInOil: 1000,
        maxSeats: 2,
        lateRegistrationHands: 0,
        bountyModel: scenario.bountyModel,
        displayName: users[0].displayName,
        asOf: '2026-03-12T21:00:00.000Z',
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
        bountyModel: scenario.bountyModel,
        displayName: users[1].displayName,
        asOf: '2026-03-12T21:00:01.000Z',
      },
    });
    expect(resp.ok).toBe(true);
    expect(String(resp.body?.data?.table?.tableId || '')).toBe(tableId);

    const openingView = await getTable(pages[0], users[0].address, tableId, {
      asOf: '2026-03-12T21:00:02.000Z',
    });
    expect(openingView?.series?.bountyModel).toBe(scenario.bountyModel);
    expect(Number(openingView?.series?.prizePoolOil || 0)).toBe(scenario.expectedPrizePoolOil);
    expect(Number(openingView?.series?.bountyPoolOil || 0)).toBe(scenario.expectedBountyPoolOil);

    let finalDetail = null;
    for (const asOfPrefix of [
      '2026-03-12T21:01',
      '2026-03-12T21:02',
      '2026-03-12T21:03',
      '2026-03-12T21:04',
      '2026-03-12T21:05',
      '2026-03-12T21:06',
      '2026-03-12T21:07',
      '2026-03-12T21:08',
    ]) {
      finalDetail = await playAggressiveTournamentHand(tableId, {
        1: { page: pages[0], address: users[0].address },
        2: { page: pages[1], address: users[1].address },
      }, { asOfPrefix });
      if (finalDetail?.table?.summary?.completedAt) break;
    }
    expect(finalDetail?.table?.summary?.completedAt).toBeTruthy();
    const settledAsOf = addSecondsToIso(finalDetail?.table?.summary?.completedAt, 1);

    const settledViews = [];
    for (let index = 0; index < users.length; index += 1) {
      settledViews.push(await getTable(pages[index], users[index].address, tableId, {
        asOf: settledAsOf,
      }));
    }
    const placements = settledViews
      .map((view) => ({
        finish: Number(view?.mySeat?.finishPosition || 0),
        prizeOil: Number(view?.mySeat?.prizeOil || 0),
        bountyWonOil: Number(view?.mySeat?.bountyWonOil || 0),
      }))
      .sort((left, right) => left.finish - right.finish);
    expect(placements.map((item) => item.finish)).toEqual([1, 2]);
    expect(placements[0].prizeOil).toBe(scenario.expectedWinnerPrizeOil);
    expect(placements[0].bountyWonOil).toBe(scenario.expectedWinnerBountyOil);
    expect(placements[1].prizeOil).toBe(0);
    expect(placements[1].bountyWonOil).toBe(0);

    const winnerView = settledViews.find((view) => Number(view?.mySeat?.finishPosition || 0) === 1);
    expect(Number(winnerView?.series?.totalBountyAwardedOil || 0)).toBe(scenario.expectedBountyPoolOil);
    expect(Number(winnerView?.series?.prizePoolOil || 0)).toBe(scenario.expectedPrizePoolOil);

    await Promise.all(contexts.map((context) => context.close()));
  });
}

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
  throw new Error('SATELLITE_HAND_DID_NOT_ADVANCE');
}

test('M25.9: satellite tournaments award downstream qualification and register the winner without a second OIL debit', async ({ browser, request }) => {
  const users = [
    { address: 'So1anaMockSatA1111111111111111111111111111', houseId: 'house_sat_a', streamId: 'stream-sat-a', displayName: 'Satellite Alpha' },
    { address: 'So1anaMockSatB1111111111111111111111111111', houseId: 'house_sat_b', streamId: 'stream-sat-b', displayName: 'Satellite Bravo' },
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

  let resp = await browserJson(pages[0], '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      title: 'Target Satellite Major',
      joinNow: false,
      smallBlindOil: 100,
      bigBlindOil: 200,
      buyInOil: 600,
      maxSeats: 6,
      minPlayers: 2,
      lateRegistrationHands: 2,
      scheduledStartAt: '2026-03-12T19:00:00.000Z',
      displayName: 'Target Owner',
      asOf: '2026-03-12T18:00:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const targetTableId = String(resp.body?.data?.table?.tableId || '');
  const targetSeriesId = String(resp.body?.data?.table?.summary?.seriesId || resp.body?.data?.series?.seriesId || '');
  expect(targetTableId).toBeTruthy();
  expect(targetSeriesId).toBeTruthy();

  resp = await browserJson(pages[0], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[0].address },
    data: {
      tableType: 'tournament',
      title: 'Qualifier Sprint',
      smallBlindOil: 25,
      bigBlindOil: 50,
      buyInOil: 300,
      maxSeats: 2,
      lateRegistrationHands: 0,
      formatVariant: 'satellite',
      satelliteTargetSeriesId: targetSeriesId,
      satelliteTargetSeriesTitle: 'Target Satellite Major',
      satelliteAwardKind: 'ticket',
      satelliteAwardCount: 1,
      satelliteAwardValueOil: 600,
      displayName: users[0].displayName,
      asOf: '2026-03-12T18:01:00.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  const satelliteTableId = String(resp.body?.data?.table?.tableId || '');
  expect(satelliteTableId).toBeTruthy();

  resp = await browserJson(pages[1], '/api/poker/play/matchmake', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': users[1].address },
    data: {
      tableType: 'tournament',
      title: 'Qualifier Sprint',
      smallBlindOil: 25,
      bigBlindOil: 50,
      buyInOil: 300,
      maxSeats: 2,
      lateRegistrationHands: 0,
      formatVariant: 'satellite',
      satelliteTargetSeriesId: targetSeriesId,
      satelliteTargetSeriesTitle: 'Target Satellite Major',
      satelliteAwardKind: 'ticket',
      satelliteAwardCount: 1,
      satelliteAwardValueOil: 600,
      displayName: users[1].displayName,
      asOf: '2026-03-12T18:01:01.000Z',
    },
  });
  expect(resp.ok).toBe(true);
  expect(String(resp.body?.data?.table?.tableId || '')).toBe(satelliteTableId);

  const openingView = await getTable(pages[0], users[0].address, satelliteTableId, {
    asOf: '2026-03-12T18:01:02.000Z',
  });
  expect(openingView?.series?.formatVariant).toBe('satellite');
  expect(openingView?.series?.payoutModel).toBe('satellite_ticket');
  expect(openingView?.series?.satelliteTargetSeriesId).toBe(targetSeriesId);
  expect(Number(openingView?.series?.satelliteAwardCount || 0)).toBe(1);

  let finalDetail = null;
  for (const asOfPrefix of [
    '2026-03-12T18:02',
    '2026-03-12T18:03',
    '2026-03-12T18:04',
    '2026-03-12T18:05',
    '2026-03-12T18:06',
    '2026-03-12T18:07',
    '2026-03-12T18:08',
    '2026-03-12T18:09',
  ]) {
    finalDetail = await playAggressiveTournamentHand(satelliteTableId, {
      1: { page: pages[0], address: users[0].address },
      2: { page: pages[1], address: users[1].address },
    }, { asOfPrefix });
    if (finalDetail?.table?.summary?.completedAt) break;
  }
  expect(finalDetail?.table?.summary?.completedAt).toBeTruthy();

  const settledViews = [];
  const qualifierReads = [];
  for (let index = 0; index < users.length; index += 1) {
    settledViews.push(await getTable(pages[index], users[index].address, satelliteTableId, {
      asOf: '2026-03-12T18:05:00.000Z',
    }));
    qualifierReads.push(await browserJson(pages[index], '/api/poker/play/qualifiers/me?asOf=2026-03-12T18:05:01.000Z', {
      headers: { 'x-wallet-solana-address': users[index].address },
    }));
    expect(qualifierReads[index].ok).toBe(true);
  }
  const winnerIndex = qualifierReads.findIndex((resp) => Number(resp.body?.data?.summary?.awardCount || 0) === 1);
  const loserIndex = qualifierReads.findIndex((resp) => Number(resp.body?.data?.summary?.awardCount || 0) === 0);
  expect(winnerIndex).toBeGreaterThanOrEqual(0);
  expect(loserIndex).toBeGreaterThanOrEqual(0);

  const winnerQualifiers = qualifierReads[winnerIndex];
  expect(Number(winnerQualifiers.body?.data?.summary?.awardCount || 0)).toBe(1);
  expect(winnerQualifiers.body?.data?.items?.[0]?.targetSeriesId).toBe(targetSeriesId);
  expect(winnerQualifiers.body?.data?.items?.[0]?.registrationState).toBe('registered');
  expect(String(winnerQualifiers.body?.data?.items?.[0]?.targetTableId || '')).toBe(targetTableId);

  const loserQualifiers = qualifierReads[loserIndex];
  expect(Number(loserQualifiers.body?.data?.summary?.awardCount || 0)).toBe(0);

  const targetView = await getTable(pages[winnerIndex], users[winnerIndex].address, targetTableId, {
    asOf: '2026-03-12T18:05:02.000Z',
  });
  expect(targetView?.table?.summary?.scheduledStartPending).toBe(true);
  expect(targetView?.series?.seriesId).toBe(targetSeriesId);
  expect(Number(targetView?.mySeat?.buyInOil || 0)).toBe(2000);

  const winnerFundedBalance = Number(funded[winnerIndex]?.oilBalance?.balance || 0);
  const loserFundedBalance = Number(funded[loserIndex]?.oilBalance?.balance || 0);
  expect(Number(settledViews[winnerIndex]?.oilBalance?.balance || 0)).toBe(winnerFundedBalance - 500);
  expect(Number(settledViews[loserIndex]?.oilBalance?.balance || 0)).toBe(loserFundedBalance - 500);

  await Promise.all(contexts.map((context) => context.close()));
});

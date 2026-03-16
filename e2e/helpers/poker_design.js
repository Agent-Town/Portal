const {
  fundOilWallet,
  seedStreamflowLocks,
} = require('./portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
  verifyStreamflowAndFundOil,
} = require('./poker_play');

async function openDesignLiveTable(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  adminToken = true,
  uiLocale = '',
  uiCopy = '',
} = {}) {
  const userA = {
    address: 'So1anaMockDesignLiveA1111111111111111111111111',
    houseId: 'house_design_live_a',
    streamId: 'stream-design-live-a',
  };
  const userB = {
    address: 'So1anaMockDesignLiveB1111111111111111111111111',
    houseId: 'house_design_live_b',
    streamId: 'stream-design-live-b',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: userA.address,
        streamId: userA.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: userB.address,
        streamId: userB.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextOptions = {
    viewport,
    ...(baseURL ? { baseURL } : {}),
  };
  const contextA = await browser.newContext(contextOptions);
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  await bindPageSession(pageA, userA);
  await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext(contextOptions);
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  let resp = await browserJson(pageA, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      seatNumber: 1,
      displayName: 'Design Live Alpha',
      buyInOil: 400,
    },
  });
  if (!resp.ok) {
    throw new Error(`POKER_DESIGN_SEAT_A_FAILED:${resp.status}`);
  }

  resp = await browserJson(pageB, '/api/poker/play/tables/pkt_play_cash_01/sit', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Design Live Bravo',
      buyInOil: 400,
    },
  });
  if (!resp.ok) {
    throw new Error(`POKER_DESIGN_SEAT_B_FAILED:${resp.status}`);
  }

  if (adminToken) {
    await pageA.evaluate(() => window.localStorage.setItem('poker.adminToken', 'test-admin'));
  }
  const params = new URLSearchParams({ embed: '1' });
  if (uiLocale) params.set('uiLocale', uiLocale);
  if (uiCopy) params.set('uiCopy', uiCopy);
  await pageA.goto(`/poker/play/tables/pkt_play_cash_01?${params.toString()}`);
  return {
    contextA,
    contextB,
    page: pageA,
    observerPage: pageB,
    userA,
    userB,
  };
}

async function closeDesignLiveTable(resources) {
  if (resources?.contextA) await resources.contextA.close();
  if (resources?.contextB) await resources.contextB.close();
}

async function openDesignHandReview(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  asOf = '2026-03-11T14:00:00.000Z',
} = {}) {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf,
    tableId: 'pkt_play_design_review_story',
  });
  const actor = seeded?.actors?.[0] || null;
  const tableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  if (!actor?.address || !actor?.houseId || !tableId) {
    throw new Error('POKER_DESIGN_REVIEW_SEED_FAILED');
  }
  const context = await browser.newContext({
    viewport,
    ...(baseURL ? { baseURL } : {}),
  });
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });
  const historyResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history?status=completed&asOf=${encodeURIComponent(asOf)}`);
  const handId = String(historyResp.body?.data?.items?.[0]?.handId || '');
  if (!handId) {
    throw new Error('POKER_DESIGN_REVIEW_HAND_MISSING');
  }
  await page.goto(`/poker/play/hands/${encodeURIComponent(handId)}/review?embed=1&asOf=${encodeURIComponent(asOf)}`);
  return {
    context,
    page,
    handId,
    tableId,
  };
}

async function closeDesignPage(resources) {
  if (resources?.context) await resources.context.close();
}

async function openDesignNativeSeason(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  asOf = '2026-03-12T15:00:00.000Z',
  uiLocale = '',
  uiCopy = '',
} = {}) {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'economy_native_season_story',
    asOf,
    tableId: 'pkt_play_design_native_season_story',
  });
  const actor = seeded?.actors?.[0] || null;
  const seasonId = String(seeded?.debug?.nativeSeason?.seasonId || 'native-2026-03');
  const context = await browser.newContext({
    viewport,
    ...(baseURL ? { baseURL } : {}),
  });
  const page = await context.newPage();
  await page.goto('/');
  if (actor?.address && actor?.houseId) {
    await bindPageSession(page, {
      address: actor.address,
      houseId: actor.houseId,
    });
  }
  const params = new URLSearchParams({ embed: '1', asOf });
  if (uiLocale) params.set('uiLocale', uiLocale);
  if (uiCopy) params.set('uiCopy', uiCopy);
  await page.goto(`/poker/play/seasons/native/${encodeURIComponent(seasonId)}?${params.toString()}`);
  return {
    context,
    page,
    seasonId,
  };
}

async function openDesignRailSeries(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  asOf = '2026-03-12T20:30:00.000Z',
} = {}) {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_series_scheduled_break_ready',
    asOf,
    tableId: 'pkt_play_design_rail_series_story',
  });
  const seriesId = String(seeded?.seriesId || '');
  if (!seriesId) {
    throw new Error('POKER_DESIGN_RAIL_SERIES_MISSING');
  }
  const context = await browser.newContext({
    viewport,
    ...(baseURL ? { baseURL } : {}),
  });
  const page = await context.newPage();
  await page.goto(`/poker/play/rail/series/${encodeURIComponent(seriesId)}?embed=1&asOf=${encodeURIComponent(asOf)}`);
  return {
    context,
    page,
    seriesId,
  };
}

async function openDesignSchedule(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  asOf = '2026-03-12T08:00:00.000Z',
  adminToken = true,
  uiLocale = '',
  uiCopy = '',
} = {}) {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'schedule_calendar_story',
    asOf,
    tableId: 'pkt_play_design_schedule_story',
    actors: [
      {
        seatNumber: 1,
        address: 'So1anaMockDesignSched11111111111111111111111',
        houseId: 'house_design_schedule_story',
        displayName: 'Schedule Design Viewer',
      },
    ],
  });
  const viewer = seeded?.actors?.[0] || null;
  if (!viewer?.address || !viewer?.houseId) {
    throw new Error('POKER_DESIGN_SCHEDULE_SEED_FAILED');
  }
  const context = await browser.newContext({
    viewport,
    ...(baseURL ? { baseURL } : {}),
  });
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: viewer.address,
    houseId: viewer.houseId,
  });
  if (adminToken) {
    await page.addInitScript(() => {
      window.localStorage.setItem('poker.adminToken', 'test-admin');
    });
  }
  const params = new URLSearchParams({ embed: '1', asOf });
  if (uiLocale) params.set('uiLocale', uiLocale);
  if (uiCopy) params.set('uiCopy', uiCopy);
  await page.goto(`/poker/play/schedule?${params.toString()}`);
  return {
    context,
    page,
  };
}

async function openDesignLobby(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  uiLocale = '',
  uiCopy = '',
} = {}) {
  const user = {
    address: 'So1anaMockDesignLobbyA111111111111111111111111',
    houseId: 'house_design_lobby_story',
    streamId: 'stream-design-lobby-story',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: user.address,
        streamId: user.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const context = await browser.newContext({
    viewport,
    ...(baseURL ? { baseURL } : {}),
  });
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: user.address,
    houseId: user.houseId,
  });
  await verifyStreamflowAndFundOil(page, request, {
    address: user.address,
    streamId: user.streamId,
  });
  const params = new URLSearchParams({ embed: '1' });
  if (uiLocale) params.set('uiLocale', uiLocale);
  if (uiCopy) params.set('uiCopy', uiCopy);
  await page.goto(`/poker/play?${params.toString()}`);
  return {
    context,
    page,
    user,
  };
}

async function openDesignOperatorReview(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  asOf = '2026-03-12T20:30:00.000Z',
  uiLocale = '',
  uiCopy = '',
} = {}) {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'director_series_scheduled_break_ready',
    asOf,
    tableId: 'pkt_play_design_operator_story',
  });
  const tableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  if (!tableId) {
    throw new Error('POKER_DESIGN_OPERATOR_TABLE_MISSING');
  }
  const context = await browser.newContext({
    viewport,
    ...(baseURL ? { baseURL } : {}),
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });
  const params = new URLSearchParams({ embed: '1', asOf });
  if (uiLocale) params.set('uiLocale', uiLocale);
  if (uiCopy) params.set('uiCopy', uiCopy);
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?${params.toString()}`);
  return {
    context,
    page,
    tableId,
  };
}

async function openDesignCentaurTable(browser, request, {
  baseURL = '',
  viewport = { width: 1440, height: 1200 },
  uiLocale = '',
  uiCopy = '',
} = {}) {
  const address = 'So1anaMockDesignCentaur111111111111111111111111';
  const streamId = 'stream-design-centaur';
  await seedStreamflowLocks(request, {
    locks: [
      {
        address,
        streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const context = await browser.newContext({
    viewport,
    ...(baseURL ? { baseURL } : {}),
  });
  const page = await context.newPage();
  await page.addInitScript((walletAddress) => {
    window.__PRIVY_WALLET_BRIDGE__ = {
      async connectSolana() {
        return { address: walletAddress };
      },
      async signSolanaMessage() {
        return new Uint8Array(Array(64).fill(7));
      },
    };
  }, address);
  const params = new URLSearchParams({ embed: '1' });
  if (uiLocale) params.set('uiLocale', uiLocale);
  if (uiCopy) params.set('uiCopy', uiCopy);
  await page.goto(`/poker/centaur/tournaments/pkt_centaur_01?${params.toString()}`);
  await bindPageSession(page, { address, houseId: 'house_design_centaur' });
  await page.locator('#centaurVerifyForm').waitFor({ timeout: 5000 });
  await page.locator('#centaurStreamId').fill(streamId);
  await page.locator('#centaurVerifyForm button[type="submit"]').click();
  await page.locator('#centaurJoinForm').waitFor({ timeout: 5000 });
  await fundOilWallet(request, {
    walletSubject: address,
    houseId: 'house_design_centaur',
    amount: 1200,
  });
  await page.reload();
  await page.locator('#centaurJoinForm button[type="submit"]').waitFor({ timeout: 5000 });
  await page.locator('#centaurJoinForm button[type="submit"]').click();
  await page.locator('[data-poker-section="centaur-live-hand"]').waitFor({ timeout: 5000 });
  return {
    context,
    page,
    address,
  };
}

module.exports = {
  closeDesignPage,
  closeDesignLiveTable,
  openDesignHandReview,
  openDesignLobby,
  openDesignLiveTable,
  openDesignNativeSeason,
  openDesignOperatorReview,
  openDesignRailSeries,
  openDesignSchedule,
  openDesignCentaurTable,
};

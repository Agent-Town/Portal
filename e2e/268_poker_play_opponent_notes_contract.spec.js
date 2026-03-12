const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T14:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.5: opponent notes stay private to the authoring wallet and bind to the selected opponent', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_opponent_notes',
  });
  const tableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  const author = seeded?.actors?.[0] || null;
  const opponent = seeded?.actors?.[1] || null;
  expect(tableId).toBeTruthy();
  expect(author?.address).toBeTruthy();
  expect(opponent?.address).toBeTruthy();

  const authorContext = await browser.newContext();
  const authorPage = await authorContext.newPage();
  await authorPage.goto('/');
  await bindPageSession(authorPage, {
    address: author.address,
    houseId: author.houseId,
  });

  const historyResp = await browserJson(authorPage, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history?status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(historyResp.ok).toBe(true);
  const handId = String(historyResp.body?.data?.items?.[0]?.handId || '');
  expect(handId).toBeTruthy();

  const createResp = await browserJson(authorPage, `/api/poker/play/opponents/${encodeURIComponent(opponent.address)}/notes`, {
    method: 'POST',
    data: {
      tableId,
      handId,
      topic: 'Turn leaks',
      body: 'Overfolds turn probes after flatting preflop.',
      tags: ['exploit', 'turn'],
    },
  });
  expect(createResp.ok).toBe(true);
  expect(createResp.body?.data?.entry?.entryKind).toBe('opponent_note');
  expect(createResp.body?.data?.entry?.opponentWalletSubject).toBe(opponent.address);

  const authorListResp = await browserJson(authorPage, `/api/poker/play/opponents/${encodeURIComponent(opponent.address)}/notes?tableId=${encodeURIComponent(tableId)}&asOf=${encodeURIComponent(AS_OF)}`);
  expect(authorListResp.ok).toBe(true);
  expect(authorListResp.body?.data?.items).toHaveLength(1);
  expect(authorListResp.body?.data?.items?.[0]?.body).toContain('Overfolds turn probes');

  const opponentContext = await browser.newContext();
  const opponentPage = await opponentContext.newPage();
  await opponentPage.goto('/');
  await bindPageSession(opponentPage, {
    address: opponent.address,
    houseId: opponent.houseId,
  });
  const opponentListResp = await browserJson(opponentPage, `/api/poker/play/opponents/${encodeURIComponent(opponent.address)}/notes?tableId=${encodeURIComponent(tableId)}&asOf=${encodeURIComponent(AS_OF)}`);
  expect(opponentListResp.ok).toBe(true);
  expect(opponentListResp.body?.data?.items || []).toHaveLength(0);

  await opponentContext.close();
  await authorContext.close();
});

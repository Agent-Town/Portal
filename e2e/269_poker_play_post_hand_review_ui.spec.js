const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T14:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.5 UI: hand review renders structured study sections with human notes, agent note, lesson tags, and opponent notes', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_review_ui',
  });
  const tableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  const actor = seeded?.actors?.[0] || null;
  const opponent = seeded?.actors?.[1] || null;
  expect(tableId).toBeTruthy();
  expect(actor?.address).toBeTruthy();
  expect(opponent?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  const historyResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history?status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(historyResp.ok).toBe(true);
  const handId = String(historyResp.body?.data?.items?.[0]?.handId || '');
  expect(handId).toBeTruthy();

  const noteResp = await browserJson(page, '/api/poker/play/notebook', {
    method: 'POST',
    data: {
      tableId,
      handId,
      topic: 'River blocker lesson',
      body: 'Keep the river call-down plan when the paired board blocks the value region.',
      tags: ['river', 'blocker'],
    },
  });
  expect(noteResp.ok).toBe(true);

  const opponentResp = await browserJson(page, `/api/poker/play/opponents/${encodeURIComponent(opponent.address)}/notes`, {
    method: 'POST',
    data: {
      tableId,
      handId,
      topic: 'Opponent turn profile',
      body: 'Still overfolds versus delayed c-bets after one-call lines.',
      tags: ['turn', 'exploit'],
    },
  });
  expect(opponentResp.ok).toBe(true);

  await page.goto(`/poker/play/hands/${encodeURIComponent(handId)}/review?embed=1&asOf=${encodeURIComponent(AS_OF)}`);
  const humanNoteCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Human Note' }) });
  const agentNoteCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Agent Note' }) });
  const lessonTagsCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Lesson Tags' }) });
  const opponentNotesCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Opponent Notes' }) });
  await expect(page.getByRole('heading', { name: 'Result Summary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Action Line' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Board & Pot' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Human Note' })).toBeVisible();
  await expect(humanNoteCard.getByText('Keep the river call-down plan when the paired board blocks the value region.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agent Note' })).toBeVisible();
  await expect(agentNoteCard.getByText('Call once and re-evaluate on the river if the board pairs.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lesson Tags' })).toBeVisible();
  await expect(lessonTagsCard.getByText(/^river$/)).toBeVisible();
  await expect(lessonTagsCard.getByText(/^blocker$/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Opponent Notes' })).toBeVisible();
  await expect(opponentNotesCard.getByText('Still overfolds versus delayed c-bets after one-call lines.')).toBeVisible();

  await context.close();
});

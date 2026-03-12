const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T14:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.5 UI: hand review lets the player save notebook notes and renders the saved study entry immediately', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_study_ui',
  });
  const tableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
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

  const historyResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history?status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(historyResp.ok).toBe(true);
  const handId = String(historyResp.body?.data?.items?.[0]?.handId || '');
  expect(handId).toBeTruthy();

  await page.goto(`/poker/play/hands/${encodeURIComponent(handId)}/review?embed=1&asOf=${encodeURIComponent(AS_OF)}`);
  await expect(page.getByRole('heading', { name: 'Notebook' })).toBeVisible();
  await page.locator('#pokerStudyTopicInput').fill('Turn probe defense');
  await page.locator('#pokerStudyBodyInput').fill('Keep the bluff-catch line in the notebook and recheck river blocker removal.');
  await page.locator('#pokerStudyTagsInput').fill('turn,river,defense');
  await page.locator('#pokerStudySaveButton').click();

  const notebookCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Notebook' }) });
  const humanNoteCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Human Note' }) });
  await expect(page.getByText('Notebook saved.')).toBeVisible();
  await expect(notebookCard.getByText('Turn probe defense')).toBeVisible();
  await expect(humanNoteCard.getByText('Keep the bluff-catch line in the notebook')).toBeVisible();
  await expect(notebookCard.getByText(/^turn$/)).toBeVisible();
  await expect(notebookCard.getByText(/^river$/)).toBeVisible();
  await expect(notebookCard.getByText(/^defense$/)).toBeVisible();

  await context.close();
});

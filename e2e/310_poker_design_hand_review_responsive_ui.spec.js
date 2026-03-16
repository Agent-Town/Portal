const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { closeDesignPage, openDesignHandReview } = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D3 responsive: hand review keeps replay on the main lane and study on the supporting rail at desktop width', async ({ browser, request }) => {
  const resources = await openDesignHandReview(browser, request, {
    viewport: { width: 1440, height: 1200 },
  });
  const { page } = resources;

  const actionLine = page.locator('[data-poker-section="review-action-line"]');
  const boardPot = page.locator('[data-poker-section="review-board-pot"]');
  const notebook = page.locator('[data-poker-section="review-notebook"]');
  const opponentNotes = page.locator('[data-poker-section="review-opponent-notes"]');

  const actionLineBox = await actionLine.boundingBox();
  const boardPotBox = await boardPot.boundingBox();
  const notebookBox = await notebook.boundingBox();
  const opponentNotesBox = await opponentNotes.boundingBox();

  expect(actionLineBox).toBeTruthy();
  expect(boardPotBox).toBeTruthy();
  expect(notebookBox).toBeTruthy();
  expect(opponentNotesBox).toBeTruthy();
  expect(notebookBox.x).toBeGreaterThan(actionLineBox.x + 120);
  expect(opponentNotesBox.x).toBeGreaterThan(boardPotBox.x + 120);

  await closeDesignPage(resources);
});

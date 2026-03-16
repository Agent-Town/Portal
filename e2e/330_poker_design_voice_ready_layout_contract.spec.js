const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  closeDesignLiveTable,
  closeDesignPage,
  openDesignCentaurTable,
  openDesignLiveTable,
} = require('./helpers/poker_design');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D5 voice-ready: live table reserves hidden voice slots without displacing the primary action', async ({ browser, request }) => {
  const resources = await openDesignLiveTable(browser, request, {
    viewport: { width: 390, height: 844 },
  });

  try {
    const { page } = resources;
    const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
      nodes.map((node) => node.getAttribute('data-poker-section'))
    ));
    expect(sectionOrder.indexOf('current-hand')).toBeLessThan(sectionOrder.indexOf('submit-action'));
    expect(sectionOrder.indexOf('submit-action')).toBeLessThan(sectionOrder.indexOf('seat-thread'));

    const seatThreadVoiceSlot = page.locator('[data-poker-voice-slot="seat-thread"]');
    const submitActionVoiceSlot = page.locator('[data-poker-voice-slot="submit-action"]');
    await expect(seatThreadVoiceSlot).toBeHidden();
    await expect(submitActionVoiceSlot).toBeHidden();
    await expect(seatThreadVoiceSlot).toHaveAttribute('aria-hidden', 'true');
    await expect(submitActionVoiceSlot).toHaveAttribute('aria-hidden', 'true');
  } finally {
    await closeDesignLiveTable(resources);
  }
});

test('D5 voice-ready: centaur keeps hidden voice hooks next to discussion and commit surfaces', async ({ browser, request }) => {
  const resources = await openDesignCentaurTable(browser, request, {
    viewport: { width: 390, height: 844 },
  });

  try {
    const { page } = resources;
    const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
      nodes.map((node) => node.getAttribute('data-poker-section'))
    ));
    expect(sectionOrder.indexOf('centaur-live-hand')).toBeLessThan(sectionOrder.indexOf('centaur-submit-action'));
    expect(sectionOrder.indexOf('centaur-submit-action')).toBeLessThan(sectionOrder.indexOf('centaur-discussion'));

    const discussionVoiceSlot = page.locator('[data-poker-voice-slot="centaur-discussion"]');
    const actionVoiceSlot = page.locator('[data-poker-voice-slot="centaur-action"]');
    await expect(discussionVoiceSlot).toBeHidden();
    await expect(actionVoiceSlot).toBeHidden();
    await expect(discussionVoiceSlot).toHaveAttribute('aria-hidden', 'true');
    await expect(actionVoiceSlot).toHaveAttribute('aria-hidden', 'true');
  } finally {
    await closeDesignPage(resources);
  }
});

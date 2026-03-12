const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8 UI: tournament schedule page shows recurring templates and durable upcoming registration events', async ({ browser, request }) => {
  const viewer = {
    address: 'So1anaMockSchedUIA1111111111111111111111111',
    houseId: 'house_sched_ui_a',
  };

  await seedPokerPlayHarness(request, {
    scenario: 'schedule_calendar_story',
    asOf: '2026-03-12T08:00:00.000Z',
    tableId: 'pkt_play_phase25_schedule_calendar_story',
    actors: [
      {
        seatNumber: 1,
        address: viewer.address,
        houseId: viewer.houseId,
        displayName: 'Schedule Viewer',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, viewer);

  await page.goto('/poker/play/schedule?asOf=2026-03-12T08%3A00%3A00.000Z&embed=1');

  await expect(page.getByRole('heading', { name: 'Tournament Schedule' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recurring Templates' })).toBeVisible();
  await expect(page.getByText('Daily River Sprint').first()).toBeVisible();
  await expect(page.getByText('Daily 12:00 UTC').first()).toBeVisible();
  await expect(page.getByText('2 upcoming events').first()).toBeVisible();
  await expect(page.getByText('Friday Deepstack Major').first()).toBeVisible();
  await expect(page.getByText('Weekly Fri 18:00 UTC').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '2026-03-12' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '2026-03-13' })).toBeVisible();
  await expect(page.getByText('registered').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Lobby Table' }).first()).toBeVisible();

  await context.close();
});

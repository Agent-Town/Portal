const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

const AS_OF = '2026-03-12T08:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('D1 hierarchy: schedule shows upcoming events before recurring templates and admin tools', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'schedule_calendar_story',
    asOf: AS_OF,
    tableId: 'pkt_play_design_schedule_hierarchy',
    actors: [
      {
        seatNumber: 1,
        address: 'So1anaMockDesignSched11111111111111111111111',
        houseId: 'house_design_schedule_hierarchy',
        displayName: 'Schedule Hierarchy Viewer',
      },
    ],
  });

  const viewer = seeded?.actors?.[0];
  expect(viewer?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: viewer.address,
    houseId: viewer.houseId,
  });
  await page.addInitScript(() => {
    window.localStorage.setItem('poker.adminToken', 'test-admin');
  });

  await page.goto(`/poker/play/schedule?asOf=${encodeURIComponent(AS_OF)}&embed=1`);

  const sectionOrder = await page.locator('#pokerContent > [data-poker-section]').evaluateAll((nodes) => (
    nodes.map((node) => node.getAttribute('data-poker-section'))
  ));

  expect(sectionOrder.indexOf('schedule-snapshot')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('schedule-day')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('recurring-templates')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('schedule-admin')).toBeGreaterThanOrEqual(0);
  expect(sectionOrder.indexOf('schedule-snapshot')).toBeLessThan(sectionOrder.indexOf('schedule-day'));
  expect(sectionOrder.indexOf('schedule-day')).toBeLessThan(sectionOrder.indexOf('recurring-templates'));
  expect(sectionOrder.indexOf('recurring-templates')).toBeLessThan(sectionOrder.indexOf('schedule-admin'));

  await expect(page.locator('[data-poker-section="schedule-day"]').first()).toBeVisible();
  await expect(page.locator('[data-poker-section="schedule-admin"]')).toBeVisible();

  await context.close();
});

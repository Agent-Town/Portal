const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T10:00:00.000Z';
const TIMEBANK_AS_OF = '2026-03-11T10:00:27.000Z';
const AUTO_ACT_AS_OF = '2026-03-11T10:00:43.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.6 UI: live table exposes visible auto-act controls and instant revoke', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_auto_ui',
  });
  const tableId = String(seeded?.tableId || seeded?.tableIds?.[0] || '');
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

  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=${encodeURIComponent(AS_OF)}`);
  await expect(page.getByRole('heading', { name: 'Auto-Act' })).toBeVisible();
  await page.locator('#pokerPlayAutoActMode').selectOption('check_fold');
  await page.locator('#pokerPlayAutoActSaveButton').click();

  const autoActCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Auto-Act' }) });
  await expect(page.getByText('Auto-act updated.')).toBeVisible();
  await expect(autoActCard.getByText(/^check\/fold$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn Off Auto-Act' })).toBeVisible();

  const timebankAdvance = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(TIMEBANK_AS_OF)}`);
  expect(timebankAdvance.ok).toBe(true);
  const autoActAdvance = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}?asOf=${encodeURIComponent(AUTO_ACT_AS_OF)}`);
  expect(autoActAdvance.ok).toBe(true);
  await page.goto(`/poker/play/tables/${encodeURIComponent(tableId)}?embed=1&asOf=${encodeURIComponent(AUTO_ACT_AS_OF)}`);
  await expect(autoActCard.getByText(/^check\/fold$/)).toBeVisible();

  await page.getByRole('button', { name: 'Turn Off Auto-Act' }).click();
  await expect(page.getByText('Auto-act disabled.')).toBeVisible();
  await expect(autoActCard.getByText(/^off$/)).toBeVisible();

  await context.close();
});

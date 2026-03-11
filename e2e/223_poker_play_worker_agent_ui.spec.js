const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.8: modal poker UI uses the parent worker gateway and exposes the seat-agent trace', async ({ browser, request }) => {
  const seedAt = new Date().toISOString();
  const readAt = new Date(Date.parse(seedAt) + 1000).toISOString();
  const actingUser = {
    address: 'So1anaPhase22WorkerUiA11111111111111111111111',
    houseId: 'house_phase22_worker_ui_a',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: seedAt,
    actors: [
      {
        seatNumber: 1,
        address: actingUser.address,
        houseId: actingUser.houseId,
        displayName: 'Worker UI Alpha',
      },
      {
        seatNumber: 2,
        address: 'So1anaPhase22WorkerUiB11111111111111111111111',
        houseId: 'house_phase22_worker_ui_b',
        displayName: 'Worker UI Bravo',
      },
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
    localStorage.setItem('agentTown:panel:debugVisible', '1');
  });
  await page.goto('/');
  await bindPageSession(page, actingUser);
  await page.goto(`/app?liteDriver=phase1&trainerNamespace=1&district=poker&pokerPath=${encodeURIComponent(`/poker/play/tables/${seeded.tableId}?asOf=${encodeURIComponent(readAt)}`)}`);

  await page.waitForFunction(() => !!window.__openclawLiteTest, null, { timeout: 10000 });
  await page.waitForFunction(() => !!window.AgentTownRuntimeGateway, null, { timeout: 10000 });
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Portal Poker');
  await expect(page.getByTestId('agent-panel')).toBeVisible();

  const debugPane = page.getByTestId('agent-debug-pane');
  if (!(await debugPane.isVisible())) {
    await page.getByTestId('agent-debug-toggle').click();
  }

  const frame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await expect(frame.getByRole('heading', { name: 'Worker Seat Agent' })).toBeVisible();
  await expect(frame.getByRole('button', { name: 'Request Worker Line' })).toBeVisible();
  await frame.getByRole('button', { name: 'Request Worker Line' }).click();

  await expect(frame.getByRole('button', { name: 'Commit Worker Action' })).toBeVisible({ timeout: 5000 });
  await expect(frame.getByText(/Pressure this 6-max spot now|The price is controlled|No forced investment here|This is the lowest-variance legal continue|This spot burns too much stack/).first()).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL(/\/app/);

  await page.getByTestId('agent-debug-tab-tools').click();
  await expect(page.getByTestId('agent-debug-tools')).toContainText('poker_action_propose', { timeout: 8000 });
  await expect(page.getByTestId('agent-debug-tools')).toContainText('poker_action_commit', { timeout: 8000 });

  await page.getByTestId('agent-debug-tab-traffic').click();
  await expect(page.getByTestId('agent-debug-traffic')).toContainText('gateway.pokerActionProposeTool', { timeout: 8000 });
  await expect.poll(async () => {
    return await page.locator('#agentDebugTraffic .agent-traffic-card').count();
  }, { timeout: 8000 }).toBeGreaterThan(0);

  await context.close();
});

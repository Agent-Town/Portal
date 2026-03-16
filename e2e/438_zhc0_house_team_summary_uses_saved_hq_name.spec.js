const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { attachHouseToPageSession } = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function bootstrapFoundersReady(request) {
  const response = await request.post('/__test__/session/bootstrap-onboarding', {
    headers: { 'x-test-reset': resetToken },
    data: {
      step: 'done',
      profile: {
        humanName: 'Robin',
        agentName: 'OpenClaw',
      },
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function readActiveTeamIdFromSummary(summary) {
  const text = String((await summary.textContent()) || '').trim();
  expect(text.startsWith('Active team: ')).toBe(true);
  const activeTeamId = text.slice('Active team: '.length).trim();
  expect(activeTeamId.length).toBeGreaterThan(0);
  return activeTeamId;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M44.16 saved HQ name brands the House systems team summary after save and reload', async ({ page, request }) => {
  await bootstrapFoundersReady(page.request);
  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.reload();
  await waitForLiteApi(page);

  const root = page.getByTestId('zhc-house-hq-surface');
  const input = page.getByTestId('house-hq-name-input');
  const preview = page.getByTestId('house-hq-name-preview');
  const primary = page.getByTestId('house-hq-start-mission');
  const summary = page.getByTestId('house-team-summary');
  const customName = 'Shared Orbit';

  await expect(root).toBeVisible();
  const activeTeamId = await readActiveTeamIdFromSummary(summary);
  await expect(summary).not.toContainText('HQ');

  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(summary).toHaveText(`${customName} HQ · active team ${activeTeamId}`);

  await page.reload();
  await waitForLiteApi(page);

  await expect(root).toBeVisible();
  await expect(preview).toHaveText(customName);
  await expect(summary).toHaveText(`${customName} HQ · active team ${activeTeamId}`);
});

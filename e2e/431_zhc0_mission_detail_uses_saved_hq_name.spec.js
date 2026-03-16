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

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M44.9 saved HQ name reaches the Mission detail line after save and reload', async ({ page, request }) => {
  await bootstrapFoundersReady(page.request);
  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
  });
  expect(attached.status).toBe(200);

  await page.reload();
  await waitForLiteApi(page);

  const input = page.getByTestId('house-hq-name-input');
  const primary = page.getByTestId('house-hq-start-mission');
  const detail = page.getByTestId('house-experiences-detail');
  const missionOptions = page.locator('#houseExperiencesList button');
  const customName = 'Shared Orbit';

  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(missionOptions.first()).toBeVisible();
  await missionOptions.first().click();
  await expect(detail).toContainText(`from ${customName} HQ`);
  await expect(detail).toContainText('active team');

  await page.reload();
  await waitForLiteApi(page);

  await expect(page.getByTestId('zhc-house-hq-surface')).toBeVisible();
  await page.getByTestId('house-hq-start-mission').click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(missionOptions.first()).toBeVisible();
  await missionOptions.first().click();
  await expect(detail).toContainText(`from ${customName} HQ`);
  await expect(detail).toContainText('active team');
});

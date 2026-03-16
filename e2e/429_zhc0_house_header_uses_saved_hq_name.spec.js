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

test('M44.7 saved HQ name becomes the House modal header after save and reload', async ({ page, request }) => {
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

  const title = page.locator('#districtModalTitle');
  const input = page.getByTestId('house-hq-name-input');
  const primary = page.getByTestId('house-hq-start-mission');
  const customName = 'Shared Orbit';

  await expect(title).toHaveText('Plan Wagons');
  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(title).toHaveText(`${customName} HQ`);

  await page.reload();
  await waitForLiteApi(page);

  await expect(page.getByTestId('zhc-house-hq-surface')).toBeVisible();
  await expect(page.getByTestId('house-hq-name-preview')).toHaveText(customName);
  await expect(title).toHaveText(`${customName} HQ`);
});

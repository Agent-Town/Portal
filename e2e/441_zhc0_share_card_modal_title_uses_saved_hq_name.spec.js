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

test('M44.19 outer share-card modal title stays generic before save and brands itself from the saved HQ name after save', async ({ page, request }) => {
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

  const root = page.getByTestId('zhc-house-hq-surface');
  const input = page.getByTestId('house-hq-name-input');
  const primary = page.getByTestId('house-hq-start-mission');
  const shareCardButton = page.getByTestId('open-share-card');
  const modalTitle = page.locator('#districtModalTitle');
  const modalVisible = page.locator('#districtModalBackdrop:not(.is-hidden)');
  const shareFrameHost = page.locator('#districtModalBody iframe.districtFrame');
  const customName = 'Shared Orbit';

  await expect(root).toBeVisible();

  await shareCardButton.click();
  await expect(modalVisible).toHaveCount(1);
  await expect(shareFrameHost).toHaveAttribute('src', /\/s\/sh_missing\?embed=1$/);
  await expect(modalTitle).toHaveText('Share Card');

  await page.reload();
  await waitForLiteApi(page);
  await expect(root).toBeVisible();

  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();

  await shareCardButton.click();
  await expect(modalVisible).toHaveCount(1);
  await expect(modalTitle).toHaveText(`${customName} HQ share card`);

  await page.reload();
  await waitForLiteApi(page);

  await expect(root).toBeVisible();
  await expect(page.getByTestId('house-hq-name-preview')).toHaveText(customName);

  await shareCardButton.click();
  await expect(modalVisible).toHaveCount(1);
  await expect(modalTitle).toHaveText(`${customName} HQ share card`);
});

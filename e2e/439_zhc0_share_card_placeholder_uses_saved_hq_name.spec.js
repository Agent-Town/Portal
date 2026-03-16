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

test('M44.17 share-card placeholder shell uses the saved HQ name inside the modal preview', async ({ page, request }) => {
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
  const customName = 'Shared Orbit';

  await expect(root).toBeVisible();

  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(shareCardButton).toHaveText('Preview Shared Orbit HQ share card');

  await shareCardButton.click();
  const shareFrameHost = page.locator('#districtModalBody iframe.districtFrame');
  await expect(shareFrameHost).toHaveAttribute('src', /\/s\/sh_missing\?embed=1$/);

  const shareFrame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await expect(shareFrame.getByTestId('share-card-title')).toHaveText(`${customName} HQ share card`);
  await expect(shareFrame.getByTestId('share-lead')).toHaveText(
    `Placeholder shell for ${customName} HQ while the public share card is still offline.`
  );
  await expect(shareFrame.getByTestId('share-hero-placeholder')).toHaveText(
    `${customName} HQ hero will appear here once the public share card is minted.`
  );
  await expect(shareFrame.locator('#shareIdBadge')).toHaveText('preview');
  await expect(shareFrame.locator('#err')).toHaveText('');
});

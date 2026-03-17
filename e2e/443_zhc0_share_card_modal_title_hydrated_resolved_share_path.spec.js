const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse, houseAuthHeadersFromKeyB64 } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { attachHouseToPageSession, callPageJson } = require('./helpers/unified_platform');

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

async function createResolvedShare(request, { houseId, houseAuthKey }) {
  const path = `/api/house/${houseId}/share`;
  const body = '';
  const response = await request.post(path, {
    data: body,
    headers: houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey),
  });
  expect(response.ok()).toBeTruthy();
  const share = await response.json();
  expect(share.ok).toBeTruthy();
  expect(share.shareId).toBeTruthy();
  return share;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M44.21 outer share-card modal title uses the already-hydrated resolved share branch before and after HQ save', async ({ page, request }) => {
  await bootstrapFoundersReady(page.request);
  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
  });
  expect(attached.status).toBe(200);

  const share = await createResolvedShare(request, seededHouse);

  await page.reload();
  await waitForLiteApi(page);

  const hydratedState = await callPageJson(page, '/api/state');
  expect(hydratedState.status).toBe(200);
  expect(hydratedState.json?.share?.id).toBe(share.shareId);

  let byHouseLookupCount = 0;
  page.on('request', (pending) => {
    try {
      const requestUrl = new URL(pending.url());
      if (pending.method() === 'GET' && requestUrl.pathname === `/api/share/by-house/${seededHouse.houseId}`) {
        byHouseLookupCount += 1;
      }
    } catch {
      // ignore malformed URLs in test bookkeeping
    }
  });

  const root = page.getByTestId('zhc-house-hq-surface');
  const input = page.getByTestId('house-hq-name-input');
  const primary = page.getByTestId('house-hq-start-mission');
  const shareCardButton = page.getByTestId('open-share-card');
  const modalTitle = page.locator('#districtModalTitle');
  const modalVisible = page.locator('#districtModalBackdrop:not(.is-hidden)');
  const shareFrameHost = page.locator('#districtModalBody iframe.districtFrame');
  const customName = 'Shared Orbit';
  const resolvedSrcPattern = new RegExp(`/s/${share.shareId}\\?embed=1$`);

  await expect(root).toBeVisible();

  await shareCardButton.click();
  await expect(modalVisible).toHaveCount(1);
  await expect(shareFrameHost).toHaveAttribute('src', resolvedSrcPattern);
  await expect(modalTitle).toHaveText('Share Card');
  expect(byHouseLookupCount).toBe(0);

  await page.reload();
  await waitForLiteApi(page);
  await expect(root).toBeVisible();

  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();

  await shareCardButton.click();
  await expect(modalVisible).toHaveCount(1);
  await expect(shareFrameHost).toHaveAttribute('src', resolvedSrcPattern);
  await expect(modalTitle).toHaveText(`${customName} HQ share card`);
  expect(byHouseLookupCount).toBe(0);

  await page.reload();
  await waitForLiteApi(page);

  const rehydratedState = await callPageJson(page, '/api/state');
  expect(rehydratedState.status).toBe(200);
  expect(rehydratedState.json?.share?.id).toBe(share.shareId);

  await expect(root).toBeVisible();
  await expect(page.getByTestId('house-hq-name-preview')).toHaveText(customName);

  await shareCardButton.click();
  await expect(modalVisible).toHaveCount(1);
  await expect(shareFrameHost).toHaveAttribute('src', resolvedSrcPattern);
  await expect(modalTitle).toHaveText(`${customName} HQ share card`);
  expect(byHouseLookupCount).toBe(0);
});

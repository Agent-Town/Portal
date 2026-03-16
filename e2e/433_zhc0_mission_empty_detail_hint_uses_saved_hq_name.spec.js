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

async function forceMissionEmptyState(page) {
  await page.route('**/api/platform/experiences*', async (route) => {
    const response = await route.fetch();
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const nextPayload = payload && typeof payload === 'object' ? payload : {};
    const nextData = nextPayload?.data && typeof nextPayload.data === 'object'
      ? { ...nextPayload.data }
      : {};
    nextData.items = [];
    nextData.emptyStateText = 'No House experiences available yet.';
    await route.fulfill({
      status: response.status(),
      headers: {
        ...response.headers(),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...nextPayload,
        data: nextData,
      }),
    });
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M44.11 Mission empty detail hint stays generic before save and brands the saved HQ name after reload', async ({ page, request }) => {
  await bootstrapFoundersReady(page.request);
  const seededHouse = await seedRecoverableTokenHouse(request);
  await forceMissionEmptyState(page);

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
  const preview = page.getByTestId('house-hq-name-preview');
  const primary = page.getByTestId('house-hq-start-mission');
  const detail = page.getByTestId('house-experiences-detail');
  const customName = 'Shared Orbit';

  await expect(root).toBeVisible();
  await page.getByTestId('house-open-experiences').click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(detail).toHaveText('Entry points appear here once an experience is routed in.');
  await expect(detail).not.toContainText('HQ');

  await page.reload();
  await waitForLiteApi(page);

  await expect(root).toBeVisible();
  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(detail).toHaveText(`Entry points for ${customName} HQ appear here once an experience is routed in.`);

  await page.reload();
  await waitForLiteApi(page);

  await expect(root).toBeVisible();
  await expect(preview).toHaveText(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(detail).toHaveText(`Entry points for ${customName} HQ appear here once an experience is routed in.`);
});

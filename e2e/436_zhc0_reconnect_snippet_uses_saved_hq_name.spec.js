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

async function expectGenericReconnectSnippet(snippet) {
  const text = String((await snippet.textContent()) || '').trim();
  expect(text.startsWith('Reconnect worker session ')).toBe(true);
  expect(text.endsWith(' to your house.')).toBe(true);
}

async function expectNamedReconnectSnippet(snippet, hqName) {
  const text = String((await snippet.textContent()) || '').trim();
  expect(text.startsWith('Reconnect worker session ')).toBe(true);
  expect(text.endsWith(` to ${hqName} HQ.`)).toBe(true);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M44.14 saved HQ name brands the reconnect house snippet after save and reload', async ({ page, request }) => {
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
  const preview = page.getByTestId('house-hq-name-preview');
  const primary = page.getByTestId('house-hq-start-mission');
  const snippet = page.getByTestId('house-snippet');
  const customName = 'Shared Orbit';

  await expect(root).toBeVisible();
  await expectGenericReconnectSnippet(snippet);

  await input.fill(customName);
  await primary.click();

  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expectNamedReconnectSnippet(snippet, customName);

  await page.reload();
  await waitForLiteApi(page);

  await expect(root).toBeVisible();
  await expect(preview).toHaveText(customName);
  await expectNamedReconnectSnippet(snippet, customName);
});

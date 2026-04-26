const fs = require('fs');
const { test, expect } = require('@playwright/test');
const {
  installMockSolanaWallet,
  seedRecoverableTokenHouse
} = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const DIR = '/tmp/portal-screenshots';

function emptyStorageState() {
  return { cookies: [], origins: [] };
}

async function newCleanContext(browser, testInfo) {
  return browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    storageState: emptyStorageState()
  });
}

async function mockPrivyRequired(page, { loggedIn = false } = {}) {
  await page.addInitScript(({ isLoggedIn }) => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async () => isLoggedIn ? { id: 'rc-incognito-user', email: 'rc@example.com' } : null
    });
  }, { isLoggedIn: loggedIn });

  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: true,
        startPageEnabled: true,
        appPath: '/app',
        config: {
          appId: 'app-mock',
          loginMethod: 'email',
          enableDefaultBridge: false
        }
      })
    });
  });
}

async function expectPlanWagonsHouse(page) {
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 8000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Plan Wagons');
  await expect(page.getByTestId('house-platform-illustration')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('#townhallRegisterPanel')).toHaveCount(0);
  await expect(page.locator('.districtFrame')).toHaveCount(0);
}

test.beforeAll(() => {
  fs.mkdirSync(DIR, { recursive: true });
});

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('clean Privy-gated house deeplink redirects to Start Gate before any house session exists', async ({ browser }, testInfo) => {
  const context = await newCleanContext(browser, testInfo);
  const page = await context.newPage();
  try {
    await mockPrivyRequired(page, { loggedIn: false });

    await page.goto('/app?district=house');
    await expect(page).toHaveURL(/\/start$/, { timeout: 8000 });
    await expect(page.getByRole('button', { name: /Play Founders Plot/i })).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: `${DIR}/rc-incognito-house-deeplink-start.png`, fullPage: true });
  } finally {
    await context.close();
  }
});

test('clean seeded house session keeps /app?district=house on Plan Wagons after reload and stale ceremony state', async ({ browser }, testInfo) => {
  const context = await newCleanContext(browser, testInfo);
  const page = await context.newPage();
  try {
    await installMockSolanaWallet(page);
    const seeded = await seedRecoverableTokenHouse(context.request);

    await page.goto('/app?district=house');
    await expectPlanWagonsHouse(page);
    await expect.poll(async () => {
      return page.evaluate(async () => {
        const resp = await fetch('/api/state', { credentials: 'include' });
        const state = await resp.json().catch(() => ({}));
        return String(state?.houseId || '');
      });
    }, { timeout: 5000 }).toBe(seeded.houseId);
    await page.screenshot({ path: `${DIR}/rc-incognito-seeded-house-route.png`, fullPage: true });

    await page.reload();
    await expectPlanWagonsHouse(page);

    await page.route('**/api/state', async (route) => {
      const response = await route.fetch();
      const json = await response.json().catch(() => ({}));
      json.onboarding = {
        ...(json.onboarding || {}),
        required: true,
        registrationComplete: true,
        step: 'ceremony'
      };
      json.signup = {
        ...(json.signup || {}),
        complete: true
      };
      json.ceremony = {
        ...(json.ceremony || {}),
        houseId: seeded.houseId
      };
      json.houseId = seeded.houseId;
      await route.fulfill({
        status: response.status(),
        contentType: 'application/json',
        body: JSON.stringify(json)
      });
    });

    await page.goto('/app?district=house');
    await expectPlanWagonsHouse(page);
    await page.waitForTimeout(1800);
    await expectPlanWagonsHouse(page);
    await page.screenshot({ path: `${DIR}/rc-incognito-stale-ceremony-house-route.png`, fullPage: true });
  } finally {
    await context.close();
  }
});

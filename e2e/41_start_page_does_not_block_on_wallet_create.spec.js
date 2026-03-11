const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page enters app even when Privy wallet auto-create fails', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive || !loginUi) return null;
        const email = await loginUi.requestEmail();
        if (!email) return null;
        return { id: 'mock-user', email };
      },
      connectSolana: async () => {
        throw new Error('EMBEDDED_WALLET_PROXY_NOT_INITIALIZED');
      }
    });
  });

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

  await page.goto('/start');
  await page.getByRole('button', { name: 'Enter' }).click();
  await page.locator('#privyEmailInput').fill('wallet-fail@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test('start page waits for Privy wallet warmup before entering app', async ({ page }) => {
  await page.addInitScript(() => {
    const eventsKey = 'privy:warmup-events';
    const pushEvent = (value) => {
      try {
        const current = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        current.push({ value: String(value || ''), at: Date.now() });
        localStorage.setItem(eventsKey, JSON.stringify(current));
      } catch {
        // ignore storage failures in tests
      }
    };

    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive || !loginUi) return null;
        const email = await loginUi.requestEmail();
        if (!email) return null;
        loginUi.notifyCodeSent({ email });
        const code = await loginUi.requestCode({ email });
        if (!code) return null;
        pushEvent('login:complete');
        return { id: 'mock-user', email };
      },
      connectSolana: async ({ silent = false } = {}) => {
        pushEvent(`solana:${silent ? 'silent' : 'interactive'}:start`);
        await new Promise((resolve) => setTimeout(resolve, 650));
        pushEvent(`solana:${silent ? 'silent' : 'interactive'}:done`);
        return { address: 'So11111111111111111111111111111111111111112' };
      },
      connectEvm: async ({ silent = false } = {}) => {
        pushEvent(`evm:${silent ? 'silent' : 'interactive'}:start`);
        await new Promise((resolve) => setTimeout(resolve, 650));
        pushEvent(`evm:${silent ? 'silent' : 'interactive'}:done`);
        return {
          address: '0x3333333333333333333333333333333333333333',
          provider: {
            request: async ({ method } = {}) => {
              if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
                return ['0x3333333333333333333333333333333333333333'];
              }
              return [];
            }
          }
        };
      }
    });
  });

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

  await page.goto('/start');
  await page.getByRole('button', { name: 'Enter' }).click();
  await page.locator('#privyEmailInput').fill('wallet-warm@example.com');
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();
  await expect(page.locator('#privyCodeForm')).toBeVisible();
  await page.locator('#privyCodeInput').fill('123456');
  await page.locator('#privyCodeForm').getByRole('button', { name: 'Verify code' }).click();

  await expect(page.getByText('Finalizing Privy wallets...')).toBeVisible();
  await page.waitForTimeout(250);
  await expect(page).toHaveURL(/\/start$/);

  await expect(page).toHaveURL(/\/app$/, { timeout: 5000 });
  await expect(page.locator('#districtMap')).toBeVisible();

  const events = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('privy:warmup-events') || '[]');
    } catch {
      return [];
    }
  });
  expect(events.map((entry) => entry.value)).toEqual([
    'login:complete',
    'solana:interactive:start',
    'evm:interactive:start',
    'solana:interactive:done',
    'evm:interactive:done',
  ]);
  expect(events[3].at).toBeGreaterThanOrEqual(events[0].at + 500);
  expect(events[4].at).toBeGreaterThanOrEqual(events[0].at + 500);
});

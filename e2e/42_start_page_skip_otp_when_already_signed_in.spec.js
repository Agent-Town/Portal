const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('start page skips OTP modal when Privy session already exists', async ({ page }) => {
  let onboardingStatusRequests = 0;

  await page.addInitScript(() => {
    const eventsKey = 'privy:auto-skip-events';
    const pushEvent = (value) => {
      try {
        const current = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        current.push(String(value || ''));
        localStorage.setItem(eventsKey, JSON.stringify(current));
      } catch {
        // ignore storage failures in tests
      }
    };

    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        pushEvent(`login:${interactive ? 'interactive' : 'silent'}`);
        if (!interactive) return { id: 'existing-user' };
        if (!loginUi) return { id: 'existing-user' };
        return { id: 'existing-user' };
      },
      connectSolana: async ({ silent = false } = {}) => {
        pushEvent(`solana:${silent ? 'silent' : 'interactive'}`);
        return { address: 'So11111111111111111111111111111111111111112' };
      },
      connectEvm: async ({ silent = false } = {}) => {
        pushEvent(`evm:${silent ? 'silent' : 'interactive'}`);
        return {
          address: '0x1111111111111111111111111111111111111111',
          provider: {
            request: async ({ method } = {}) => {
              if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
                return ['0x1111111111111111111111111111111111111111'];
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

  await page.route('**/api/onboarding/status', async (route) => {
    onboardingStatusRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        step: 2,
        hasWallet: true
      })
    });
  });

  await page.goto('/start');
  await expect(page).toHaveURL(/\/app$/, { timeout: 8000 });
  await expect(page.locator('#districtMap')).toBeVisible();

  expect(onboardingStatusRequests).toBe(0);

  const events = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('privy:auto-skip-events') || '[]');
    } catch {
      return [];
    }
  });
  expect(events).toContain('login:silent');
  expect(events).toContain('solana:silent');
  expect(events).toContain('evm:silent');
  expect(events).not.toContain('login:interactive');
});

test('wallet-only mock Privy bridge satisfies silent hub auth without OTP state', async ({ page }) => {
  await page.addInitScript(() => {
    window.__PRIVY_WALLET_BRIDGE__ = {
      connectSolana: async () => ({ address: 'So11111111111111111111111111111111111111112' }),
      disconnectSolana: async () => {},
      signSolanaMessage: async () => ({ signature: new Uint8Array(64) })
    };
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
          loginMethod: 'guest',
          enableDefaultBridge: false
        }
      })
    });
  });

  await page.goto('/start');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 8000 });
  await expect(page.locator('#districtMap')).toBeVisible();

  await page.goto('/app');
  await expect(page).toHaveURL(/\/app$/, { timeout: 8000 });
  await expect(page.locator('#districtMap')).toBeVisible();
});

test('wallet client forwards silent EVM connects to the Privy bridge', async ({ page }) => {
  await page.addInitScript(() => {
    const eventsKey = 'privy:wallet-client-events';
    const pushEvent = (value) => {
      try {
        const current = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        current.push(String(value || ''));
        localStorage.setItem(eventsKey, JSON.stringify(current));
      } catch {
        // ignore storage failures in tests
      }
    };

    window.__PRIVY_WALLET_BRIDGE__ = {
      connectEvm: async ({ silent = false } = {}) => {
        pushEvent(`evm:${silent ? 'silent' : 'interactive'}`);
        return {
          address: '0x2222222222222222222222222222222222222222',
          provider: {
            request: async ({ method } = {}) => {
              if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
                return ['0x2222222222222222222222222222222222222222'];
              }
              if (method === 'eth_chainId') return '0xaa36a7';
              return [];
            }
          }
        };
      },
      disconnectEvm: async () => {}
    };
  });

  await page.route('**/api/privy/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        enabled: false,
        startPageEnabled: false,
        appPath: '/app',
        config: {
          appId: 'app-mock',
          enableDefaultBridge: false
        }
      })
    });
  });

  await page.goto('/app');
  await page.waitForFunction(() => typeof window.initWalletClient === 'function');

  const connected = await page.evaluate(async () => {
    const client = typeof window.initWalletClient === 'function' ? window.initWalletClient() : null;
    if (!client) return null;
    return client.connect({ chain: 'evm', silent: true });
  });
  expect(connected).toMatchObject({
    chain: 'evm',
    address: '0x2222222222222222222222222222222222222222'
  });

  const events = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('privy:wallet-client-events') || '[]');
    } catch {
      return [];
    }
  });
  expect(events).toEqual(['evm:silent']);
});

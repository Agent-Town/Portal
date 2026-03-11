const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('wallet client silently bootstraps the Privy bridge on app load before wallet connects', async ({ page }) => {
  await page.addInitScript(() => {
    const eventsKey = 'privy:wallet-client-bootstrap-events';
    const pushEvent = (value) => {
      try {
        const current = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        current.push(String(value || ''));
        localStorage.setItem(eventsKey, JSON.stringify(current));
      } catch {
        // ignore storage failures in tests
      }
    };

    window.__PRIVY_BRIDGE_FACTORY__ = async () => {
      pushEvent('factory:called');
      return {
        ensureLoggedIn: async ({ interactive } = {}) => {
          pushEvent(`login:${interactive ? 'interactive' : 'silent'}`);
          return { id: 'existing-user' };
        },
        connectSolana: async ({ silent = false } = {}) => {
          pushEvent(`solana:${silent ? 'silent' : 'interactive'}`);
          return {
            address: 'So11111111111111111111111111111111111111112',
            provider: {
              publicKey: {
                toString() {
                  return 'So11111111111111111111111111111111111111112';
                }
              },
              on() {},
              off() {}
            }
          };
        },
        disconnectSolana: async () => {},
        connectEvm: async ({ silent = false } = {}) => {
          pushEvent(`evm:${silent ? 'silent' : 'interactive'}`);
          return {
            address: '0x1111111111111111111111111111111111111111',
            provider: {
              request: async ({ method } = {}) => {
                if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
                  return ['0x1111111111111111111111111111111111111111'];
                }
                if (method === 'eth_chainId') return '0xaa36a7';
                return [];
              }
            },
            executionMode: 'tee',
            isUnifiedWallet: true
          };
        },
        disconnectEvm: async () => {}
      };
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
          loginMethod: 'email',
          enableDefaultBridge: false
        }
      })
    });
  });

  await page.goto('/app');
  await page.waitForFunction(() => typeof window.initWalletClient === 'function');

  await page.evaluate(() => {
    window.__PRIVY_WALLET_BRIDGE__ = null;
    localStorage.setItem('privy:wallet-client-bootstrap-events', JSON.stringify([]));
  });

  const connected = await page.evaluate(async () => {
    const client = window.initWalletClient();
    const solana = await client.connect({ chain: 'solana', silent: false });
    const evm = await client.connect({ chain: 'evm', silent: false });
    return {
      solanaAddress: solana?.address || '',
      evmAddress: evm?.address || '',
      bridgeReady: !!window.__PRIVY_WALLET_BRIDGE__
    };
  });

  expect(connected).toMatchObject({
    solanaAddress: 'So11111111111111111111111111111111111111112',
    evmAddress: '0x1111111111111111111111111111111111111111',
    bridgeReady: true
  });

  const events = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('privy:wallet-client-bootstrap-events') || '[]');
    } catch {
      return [];
    }
  });
  expect(events).toEqual([
    'factory:called',
    'login:silent',
    'solana:interactive',
    'evm:interactive',
  ]);
});

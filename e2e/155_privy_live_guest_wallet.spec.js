const { test, expect } = require('@playwright/test');

const livePrivyAppId = String(process.env.PRIVY_APP_ID || '').trim();
const livePrivyLoginMethod = String(process.env.PRIVY_LOGIN_METHOD || '').trim().toLowerCase();
const privyLiveRequired = /^(1|true|yes|on)$/i.test(String(process.env.PRIVY_LIVE_REQUIRED || '').trim());
const TEST_PRIVY_SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112';
const TEST_PRIVY_EVM_ADDRESS = '0x1111111111111111111111111111111111111111';

async function readOnboardingStatus(page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/onboarding/status', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    return await response.json();
  });
}

async function readLiveWalletSnapshot(page) {
  return await page.evaluate(async () => {
    const client = typeof window.initWalletClient === 'function' ? window.initWalletClient() : null;
    const bridge = window.__PRIVY_WALLET_BRIDGE__ && typeof window.__PRIVY_WALLET_BRIDGE__ === 'object'
      ? window.__PRIVY_WALLET_BRIDGE__
      : null;
    const connect = async (chain) => {
      if (!client || typeof client.connect !== 'function') {
        return { ok: false, error: 'WALLET_CLIENT_UNAVAILABLE' };
      }
      try {
        const result = await client.connect({ chain, silent: false });
        return {
          ok: true,
          address: typeof result?.address === 'string' ? result.address : '',
          executionMode: typeof result?.executionMode === 'string' ? result.executionMode : null,
          isUnifiedWallet: typeof result?.isUnifiedWallet === 'boolean' ? result.isUnifiedWallet : null,
        };
      } catch (err) {
        return {
          ok: false,
          error: String(err?.message || 'UNKNOWN_WALLET_ERROR'),
        };
      }
    };

    return {
      hasWalletClient: !!client,
      hasBridge: !!bridge,
      bridgeFns: {
        connectSolana: typeof bridge?.connectSolana === 'function',
        connectEvm: typeof bridge?.connectEvm === 'function',
      },
      solana: await connect('solana'),
      evm: await connect('evm'),
    };
  });
}

test.describe('live Privy guest wallet smoke', () => {
  test.skip(
    !privyLiveRequired && (!livePrivyAppId || livePrivyLoginMethod !== 'guest'),
    'Live Privy env not configured; default suite skips this optional smoke.'
  );

  test('live Privy guest login redirects to /app, creates wallets, and re-enters without OTP', async ({ page, request }) => {
    test.slow();
    expect(livePrivyAppId, 'Set PRIVY_APP_ID in .env/.env.local before running `npm run test:privy-live`.').toBeTruthy();
    expect(
      livePrivyLoginMethod,
      'Set PRIVY_LOGIN_METHOD=guest for no-OTP Playwright Privy runs.'
    ).toBe('guest');

    const configResponse = await request.get('/api/privy/config');
    expect(configResponse.ok()).toBe(true);
    const configBody = await configResponse.json();
    expect(configBody).toMatchObject({
      ok: true,
      enabled: true,
      startPageEnabled: true,
    });
    expect(String(configBody?.config?.appId || '')).toBe(livePrivyAppId);
    expect(String(configBody?.config?.loginMethod || '')).toBe('guest');
    expect(Boolean(configBody?.config?.testMode)).toBe(false);

    await page.goto('/start');
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Enter' }).click();

    await page.waitForURL(/\/app(?:[?#].*)?$/, { timeout: 60000 });
    await expect(page.locator('#districtMap')).toBeVisible({ timeout: 20000 });
    await page.waitForFunction(() => {
      const bridge = window.__PRIVY_WALLET_BRIDGE__;
      return !!(
        bridge
        && typeof bridge.connectSolana === 'function'
        && typeof bridge.connectEvm === 'function'
      );
    }, { timeout: 15000 });

    const walletSnapshot = await readLiveWalletSnapshot(page);
    expect(walletSnapshot.hasWalletClient).toBe(true);
    expect(walletSnapshot.hasBridge).toBe(true);
    expect(walletSnapshot.bridgeFns).toEqual({
      connectSolana: true,
      connectEvm: true,
    });
    expect(walletSnapshot.solana.ok).toBe(true);
    expect(String(walletSnapshot.solana.address || '')).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,64}$/);
    expect(String(walletSnapshot.solana.address || '')).not.toBe(TEST_PRIVY_SOLANA_ADDRESS);
    expect(walletSnapshot.evm.ok).toBe(true);
    expect(String(walletSnapshot.evm.address || '')).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(String(walletSnapshot.evm.address || '')).not.toBe(TEST_PRIVY_EVM_ADDRESS);

    const onboarding = await readOnboardingStatus(page);
    expect(Number(onboarding?.step || 0)).toBeGreaterThan(1);
    expect(onboarding?.hasWallet).toBe(true);

    await page.goto('/start');
    await page.waitForURL(/\/app(?:[?#].*)?$/, { timeout: 60000 });
    await expect(page.locator('#districtMap')).toBeVisible({ timeout: 20000 });
  });
});

const { test, expect } = require('@playwright/test');

const { readWalletSnapshot } = require('./helpers/email_otp');

const livePrivyAppId = String(process.env.PRIVY_APP_ID || '').trim();
const livePrivyLoginMethod = String(process.env.PRIVY_LOGIN_METHOD || '').trim().toLowerCase();
const liveEmail = String(process.env.PRIVY_EMAIL_OTP_TEST_EMAIL || '').trim();
const liveProvider = String(process.env.PRIVY_EMAIL_OTP_PROVIDER || '').trim().toLowerCase();
const liveFetchUrl = String(process.env.PRIVY_EMAIL_OTP_FETCH_URL || '').trim();
const timeoutMs = Number(process.env.PRIVY_EMAIL_OTP_TIMEOUT_MS || 120000);
const liveRequired = /^(1|true|yes|on)$/i.test(String(process.env.PRIVY_EMAIL_OTP_REQUIRED || '').trim());
const TEST_PRIVY_SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112';
const TEST_PRIVY_EVM_ADDRESS = '0x1111111111111111111111111111111111111111';

function buildFetchUrl(email) {
  const raw = String(liveFetchUrl || '').trim();
  if (!raw) return '';
  if (raw.includes('{email}')) {
    return raw.replaceAll('{email}', encodeURIComponent(email));
  }
  const url = new URL(raw);
  if (!url.searchParams.has('email')) {
    url.searchParams.set('email', email);
  }
  return url.toString();
}

async function fetchEmailOtpCode(email) {
  if (liveProvider !== 'http-json') {
    throw new Error(`EMAIL_OTP_PROVIDER_UNSUPPORTED:${liveProvider || 'missing'}`);
  }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const url = buildFetchUrl(email);
    const response = await fetch(url, { method: 'GET' });
    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      const code = String(payload?.code || '').trim();
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('EMAIL_OTP_TIMEOUT');
}

test.describe('live Privy email wallet smoke', () => {
  test.skip(
    !liveRequired && (!livePrivyAppId || livePrivyLoginMethod !== 'email' || !liveEmail || !liveProvider || !liveFetchUrl),
    'Live Privy email OTP env not configured; default suite skips this optional smoke.'
  );

  test('live Privy email OTP login reaches /app, exposes wallets, and re-enters without another OTP', async ({ page, request }) => {
    test.slow();
    expect(livePrivyAppId, 'Set PRIVY_APP_ID before running `npm run test:privy-email-live`.').toBeTruthy();
    expect(livePrivyLoginMethod).toBe('email');
    expect(liveEmail, 'Set PRIVY_EMAIL_OTP_TEST_EMAIL for the live email login lane.').toBeTruthy();
    expect(liveProvider, 'Set PRIVY_EMAIL_OTP_PROVIDER=http-json for the live email login lane.').toBe('http-json');
    expect(liveFetchUrl, 'Set PRIVY_EMAIL_OTP_FETCH_URL so the suite can fetch the OTP without manual input.').toBeTruthy();

    const configResponse = await request.get('/api/privy/config');
    expect(configResponse.ok()).toBe(true);
    const configBody = await configResponse.json();
    expect(String(configBody?.config?.loginMethod || '')).toBe('email');
    expect(Boolean(configBody?.config?.testMode)).toBe(false);

    await page.goto('/start');
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Enter' }).click();

    await expect(page.locator('#privyEmailForm')).toBeVisible({ timeout: 15000 });
    await page.locator('#privyEmailInput').fill(liveEmail);
    await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();

    const otpCode = await fetchEmailOtpCode(liveEmail);
    expect(otpCode).toHaveLength(6);
    await page.locator('#privyCodeInput').fill(otpCode);
    await page.locator('#privyCodeForm').getByRole('button', { name: 'Verify code' }).click();

    await page.waitForURL(/\/app(?:[?#].*)?$/, { timeout: 60000 });
    await expect(page.locator('#districtMap')).toBeVisible({ timeout: 20000 });

    const walletSnapshot = await readWalletSnapshot(page);
    expect(walletSnapshot.hasWalletClient).toBe(true);
    expect(walletSnapshot.solana.ok).toBe(true);
    expect(String(walletSnapshot.solana.address || '')).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,64}$/);
    expect(String(walletSnapshot.solana.address || '')).not.toBe(TEST_PRIVY_SOLANA_ADDRESS);
    expect(walletSnapshot.evm.ok).toBe(true);
    expect(String(walletSnapshot.evm.address || '')).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(String(walletSnapshot.evm.address || '')).not.toBe(TEST_PRIVY_EVM_ADDRESS);

    await page.goto('/start');
    await page.waitForURL(/\/app(?:[?#].*)?$/, { timeout: 60000 });
    await expect(page.locator('#districtMap')).toBeVisible({ timeout: 20000 });
  });
});

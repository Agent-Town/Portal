const { test, expect } = require('@playwright/test');

const { resetPortalWebState, resetToken } = require('./helpers/portal_web');
const { consumeStubEmailOtp, getStubEmailOtp, getStubEmailOtpActivity, readWalletSnapshot } = require('./helpers/email_otp');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.6: deterministic email OTP adapter issues one code, logs in automatically, exposes both wallets, and rejects replay', async ({ page, request }) => {
  const testEmail = 'otp-stub@example.com';
  const solanaAddress = 'So1anaOtpStub11111111111111111111111111111';
  const evmAddress = '0x1234567890abcdef1234567890ABCDEF12345678';

  await page.addInitScript(({ nextEmail, nextSolanaAddress, nextEvmAddress, testResetToken }) => {
    const saveLoggedInEmail = (email) => {
      try {
        localStorage.setItem('mockPrivyLoggedInEmail', String(email || nextEmail));
      } catch {
        // ignore storage errors in tests
      }
    };
    const readLoggedInEmail = () => {
      try {
        return localStorage.getItem('mockPrivyLoggedInEmail') || '';
      } catch {
        return '';
      }
    };

    window.__PRIVY_BRIDGE_FACTORY__ = async () => ({
      ensureLoggedIn: async ({ interactive, loginUi } = {}) => {
        if (!interactive) {
          const email = readLoggedInEmail();
          return email ? { id: 'stub-user', email } : null;
        }
        const email = await loginUi.requestEmail();
        await fetch('/__test__/otp/email/issue', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            'x-test-reset': testResetToken,
          },
          body: JSON.stringify({
            provider: 'stub',
            email,
          }),
        });
        loginUi.notifyCodeSent({ email });
        const code = await loginUi.requestCode({ email });
        const consumeResponse = await fetch('/__test__/otp/email/consume', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            'x-test-reset': testResetToken,
          },
          body: JSON.stringify({
            provider: 'stub',
            email,
            code,
          }),
        });
        const consumeBody = await consumeResponse.json().catch(() => ({}));
        if (!consumeResponse.ok || consumeBody?.ok === false) {
          const err = new Error(String(consumeBody?.error || 'OTP_CONSUME_FAILED'));
          err.code = String(consumeBody?.error || 'OTP_CONSUME_FAILED');
          throw err;
        }
        saveLoggedInEmail(email);
        return { id: 'stub-user', email };
      },
      connectSolana: async () => ({
        address: nextSolanaAddress,
        provider: {
          request: async () => null,
        },
      }),
      disconnectSolana: async () => {},
      connectEvm: async () => ({
        address: nextEvmAddress,
        provider: {
          request: async () => [],
        },
      }),
      disconnectEvm: async () => {},
    });
  }, {
    nextEmail: testEmail,
    nextSolanaAddress: solanaAddress,
    nextEvmAddress: evmAddress,
    testResetToken: resetToken,
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
          clientId: 'client-mock',
          loginMethod: 'email',
          enableDefaultBridge: false,
        },
      }),
    });
  });

  await page.goto('/start');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.getByTestId('privy-auth-box')).toBeVisible();
  await page.locator('#privyEmailInput').fill(testEmail);
  await page.locator('#privyEmailForm').getByRole('button', { name: 'Send code' }).click();

  const issuedOtp = await getStubEmailOtp(request, { email: testEmail });
  expect(issuedOtp.status).toBe(200);
  expect(String(issuedOtp.body?.record?.email || '')).toBe(testEmail);
  const issuedCode = String(issuedOtp.body?.record?.code || '');
  expect(issuedCode).toHaveLength(6);

  const activityAfterIssue = await getStubEmailOtpActivity(request, { email: testEmail, provider: 'stub' });
  expect(activityAfterIssue.status).toBe(200);
  expect(activityAfterIssue.body?.activity || []).toHaveLength(1);
  expect(activityAfterIssue.body?.activity?.[0]).toMatchObject({
    email: testEmail,
    provider: 'stub',
    consumed: false,
  });

  await page.locator('#privyCodeInput').fill(issuedCode);
  await page.locator('#privyCodeForm').getByRole('button', { name: 'Verify code' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('#districtMap')).toBeVisible();

  const walletSnapshot = await readWalletSnapshot(page);
  expect(walletSnapshot.hasWalletClient).toBe(true);
  expect(walletSnapshot.solana).toMatchObject({
    ok: true,
    address: solanaAddress,
  });
  expect(walletSnapshot.evm).toMatchObject({
    ok: true,
    address: evmAddress,
  });

  const replayAttempt = await consumeStubEmailOtp(request, {
    email: testEmail,
    code: issuedCode,
    provider: 'stub',
  });
  expect(replayAttempt.status).toBe(409);
  expect(String(replayAttempt.body?.error || '')).toBe('OTP_ALREADY_CONSUMED');
});

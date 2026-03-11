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

async function openTownhallPanel(page) {
  const panel = page.locator('#townhallRegisterPanel');
  const townhallVisible = async () => (
    await panel.isVisible()
    || await page.locator('#townhallStepHuman').isVisible()
    || await page.locator('#townhallStepAgent').isVisible()
    || await page.locator('#townhallStepProcessing').isVisible()
  );
  if (await townhallVisible()) return;

  const backdrop = page.locator('#districtModalBackdrop');
  if (await backdrop.isVisible()) {
    const closeBtn = page.locator('#districtModalClose');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await expect(page.locator('#townhallStepHuman')).toBeVisible();
      return;
    }
  }

  if (await townhallVisible()) return;
  const closeBtn = page.locator('#districtModalClose');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
  if (!(await townhallVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
}

async function completeTownhallStory(page, {
  humanName,
  agentName,
  humanPrompt,
  agentPrompt,
}) {
  await expect(page.locator('#townhallStepHuman')).toBeVisible();
  await page.locator('#townhallHumanName').fill(humanName);
  await page.locator('#townhallHumanCustomizeBtn').click();
  await page.locator('#townhallHumanPrompt').fill(humanPrompt);
  await page.getByTestId('townhall-human-submit-btn').click();

  await expect(page.locator('#townhallStepAgent')).toBeVisible();
  await page.locator('#townhallAgentName').fill(agentName);
  await page.locator('#townhallAgentCustomizeBtn').click();
  await page.locator('#townhallAgentPrompt').fill(agentPrompt);
  await page.getByTestId('townhall-agent-submit-btn').click();

  await expect(page.locator('#townhallStepProcessing')).toBeVisible();
}

test.describe('live Privy email wallet smoke', () => {
  test.skip(
    !liveRequired && (!livePrivyAppId || livePrivyLoginMethod !== 'email' || !liveEmail || !liveProvider || !liveFetchUrl),
    'Live Privy email OTP env not configured; default suite skips this optional smoke.'
  );

  test('live Privy email OTP login reaches /app, completes Town Hall minting, and re-enters without another OTP', async ({ page, request }) => {
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
    await expect(page.locator('#privyCodeForm')).toBeVisible({ timeout: 120000 });

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

    const mintConfigResponse = await request.get('/api/townhall/mint/config');
    expect(mintConfigResponse.ok()).toBe(true);
    const mintConfig = await mintConfigResponse.json();
    expect(mintConfig?.mint?.enabled).toBe(true);
    expect(mintConfig?.mint?.pinataEnabled).toBe(true);
    expect(mintConfig?.mint?.evm?.enabled).toBe(true);
    expect(mintConfig?.mint?.solana?.enabled).toBe(true);

    const humanName = 'Robin Live';
    const agentName = 'OpenClaw Live';
    const humanPrompt = 'Pixel portrait of Robin carrying a bronze lantern in Agent Town';
    const agentPrompt = 'Pixel portrait of OpenClaw as a careful town archivist with a map scroll';

    await openTownhallPanel(page);
    await completeTownhallStory(page, {
      humanName,
      agentName,
      humanPrompt,
      agentPrompt,
    });

    await expect(page.locator('#townhallMintUserEvmStatus')).toContainText('Done', { timeout: 240000 });
    await expect(page.locator('#townhallMintUserSolanaStatus')).toContainText('Done', { timeout: 240000 });
    await expect(page.locator('#townhallMintAgentEvmStatus')).toContainText('Done', { timeout: 240000 });
    await expect(page.locator('#townhallMintAgentSolanaStatus')).toContainText('Done', { timeout: 240000 });
    await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 30000 });
    await expect(page.getByTestId('townhall-open-brain-btn')).toBeVisible({ timeout: 30000 });

    const stateResponse = await page.request.get('/api/state');
    expect(stateResponse.ok()).toBe(true);
    const state = await stateResponse.json();
    const onboardingState = state?.onboarding || {};
    const erc8004 = onboardingState?.erc8004 || {};
    const chainId = Number(mintConfig?.mint?.evm?.chainId || 11155111);
    const evmIdPattern = new RegExp(`^${chainId}:[0-9]+$`);
    const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]{32,128}$/;

    expect(onboardingState?.registrationComplete).toBe(true);
    expect(onboardingState?.profile?.humanName).toBe(humanName);
    expect(onboardingState?.profile?.agentName).toBe(agentName);
    expect(onboardingState?.profile?.humanAvatar?.prompt).toBe(humanPrompt);
    expect(onboardingState?.profile?.agentAvatar?.prompt).toBe(agentPrompt);
    expect(String(erc8004?.user?.evm?.id || '')).toMatch(evmIdPattern);
    expect(String(erc8004?.agent?.evm?.id || '')).toMatch(evmIdPattern);
    expect(String(erc8004?.user?.solana?.id || '')).toMatch(/^solana:[1-9A-HJ-NP-Za-km-z]{32,128}$/);
    expect(String(erc8004?.agent?.solana?.id || '')).toMatch(/^solana:[1-9A-HJ-NP-Za-km-z]{32,128}$/);
    expect(String(erc8004?.user?.evm?.txHash || '')).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(String(erc8004?.agent?.evm?.txHash || '')).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(String(erc8004?.user?.solana?.txSig || '')).toMatch(base58Pattern);
    expect(String(erc8004?.agent?.solana?.txSig || '')).toMatch(base58Pattern);

    await page.goto('/start');
    await page.waitForURL(/\/app(?:[?#].*)?$/, { timeout: 60000 });
    await expect(page.locator('#districtMap')).toBeVisible({ timeout: 20000 });

    const onboarding = await readOnboardingStatus(page);
    expect(Number(onboarding?.step || 0)).toBeGreaterThanOrEqual(4);
    expect(onboarding?.hasWallet).toBe(true);

    await openTownhallPanel(page);
    await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 20000 });
    await expect(page.locator('#townhallStepHuman')).toBeHidden();
    await expect(page.locator('#townhallStepAgent')).toBeHidden();
    await expect(page.locator('#townhallStepProcessing')).toBeVisible();
  });
});

const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('hero wallet onboarding path opens setup and runs wallet profile check', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.locator('#connectWalletHeroBtn').click();

  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 1000 });
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await expect(page.locator('#step2')).not.toHaveClass(/disabled/);
});

test('llm mind config is stored locally and restored after reload', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.reload();
  await expect(page.getByTestId('hatch-panel')).toHaveCount(1);
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai');
  await expect(page.getByTestId('lite-llm-model')).toHaveValue('gpt-4o-mini');
  await expect(page.getByTestId('lite-llm-api-key')).toHaveValue('local-test-key');
});

test('returning user auto-connects with saved brain without repeating wallet/brain setup', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const addr = 'So1anaMockToken1111111111111111111111111111';
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => addr } }),
      signMessage: async () => ({ signature: new Uint8Array(64) })
    };
  });

  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  await page.evaluate(() => {
    try {
      delete window.solana;
    } catch {
      window.solana = undefined;
    }
  });
  await page.reload();

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  await expect(page.locator('#step1')).toHaveClass(/done/);
  await expect(page.locator('#step2')).toHaveClass(/done/);
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai');
  await expect(page.getByTestId('lite-llm-model')).toHaveValue('gpt-4o-mini');
  await expect(page.locator('#hatchStatus')).toContainText('Agent ready.');
  await expect(page.locator('#welcomePanel')).toHaveClass(/is-hidden/);
  await expect(page.locator('#townPanel')).not.toHaveClass(/is-hidden/);
});

test('session reset reboots runtime and reconnects OpenClaw Lite with local LLM config', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  const previousTeamCode = await page.evaluate(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return String(state?.teamCode || '');
  });
  expect(previousTeamCode).toMatch(/^TEAM-/);

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  const reset = await page.evaluate(async () => {
    const res = await fetch('/api/session/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await res.json().catch(() => ({}));
    return {
      ok: !!body?.ok,
      teamCode: String(body?.teamCode || '')
    };
  });
  expect(reset.ok).toBe(true);
  expect(reset.teamCode).toMatch(/^TEAM-/);
  expect(reset.teamCode).not.toBe(previousTeamCode);

  await page.waitForFunction(async (oldCode) => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return typeof state?.teamCode === 'string' && state.teamCode !== oldCode;
  }, previousTeamCode, { timeout: 10000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  await expect(page.locator('#liteAgentStatus')).toContainText('Agent connected: OpenClaw Lite', { timeout: 5000 });
  await expect(page.locator('#hatchStatus')).not.toContainText('OpenClaw Lite runtime is starting…', { timeout: 5000 });
});

test('wallet lookup/signature failure does not block brain setup for new onboarding', async ({ page }) => {
  await page.addInitScript(() => {
    const addr = 'So1anaMockToken1111111111111111111111111111';
    window.solana = {
      isPhantom: true,
      connect: async () => ({ publicKey: { toString: () => addr } }),
      signMessage: async () => {
        throw new Error('USER_REJECTED');
      }
    };
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();

  await expect(page.locator('#walletStatus')).toContainText(
    'Wallet signature was cancelled.',
    { timeout: 2000 }
  );
  await expect(page.locator('#step2')).not.toHaveClass(/disabled/);
});

test('experience run no longer hard-fails with hatch-required when llm is configured before setup completion', async ({ page }) => {
  await installMockSolanaWallet(page);

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption('openai');
  await page.getByTestId('lite-llm-model').selectOption('gpt-4o-mini');
  await page.getByTestId('lite-llm-api-key').fill('local-test-key');
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });

  const run = await page.evaluate(async () => {
    return await window.__openclawLiteTest.experienceRun({ prompt: 'Read SKILL.md and do the next step.' });
  });

  if (run?.ok === false) {
    expect(run?.error?.code).not.toBe('HATCH_REQUIRED');
    expect(run?.error?.details?.mode).toBe('agent-turn');
  } else {
    expect(run?.ok).toBe(true);
    expect(run?.data?.mode).toBe('agent-turn');
  }
});

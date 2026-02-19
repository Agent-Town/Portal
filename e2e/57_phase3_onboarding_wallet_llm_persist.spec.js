const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('state endpoint does not emit Secure session cookies in local test mode', async ({ request }) => {
  const resp = await request.get('/api/state', {
    headers: {
      // Simulate reverse-proxy secure forwarding while still on local HTTP.
      'x-forwarded-proto': 'https',
      // Force a missing/invalid session so the server must mint a new cookie.
      cookie: 'et_session=bogus'
    }
  });
  expect(resp.ok()).toBe(true);

  const setCookie = String(resp.headers()['set-cookie'] || '');
  expect(setCookie).toContain('et_session=');
  expect(setCookie).not.toMatch(/;\s*Secure/i);

  const body = await resp.json();
  expect(String(body?.teamCode || '')).toMatch(/^TEAM-/);
});

test('state endpoint restores session via team code hint when cookie is missing', async ({ request }) => {
  const first = await request.get('/api/state', {
    headers: { cookie: 'et_session=missing' }
  });
  expect(first.ok()).toBe(true);
  const firstBody = await first.json();
  const hintedTeamCode = String(firstBody?.teamCode || '');
  expect(hintedTeamCode).toMatch(/^TEAM-/);

  const second = await request.get('/api/state', {
    headers: {
      cookie: 'et_session=missing',
      'x-team-code-hint': hintedTeamCode
    }
  });
  expect(second.ok()).toBe(true);
  const secondBody = await second.json();
  expect(String(secondBody?.teamCode || '')).toBe(hintedTeamCode);

  const third = await request.get('/api/state', {
    headers: {
      cookie: 'et_session=missing',
      'x-team-code-hint': hintedTeamCode
    }
  });
  expect(third.ok()).toBe(true);
  const thirdBody = await third.json();
  expect(String(thirdBody?.teamCode || '')).toBe(hintedTeamCode);
});

test('OpenAI Codex PKCE endpoints start, report status, and exchange code', async ({ request }) => {
  const startResp = await request.post('/api/agent/lite/llm/oauth/openai-codex/start', {
    data: { provider: 'openai-codex', originator: 'playwright' }
  });
  expect(startResp.ok()).toBe(true);
  const started = await startResp.json();
  expect(started?.ok).toBe(true);
  expect(String(started?.attemptId || '')).toMatch(/^ocx_/);
  expect(String(started?.state || '')).toMatch(/^[a-f0-9]{32}$/);
  expect(String(started?.authorizeUrl || '')).toContain('response_type=code');
  expect(String(started?.authorizeUrl || '')).toContain('code_challenge=');

  const statusResp = await request.get(`/api/agent/lite/llm/oauth/openai-codex/status?attemptId=${encodeURIComponent(started.attemptId)}`);
  expect(statusResp.ok()).toBe(true);
  const statusBody = await statusResp.json();
  expect(statusBody?.ok).toBe(true);
  expect(statusBody?.attempt?.status).toBe('pending');
  expect(statusBody?.attempt?.hasCode).toBe(false);

  const exchangeResp = await request.post('/api/agent/lite/llm/oauth/openai-codex/exchange', {
    data: {
      attemptId: started.attemptId,
      callbackInput: 'test-code-pkce'
    }
  });
  expect(exchangeResp.ok()).toBe(true);
  const exchanged = await exchangeResp.json();
  expect(exchanged?.ok).toBe(true);
  expect(String(exchanged?.credential?.provider || '')).toBe('openai-codex');
  expect(String(exchanged?.credential?.access || '')).toMatch(/^eyJ/);
  expect(String(exchanged?.credential?.accountId || '')).toBe('acct_test');
});

test('OpenAI Codex exchange resolves callback state even when attemptId is stale', async ({ request }) => {
  const startA = await request.post('/api/agent/lite/llm/oauth/openai-codex/start', {
    data: { provider: 'openai-codex', originator: 'playwright-state-a' }
  });
  expect(startA.ok()).toBe(true);
  const a = await startA.json();

  const startB = await request.post('/api/agent/lite/llm/oauth/openai-codex/start', {
    data: { provider: 'openai-codex', originator: 'playwright-state-b' }
  });
  expect(startB.ok()).toBe(true);
  const b = await startB.json();

  expect(String(a?.attemptId || '')).not.toBe(String(b?.attemptId || ''));
  expect(String(a?.state || '')).not.toBe(String(b?.state || ''));

  const callbackUrlForA = `http://localhost:1455/auth/callback?code=test-code-state-rebind&state=${encodeURIComponent(String(a?.state || ''))}`;
  const exchangeWithStaleAttemptId = await request.post('/api/agent/lite/llm/oauth/openai-codex/exchange', {
    data: {
      attemptId: b.attemptId,
      callbackInput: callbackUrlForA
    }
  });
  expect(exchangeWithStaleAttemptId.ok()).toBe(true);
  const exchanged = await exchangeWithStaleAttemptId.json();
  expect(exchanged?.ok).toBe(true);
  expect(String(exchanged?.attempt?.id || '')).toBe(String(a?.attemptId || ''));
  expect(String(exchanged?.credential?.access || '')).toMatch(/^eyJ/);
  expect(String(exchanged?.credential?.accountId || '')).toBe('acct_test');
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

test('agent panel brain controls configure provider/model/thinking via the same setup pipeline', async ({ page }) => {
  await installMockSolanaWallet(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('agentTown:panel:minimized', '0');
    } catch {}
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);

  await page.getByTestId('agent-llm-provider').selectOption('openai-codex');
  await page.getByTestId('agent-llm-model').selectOption('gpt-5.3-codex');
  await page.getByTestId('agent-llm-thinking').selectOption('xhigh');
  await page.getByTestId('agent-llm-api-key').fill('local-test-key');
  await page.getByTestId('agent-llm-save').click();

  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai-codex');
  await expect(page.getByTestId('lite-llm-model')).toHaveValue('gpt-5.3-codex');
  await expect(page.locator('#llmThinkingInput')).toHaveValue('xhigh');
  await expect(page.getByTestId('agent-llm-thinking')).toHaveValue('xhigh');
});

test('agent panel brain completes OpenAI PKCE exchange and configures brain', async ({ page }) => {
  await installMockSolanaWallet(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('agentTown:panel:minimized', '0');
    } catch {}
    try {
      window.open = () => ({ closed: false, close() {} });
    } catch {}
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);

  await page.getByTestId('agent-llm-provider').selectOption('openai-codex');
  await page.getByTestId('agent-llm-model').selectOption('gpt-5.3-codex');
  await page.getByTestId('agent-llm-auth').selectOption('oauth-json');
  await page.getByTestId('agent-llm-oauth-complete').waitFor({ state: 'visible', timeout: 2000 });
  await page.locator('#agentLlmOauthLaunchBtn').click();
  await expect(page.getByTestId('agent-llm-status')).toContainText('OAuth started', { timeout: 3000 });

  await page.locator('#agentLlmOauthProfileInput').fill('test-code-agent');
  await page.getByTestId('agent-llm-oauth-complete').click();
  await expect(page.getByTestId('agent-llm-status')).toContainText('OAuth exchange complete', { timeout: 3000 });

  const exchanged = await page.getByTestId('agent-llm-api-key').inputValue();
  expect(exchanged).toMatch(/^eyJ/);
  await page.getByTestId('agent-llm-save').click();

  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain configured.', { timeout: 2000 });
  await expect(page.getByTestId('lite-llm-provider')).toHaveValue('openai-codex');
  await expect(page.getByTestId('lite-llm-api-key')).toHaveValue(exchanged);
});

test('agent panel brain rejects OpenAI id_token callback URLs with clear guidance', async ({ page }) => {
  await installMockSolanaWallet(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('agentTown:panel:minimized', '0');
    } catch {}
  });

  await page.goto('/');
  await page.getByTestId('auth-signup').click();
  await page.getByTestId('hatch-wallet-check').click();
  await expect(page.locator('#walletStatus')).toContainText('Wallet verified. Configure brain.', { timeout: 2000 });
  await page.getByTestId('agent-debug-tab-brain').click();
  await expect(page.getByTestId('agent-debug-panel-brain')).not.toHaveClass(/is-hidden/);

  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(JSON.stringify({
    iss: 'https://auth.openai.com',
    at_hash: 'test-at-hash',
    'https://api.openai.com/auth': { chatgpt_account_id: 'acct_test' },
  })).toString('base64url');
  const idToken = `${jwtHeader}.${jwtPayload}.signature`;
  const callbackUrl = `http://localhost:1455/success?id_token=${encodeURIComponent(idToken)}&needs_setup=false`;

  await page.getByTestId('agent-llm-provider').selectOption('openai-codex');
  await page.getByTestId('agent-llm-model').selectOption('gpt-5.3-codex');
  await page.getByTestId('agent-llm-api-key').fill(callbackUrl);
  await page.getByTestId('agent-llm-save').click();

  await expect(page.getByTestId('lite-llm-status')).toContainText('Brain config failed: Detected OpenAI id_token callback URL.', { timeout: 2000 });
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
  await page.waitForFunction(async () => {
    if (!window.__openclawLiteTest || typeof window.__openclawLiteTest.skillState !== 'function') return false;
    const skill = await window.__openclawLiteTest.skillState().catch(() => null);
    const status = String(skill?.data?.status || skill?.status || '').trim().toLowerCase();
    return status === 'ready';
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

test('agent readiness status tracks skill import failure and recovery', async ({ page }) => {
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

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });
  await expect(page.locator('#hatchStatus')).toContainText('Agent ready.', { timeout: 10000 });

  await page.waitForFunction(() => {
    return !!(window.__openclawLiteTest && typeof window.__openclawLiteTest.visitExperience === 'function');
  }, null, { timeout: 5000 });

  const failedVisit = await page.evaluate(async () => {
    return await window.__openclawLiteTest.visitExperience({ url: 'https://example.invalid/skill.md' });
  });
  expect(failedVisit?.ok).toBe(false);
  expect(failedVisit?.error?.code).toBe('NOT_FOUND');

  await expect(page.locator('#liteAgentStatus')).toContainText('skill import failed', { timeout: 5000 });
  await expect(page.locator('#hatchStatus')).toContainText('Skill import failed.', { timeout: 5000 });

  const recoveredVisit = await page.evaluate(async () => {
    return await window.__openclawLiteTest.visitExperience({ url: '/skill.md' });
  });
  expect(recoveredVisit?.ok).toBe(true);

  await expect(page.locator('#liteAgentStatus')).toContainText('Agent connected: OpenClaw Lite', { timeout: 5000 });
  await expect(page.locator('#hatchStatus')).toContainText('Agent ready.', { timeout: 5000 });
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

test('onboarding visibility stays stable when agent source changes to external after local runtime connect', async ({ page, request }) => {
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

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'openclaw-lite';
  }, null, { timeout: 10000 });

  const session = await request.get('/api/session');
  expect(session.ok()).toBeTruthy();
  const sessionBody = await session.json();
  const teamCode = String(sessionBody?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);

  const externalConnect = await request.post('/api/agent/connect', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode, agentName: 'VisibilityWorker' }
  });
  expect(externalConnect.ok()).toBeTruthy();

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true && state?.agent?.source === 'external';
  }, null, { timeout: 10000 });

  await page.waitForTimeout(2200);
  await expect(page.locator('#townPanel')).not.toHaveClass(/is-hidden/);
  await expect(page.locator('#hatchPanel')).toHaveClass(/is-hidden/);
});

test('human sigil selection stays visible and persisted through town polling updates', async ({ page }) => {
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

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true;
  }, null, { timeout: 10000 });

  await page.getByTestId('sigil-key').click();
  await expect(page.getByTestId('sigil-key')).toHaveClass(/selected/, { timeout: 2000 });

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.human?.selected === 'key';
  }, null, { timeout: 4000 });

  await page.waitForTimeout(2200);
  await expect(page.getByTestId('sigil-key')).toHaveClass(/selected/);
});

test('refresh keeps team session, town panel visibility, and selected sigil', async ({ page }) => {
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

  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.agent?.connected === true;
  }, null, { timeout: 10000 });

  const teamCodeBeforeReload = await page.evaluate(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return String(state?.teamCode || '');
  });
  expect(teamCodeBeforeReload).toMatch(/^TEAM-/);

  await page.getByTestId('sigil-key').click();
  await page.waitForFunction(async () => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.human?.selected === 'key';
  }, null, { timeout: 4000 });

  await page.reload();

  await page.waitForFunction(async (expectedTeamCode) => {
    const stateRes = await fetch('/api/state', { credentials: 'include' });
    const state = await stateRes.json();
    return state?.teamCode === expectedTeamCode && state?.human?.selected === 'key';
  }, teamCodeBeforeReload, { timeout: 10000 });

  await expect(page.locator('#townPanel')).not.toHaveClass(/is-hidden/);
  await expect(page.locator('#hatchPanel')).toHaveClass(/is-hidden/);
  await expect(page.getByTestId('sigil-key')).toHaveClass(/selected/);
});

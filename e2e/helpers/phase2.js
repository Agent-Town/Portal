const { expect } = require('@playwright/test');
const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function fetchSessionState(page) {
  return page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    return resp.json();
  });
}

async function runSkillStep(page, prompt = 'Read SKILL.md and do the next safe step.') {
  return page.evaluate(async (stepPrompt) => {
    const run = window.__openclawLiteTest?.experienceRun;
    if (typeof run === 'function') {
      return await run({ prompt: String(stepPrompt || '') });
    }
    const mod = await import('/openclaw-lite/gateway.js');
    let gateway = mod?.default || mod;
    if (gateway && typeof gateway.then === 'function') gateway = await gateway;
    if (!gateway || typeof gateway.send !== 'function') return null;
    return null;
  }, prompt);
}

async function sessionTeamCode(page) {
  const state = await fetchSessionState(page);
  const teamCode = typeof state?.teamCode === 'string' ? state.teamCode.trim() : '';
  if (!teamCode) throw new Error('MISSING_TEAM_CODE');
  return teamCode;
}

async function postAgentRoute(page, path, body = {}) {
  return page.evaluate(async ({ targetPath, payload }) => {
    const resp = await fetch(targetPath, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    const data = await resp.json().catch(() => ({}));
    return {
      status: resp.status,
      ok: resp.ok,
      body: data
    };
  }, { targetPath: path, payload: body });
}

async function connectAgentViaApi(page, {
  agentName = 'OpenClaw'
} = {}) {
  const teamCode = await sessionTeamCode(page);
  const resp = await postAgentRoute(page, '/api/agent/connect', { teamCode, agentName });
  if (!resp?.ok || !resp?.body?.ok) {
    const reason = String(resp?.body?.error || `HTTP_${resp?.status || 500}`);
    throw new Error(`AGENT_CONNECT_FAILED:${reason}`);
  }
  return { teamCode };
}

async function mirrorSigilViaAgentApi(page, sigil = 'key') {
  const teamCode = await sessionTeamCode(page);
  const resp = await postAgentRoute(page, '/api/agent/select', {
    teamCode,
    elementId: String(sigil || '')
  });
  if (!resp?.ok || !resp?.body?.ok) {
    const reason = String(resp?.body?.error || `HTTP_${resp?.status || 500}`);
    throw new Error(`AGENT_SELECT_FAILED:${reason}`);
  }
  return { teamCode };
}

async function pressOpenViaAgentApi(page) {
  const teamCode = await sessionTeamCode(page);
  const resp = await postAgentRoute(page, '/api/agent/open/press', { teamCode });
  if (!resp?.ok || !resp?.body?.ok) {
    const reason = String(resp?.body?.error || `HTTP_${resp?.status || 500}`);
    throw new Error(`AGENT_OPEN_FAILED:${reason}`);
  }
  return { teamCode };
}

async function isCreateCanvasReady(page) {
  const pixel = page.getByTestId('px-0-0');
  try {
    if (!(await pixel.count())) return false;
    return await pixel.first().isVisible();
  } catch {
    return false;
  }
}

async function ensurePrivyStartEntry(page, { timeout = 10000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = await page.evaluate(async () => {
      const ensureLogin = window.ensurePrivyLogin;
      if (typeof ensureLogin !== 'function') {
        return { ready: false, ok: false };
      }
      try {
        const ok = await ensureLogin({ interactive: true });
        if (ok) {
          const bridge = window.__PRIVY_WALLET_BRIDGE__;
          if (bridge && typeof bridge.connectSolana === 'function') {
            await bridge.connectSolana({ silent: true }).catch(() => null);
          }
        }
        return { ready: true, ok: ok === true };
      } catch (error) {
        return {
          ready: true,
          ok: false,
          code: String(error?.code || error?.message || 'PRIVY_LOGIN_FAILED')
        };
      }
    }).catch(() => ({ ready: false, ok: false }));

    if (result?.ready && result?.ok) {
      return true;
    }
    if (result?.ready && result?.code && result.code !== 'PRIVY_BRIDGE_INIT_FAILED') {
      throw new Error(result.code);
    }
    await page.waitForTimeout(150);
  }
  return false;
}

async function ensureAppShell(page, { navigate = true } = {}) {
  if (navigate) {
    await page.goto('/');
  }

  const districtMap = page.locator('#districtMap');
  const mapVisible = async () => {
    if (!(await districtMap.count())) return false;
    try {
      return await districtMap.first().isVisible();
    } catch {
      return false;
    }
  };
  if (await mapVisible()) return;

  const enterBtn = page.locator('#enterBtn');
  let attemptedEnter = false;
  if (await enterBtn.count()) {
    const target = enterBtn.first();
    try {
      if (await target.isVisible()) {
        attemptedEnter = true;
        const enteredViaPrivy = await ensurePrivyStartEntry(page).catch(() => false);
        if (enteredViaPrivy) {
          await page.goto('/app');
        } else {
          await Promise.all([
            page.waitForURL((url) => {
              try {
                const pathname = new URL(String(url)).pathname;
                return pathname === '/app';
              } catch {
                return false;
              }
            }, { timeout: 5000 }).catch(() => {}),
            target.click()
          ]);
        }
      }
    } catch {
      // ignore test-only start screen timing races
    }
  }

  if (!(await mapVisible()) && attemptedEnter) {
    try {
      await expect.poll(async () => {
        return await mapVisible();
      }, { timeout: 6000 }).toBe(true);
    } catch {
      // fall through to direct /app fallback
    }
  }

  if (!(await mapVisible())) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const pathname = await page.evaluate(() => window.location.pathname).catch(() => '');
      if (pathname === '/' || pathname === '/start') {
        await ensurePrivyStartEntry(page).catch(() => false);
      }
      await page.goto('/app', { waitUntil: 'domcontentloaded' }).catch(() => {});
      try {
        await expect.poll(async () => {
          return await mapVisible();
        }, { timeout: 2500 }).toBe(true);
        break;
      } catch {
        await page.waitForTimeout(200);
      }
    }
  }
  await expect(districtMap).toBeVisible({ timeout: 5000 });
}

async function ensureHouseDistrictVisible(page, { requireSigils = false } = {}) {
  await ensureAppShell(page, { navigate: false });
  const state = await fetchSessionState(page).catch(() => null);
  const onboardingStep = String(state?.onboarding?.step || '').trim().toLowerCase();
  const targetDistrict = onboardingStep === 'brain'
    ? 'brain'
    : onboardingStep === 'sigil'
      ? 'sigil'
      : 'house';
  const modalVisible = page.locator('#districtModalBackdrop:not(.is-hidden)');
  const houseSpot = page.locator('.townDistrictHotspot[data-district="house"]');
  const sigilGrid = page.getByTestId('sigil-grid');
  const pathHuman = page.getByTestId('path-human');
  const llmProvider = page.getByTestId('lite-llm-provider');
  const modalTitle = page.locator('#districtModalTitle');
  const titleMatches = async () => {
    const text = await modalTitle.first().textContent().catch(() => '');
    if (targetDistrict === 'brain') return /connect brain/i.test(String(text || ''));
    if (targetDistrict === 'sigil') return /sigil/i.test(String(text || ''));
    return /plan wagons/i.test(String(text || ''));
  };
  const houseContentVisible = async () => {
    if (targetDistrict === 'brain') {
      return await llmProvider.isVisible().catch(() => false);
    }
    if (requireSigils) {
      return await sigilGrid.isVisible().catch(() => false);
    }
    if (await pathHuman.isVisible().catch(() => false)) return true;
    if (await sigilGrid.isVisible().catch(() => false)) return true;
    return false;
  };

  if (await houseContentVisible()) {
    return;
  }

  if (targetDistrict === 'house') {
    await expect(houseSpot).toBeVisible({ timeout: 4000 });
    await houseSpot.first().click({ force: true });
    if (!(await modalVisible.count())) {
      await page.evaluate(() => {
        const target = document.querySelector('.townDistrictHotspot[data-district="house"]');
        if (target instanceof HTMLElement) target.click();
      });
    }
  } else {
    await page.goto(`/app?district=${encodeURIComponent(targetDistrict)}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await ensureAppShell(page, { navigate: false });
  }

  await expect(modalVisible).toHaveCount(1, { timeout: 5000 });
  const body = page.locator('#districtModalBody');
  await expect(body).not.toHaveClass(/is-loading/, { timeout: 5000 });
  await expect.poll(async () => {
    return await titleMatches();
  }, { timeout: 5000 }).toBe(true);
  if (targetDistrict === 'brain') {
    await expect(llmProvider).toBeVisible({ timeout: 5000 });
    return;
  }
  if (requireSigils) {
    await expect(sigilGrid).toBeVisible({ timeout: 5000 });
  } else {
    await expect.poll(async () => {
      return await houseContentVisible();
    }, { timeout: 5000 }).toBe(true);
  }
}

async function ensureAgentPanelExpanded(page) {
  const sidebar = page.locator('#agentSidebar');
  if (!(await sidebar.count())) return;
  const isMinimized = await sidebar.evaluate((node) => node.classList.contains('minimized')).catch(() => false);
  if (!isMinimized) return;

  const header = page.locator('#agentSidebar .sidebar-header');
  if (!(await header.count())) return;
  const target = header.first();
  if (!(await target.isVisible())) return;
  await target.click();
  await expect(sidebar).not.toHaveClass(/minimized/, { timeout: 2000 });
}

async function ensureBrainPanelVisible(page) {
  await ensureAgentPanelExpanded(page);
  const debugToggle = page.getByTestId('agent-debug-toggle');
  if (await debugToggle.count()) {
    const target = debugToggle.first();
    const expanded = String(await target.getAttribute('aria-expanded').catch(() => 'false')) === 'true';
    if (!expanded && await target.isVisible().catch(() => false)) {
      await target.click();
    }
  }
  const brainTab = page.getByTestId('agent-debug-tab-brain');
  if (await brainTab.count()) {
    const target = brainTab.first();
    if (await target.isVisible()) {
      await target.click();
    }
  }
  const brainPanel = page.getByTestId('agent-debug-panel-brain');
  if (await brainPanel.count()) {
    await expect(brainPanel).not.toHaveClass(/is-hidden/, { timeout: 2000 }).catch(() => {});
  }
}

async function ensureLiteTestApi(page, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const ready = await page.evaluate(async () => {
      if (window.__openclawLiteTest && typeof window.__openclawLiteTest.setLlmConfig === 'function') {
        return true;
      }
      try {
        const mod = await import('/openclaw-lite/gateway.js');
        let gateway = mod?.default || mod;
        if (gateway && typeof gateway.then === 'function') gateway = await gateway;
      } catch {
        // retry until timeout; app shell boot can lag behind modal-first entry.
      }
      return !!(window.__openclawLiteTest && typeof window.__openclawLiteTest.setLlmConfig === 'function');
    }).catch(() => false);
    if (ready) return true;
    await page.waitForTimeout(150);
  }
  return false;
}

async function ensurePrivyReadyForPhase2(page) {
  const state = await fetchSessionState(page).catch(() => null);
  if (!state?.onboarding || state.onboarding.required !== true || state.onboarding.registrationComplete === true) {
    return false;
  }

  const result = await page.evaluate(async ({ token }) => {
    const wallets = [];
    const seen = new Set();
    const addWallet = (chain, address) => {
      const normalizedChain = typeof chain === 'string' ? chain.trim().toLowerCase() : '';
      const normalizedAddress = typeof address === 'string' ? address.trim() : '';
      if (!normalizedChain || !normalizedAddress) return;
      const key = `${normalizedChain}:${normalizedAddress}`;
      if (seen.has(key)) return;
      seen.add(key);
      wallets.push({ chain: normalizedChain, address: normalizedAddress });
    };

    const bridge = window.__PRIVY_WALLET_BRIDGE__;
    if (bridge && typeof bridge.connectSolana === 'function') {
      try {
        const sol = await bridge.connectSolana({ silent: true });
        addWallet('solana', sol && typeof sol.address === 'string' ? sol.address : '');
      } catch {
        // ignore silent mock wallet probe failures
      }
    }
    if (bridge && typeof bridge.connectEvm === 'function') {
      try {
        const evm = await bridge.connectEvm({ silent: true });
        addWallet('evm', evm && typeof evm.address === 'string' ? evm.address : '');
      } catch {
        // ignore silent mock wallet probe failures
      }
    }

    const resp = await fetch('/__test__/session/bootstrap-onboarding', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': token
      },
      body: JSON.stringify({ wallets })
    });
    const body = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      status: resp.status,
      body
    };
  }, { token: resetToken });

  if (!result?.ok) {
    throw new Error(`PRIVY_ONBOARDING_BOOTSTRAP_FAILED:${result?.status || 500}:${JSON.stringify(result?.body || {})}`);
  }

  const verify = await page.evaluate(async () => {
    const resp = await fetch('/api/state', {
      credentials: 'include'
    });
    const body = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      body
    };
  });
  if (!verify?.ok || verify?.body?.onboarding?.registrationComplete !== true) {
    throw new Error(`PRIVY_ONBOARDING_BOOTSTRAP_STATE_MISMATCH:${JSON.stringify({
      bootstrap: result?.body || {},
      state: verify?.body || {}
    })}`);
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#districtMap')).toBeVisible({ timeout: 5000 });
  return true;
}

async function ensurePrivySignupForCreate(page) {
  const state = await fetchSessionState(page).catch(() => null);
  if (!state?.onboarding || state.onboarding.required !== true || state?.signup?.complete === true) {
    return false;
  }

  const result = await page.evaluate(async ({ token }) => {
    let tokenAddress = '';
    const bridge = window.__PRIVY_WALLET_BRIDGE__;
    if (bridge && typeof bridge.connectSolana === 'function') {
      try {
        const sol = await bridge.connectSolana({ silent: true });
        tokenAddress = sol && typeof sol.address === 'string' ? sol.address.trim() : '';
      } catch {
        // ignore silent mock wallet probe failures
      }
    }
    const mode = tokenAddress ? 'token' : 'agent';
    const resp = await fetch('/__test__/session/bootstrap-signup', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': token
      },
      body: JSON.stringify({
        mode,
        address: tokenAddress
      })
    });
    const body = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      status: resp.status,
      body
    };
  }, { token: resetToken });

  if (!result?.ok) {
    throw new Error(`PRIVY_SIGNUP_BOOTSTRAP_FAILED:${result?.status || 500}:${JSON.stringify(result?.body || {})}`);
  }

  const verify = await page.evaluate(async () => {
    const resp = await fetch('/api/state', {
      credentials: 'include'
    });
    const body = await resp.json().catch(() => ({}));
    return {
      ok: resp.ok,
      body
    };
  });
  if (!verify?.ok || verify?.body?.signup?.complete !== true) {
    throw new Error(`PRIVY_SIGNUP_BOOTSTRAP_STATE_MISMATCH:${JSON.stringify({
      bootstrap: result?.body || {},
      state: verify?.body || {}
    })}`);
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  const afterReload = await fetchSessionState(page).catch(() => null);
  if (!afterReload?.signup?.complete) {
    throw new Error(`PRIVY_SIGNUP_BOOTSTRAP_RELOAD_MISMATCH:${JSON.stringify({
      bootstrap: result?.body || {},
      beforeReload: verify?.body || {},
      afterReload: afterReload || {}
    })}`);
  }
  return true;
}

async function primePrivyRecoveryStorage(page) {
  await page.evaluate(async () => {
    const sessionResp = await fetch('/api/session', {
      credentials: 'include'
    });
    const session = await sessionResp.json().catch(() => ({}));
    if (typeof session?.teamCode === 'string' && session.teamCode.trim()) {
      localStorage.setItem('agentTown:teamCodeHint', session.teamCode.trim());
    }
    if (typeof session?.walletRecoveryKey === 'string' && /^wrk_[a-f0-9]{64}$/i.test(session.walletRecoveryKey.trim())) {
      localStorage.setItem('agentTown:walletRecoveryKey', session.walletRecoveryKey.trim().toLowerCase());
    }

    let solanaAddress = '';
    const bridge = window.__PRIVY_WALLET_BRIDGE__;
    if (bridge && typeof bridge.connectSolana === 'function') {
      try {
        const sol = await bridge.connectSolana({ silent: true });
        solanaAddress = sol && typeof sol.address === 'string' ? sol.address.trim() : '';
      } catch {
        // ignore silent mock wallet probe failures
      }
    }
    if (solanaAddress) {
      localStorage.setItem('agentTown:walletIdentityHint', JSON.stringify({ solana: solanaAddress }));
      localStorage.setItem('agentTownWallet', JSON.stringify({ address: solanaAddress, houseId: null }));
    }
  });
}

async function enterHatch(page, intent = 'signin', { navigate = true } = {}) {
  await ensureAppShell(page, { navigate });
  await ensurePrivyReadyForPhase2(page);

  const legacyAuthBtn = page.getByTestId(`auth-${intent}`);
  if (await legacyAuthBtn.count()) {
    const target = legacyAuthBtn.first();
    if (await target.isVisible()) {
      await target.click();
      const legacyHatchPanel = page.getByTestId('hatch-panel');
      if (await legacyHatchPanel.count()) {
        await expect(legacyHatchPanel).toBeVisible({ timeout: 1500 });
        return;
      }
    }
  }

  await ensureHouseDistrictVisible(page);

  const hatchPanel = page.getByTestId('hatch-panel');
  if (await hatchPanel.count()) {
    await expect(hatchPanel).toBeVisible({ timeout: 1500 });
  } else {
    const pathPanel = page.locator('#pathPanel');
    if (await pathPanel.count()) {
      await expect(pathPanel).toBeVisible({ timeout: 1500 });
    } else {
      await expect(page.getByTestId('skill-link')).toBeVisible({ timeout: 3000 });
    }
  }
}

async function completeHatch(page) {
  const hatchPanel = page.getByTestId('hatch-panel');
  if (await hatchPanel.count()) {
    await expect(hatchPanel).toBeVisible({ timeout: 1000 });
  } else {
    await ensureHouseDistrictVisible(page);
  }

  const btn = page.getByTestId('hatch-btn');
  if (await btn.count()) {
    const target = btn.first();
    if (await target.isVisible()) {
      await target.click();
    }
  }

  const status = page.getByTestId('hatch-status');
  if (await status.count()) {
    await expect(status).toContainText(/continue|setup|configure|ready|connect|complete|activated/i, { timeout: 2000 });
  } else {
    const setupStatus = page.locator('#walletStatus');
    if (await setupStatus.count()) {
      await expect(setupStatus.first()).toBeVisible({ timeout: 2000 });
    }
  }
}

async function configureLiteLlm(page, {
  provider = 'test-local',
  model = 'deterministic',
  apiKey = 'phase2-test-key'
} = {}) {
  await ensureAppShell(page, { navigate: false });
  await ensureHouseDistrictVisible(page).catch(() => {});
  await ensureBrainPanelVisible(page);
  const liteTestApiReady = await ensureLiteTestApi(page);
  const hasDomLlmForm = await page.evaluate(() => {
    return !!(
      document.getElementById('llmProviderSelect')
      && document.getElementById('llmModelIdInput')
      && document.getElementById('llmKeyInput')
      && document.getElementById('llmSaveBtn')
    );
  }).catch(() => false);

  const hasVisibleBrainPanel = await page.getByTestId('lite-llm-panel').isVisible().catch(() => false);
  if (hasDomLlmForm) {
    await page.evaluate(({ desiredProvider, desiredModel, desiredApiKey }) => {
      const providerInput = document.getElementById('llmProviderSelect');
      const modelInput = document.getElementById('llmModelIdInput');
      const keyInput = document.getElementById('llmKeyInput');
      const saveBtn = document.getElementById('llmSaveBtn');
      if (!(providerInput instanceof HTMLSelectElement)) throw new Error('LLM_PROVIDER_INPUT_MISSING');
      if (!(modelInput instanceof HTMLSelectElement || modelInput instanceof HTMLInputElement)) throw new Error('LLM_MODEL_INPUT_MISSING');
      if (!(keyInput instanceof HTMLInputElement)) throw new Error('LLM_API_KEY_INPUT_MISSING');
      if (!(saveBtn instanceof HTMLElement)) throw new Error('LLM_SAVE_BUTTON_MISSING');

      providerInput.value = desiredProvider;
      providerInput.dispatchEvent(new Event('change', { bubbles: true }));

      if (modelInput instanceof HTMLSelectElement) {
        const hasDesired = Array.from(modelInput.options || []).some((opt) => opt.value === desiredModel);
        if (!hasDesired) {
          const option = document.createElement('option');
          option.value = desiredModel;
          option.textContent = desiredModel;
          modelInput.appendChild(option);
        }
        modelInput.value = desiredModel;
      } else {
        modelInput.value = desiredModel;
      }
      modelInput.dispatchEvent(new Event('input', { bubbles: true }));
      modelInput.dispatchEvent(new Event('change', { bubbles: true }));

      keyInput.value = desiredApiKey;
      keyInput.dispatchEvent(new Event('input', { bubbles: true }));
      saveBtn.click();
    }, {
      desiredProvider: provider,
      desiredModel: model,
      desiredApiKey: apiKey
    });
    await expect.poll(async () => {
      const state = await fetchSessionState(page);
      return !!state?.lite?.llmConfigured;
    }, { timeout: 8000 }).toBe(true);
    return;
  }

  if (!hasVisibleBrainPanel) {
    if (!liteTestApiReady) {
      throw new Error('LITE_LLM_TEST_API_MISSING');
    }
    await page.evaluate(async ({ desiredProvider, desiredModel, desiredApiKey }) => {
      const api = window.__openclawLiteTest;
      if (!api || typeof api.setLlmConfig !== 'function') {
        throw new Error('LITE_LLM_TEST_API_MISSING');
      }
      await api.setLlmConfig({
        provider: desiredProvider,
        modelId: desiredModel,
        modelRef: `${desiredProvider}/${desiredModel}`,
        api: 'openai-completions',
        apiKey: desiredApiKey,
        useProxy: true
      });
    }, {
      desiredProvider: provider,
      desiredModel: model,
      desiredApiKey: apiKey
    });
    await page.evaluate(async ({ desiredProvider, desiredModel }) => {
      const resp = await fetch('/api/agent/lite/llm/config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: desiredProvider,
          model: desiredModel,
          modelRef: `${desiredProvider}/${desiredModel}`,
          authMode: 'api-key',
          hasCredential: true
        })
      });
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(String(payload?.error || `HTTP_${resp.status}`));
      }
    }, {
      desiredProvider: provider,
      desiredModel: model
    });
    await expect.poll(async () => {
      const state = await fetchSessionState(page);
      return !!state?.lite?.llmConfigured;
    }, { timeout: 5000 }).toBe(true);
    return;
  }

  await expect(page.getByTestId('lite-llm-provider')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-llm-model')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-llm-api-key')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-llm-save')).toBeVisible({ timeout: 2000 });

  const providerInput = page.getByTestId('lite-llm-provider');
  const modelInput = page.getByTestId('lite-llm-model');
  await providerInput.selectOption(provider);
  await modelInput.evaluate((node, desired) => {
    const select = node;
    if (!select || typeof select.querySelectorAll !== 'function') return;
    const hasDesired = Array.from(select.querySelectorAll('option')).some((opt) => opt.value === desired);
    if (hasDesired) return;
    const option = document.createElement('option');
    option.value = desired;
    option.textContent = desired;
    select.appendChild(option);
  }, model);
  await modelInput.selectOption(model);
  await page.getByTestId('lite-llm-api-key').fill(apiKey);
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText(/configured|saved|ready|connected|brain/i, { timeout: 3000 });
}

async function ensureLiteConnected(page) {
  const connectBtn = page.getByTestId('lite-agent-connect');
  if (await connectBtn.count()) {
    if (await connectBtn.first().isVisible()) {
      await connectBtn.first().click();
    }
  }

  try {
    await expect.poll(async () => {
      const state = await fetchSessionState(page);
      return !!state?.agent?.connected;
    }, { timeout: 5000 }).toBe(true);
  } catch {
    await page.evaluate(async () => {
      const resp = await fetch('/api/agent/lite/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(String(payload?.error || `HTTP_${resp.status}`));
      }
    });
    await expect.poll(async () => {
      const state = await fetchSessionState(page);
      return !!state?.agent?.connected;
    }, { timeout: 8000 }).toBe(true);
  }

  const statusCandidates = [
    page.getByTestId('lite-agent-status'),
    page.getByTestId('agent-status'),
    page.locator('#liteAgentStatus'),
    page.locator('#agentStatusText')
  ];
  for (const locator of statusCandidates) {
    if (!(await locator.count())) continue;
    const target = locator.first();
    if (!(await target.isVisible())) continue;
    await expect(target).toContainText(/connected|ready|openclaw/i, { timeout: 5000 });
    break;
  }
}

async function hatchAndConnectLite(page, intent = 'signin') {
  await enterHatch(page, intent);
  await completeHatch(page);
  await configureLiteLlm(page);
  await ensureLiteConnected(page);
  await ensureHouseDistrictVisible(page, { requireSigils: true });
}

async function unlockGateWithSigil(page, sigil = 'key') {
  const sigilBtn = page.getByTestId(`sigil-${sigil}`);
  if (!(await sigilBtn.count()) || !(await sigilBtn.first().isVisible().catch(() => false))) {
    await ensureHouseDistrictVisible(page, { requireSigils: true });
  }
  await expect(sigilBtn).toBeVisible({ timeout: 3000 });
  await sigilBtn.click();
  for (let i = 0; i < 4; i += 1) {
    const unlocked = await page.getByTestId('match-status').textContent();
    if ((unlocked || '').includes('UNLOCKED')) break;
    const run = await runSkillStep(page, 'Read SKILL.md and mirror the human sigil selection.');
    if (run?.ok === false && String(run?.error?.code || '').toUpperCase() === 'LLM_RUN_FAILED') {
      break;
    }
    await page.waitForTimeout(180);
  }
  const stillLocked = !((await page.getByTestId('match-status').textContent()) || '').includes('UNLOCKED');
  if (stillLocked) {
    await mirrorSigilViaAgentApi(page, sigil);
  }
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED', { timeout: 3000 });
  await expect(page.getByTestId('open-btn')).toBeEnabled();
}

async function openToCreate(page) {
  await page.getByTestId('open-btn').click();
  for (let i = 0; i < 4; i += 1) {
    if (await isCreateCanvasReady(page)) return;
    if (page.url().includes('/create')) break;
    const run = await runSkillStep(page, 'Read SKILL.md and press Open after the human has pressed Open.');
    if (run?.ok === false && String(run?.error?.code || '').toUpperCase() === 'LLM_RUN_FAILED') {
      break;
    }
    await page.waitForTimeout(180);
  }
  if (!(await isCreateCanvasReady(page)) && !page.url().includes('/create')) {
    await pressOpenViaAgentApi(page);
  }
  if (!(await isCreateCanvasReady(page)) && !page.url().includes('/create')) {
    const createLink = page.locator('#openReady a[href="/create"]');
    if (await createLink.count()) {
      const target = createLink.first();
      if (await target.isVisible()) {
        await target.click();
      }
    }
  }
  if (!(await isCreateCanvasReady(page))) {
    await ensurePrivySignupForCreate(page);
    await primePrivyRecoveryStorage(page);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await page.goto('/create', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(150);
      if (await isCreateCanvasReady(page)) return;
    }
  }
  const createReady = await isCreateCanvasReady(page);
  if (!createReady) {
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(100);
    const state = await fetchSessionState(page).catch(() => null);
    const recovery = await page.evaluate(() => ({
      teamCodeHint: localStorage.getItem('agentTown:teamCodeHint'),
      walletRecoveryKey: localStorage.getItem('agentTown:walletRecoveryKey'),
      walletIdentityHint: localStorage.getItem('agentTown:walletIdentityHint'),
      walletCache: localStorage.getItem('agentTownWallet'),
    })).catch(() => null);
    throw new Error(`CREATE_ROUTE_NOT_READY:${JSON.stringify({
      url: page.url(),
      signup: state?.signup || null,
      onboarding: state?.onboarding || null,
      recovery,
    })}`);
  }
}

async function reachCreateViaLite(page) {
  await hatchAndConnectLite(page, 'signup');
  await unlockGateWithSigil(page, 'key');
  await openToCreate(page);
}

async function triggerWalletProfileCheck(page) {
  await ensureHouseDistrictVisible(page).catch(() => {});
  const candidates = [
    page.getByTestId('hatch-wallet-check'),
    page.locator('#hatchWalletCheckBtn'),
    page.getByTestId('hatch-wallet-connect'),
    page.getByRole('button', { name: /Check wallet/i }),
    page.getByRole('button', { name: /Connect wallet/i }),
    page.locator('#connectWalletBtn')
  ];
  for (const locator of candidates) {
    const count = await locator.count();
    if (!count) continue;
    const target = locator.first();
    if (!(await target.isVisible())) continue;
    await target.click();
    return;
  }
  throw new Error('NO_HATCH_WALLET_TRIGGER');
}

function attachPathRecorder(page, paths) {
  const wanted = new Set(paths);
  const calls = [];
  page.on('request', (req) => {
    const pathname = new URL(req.url()).pathname;
    if (!wanted.has(pathname)) return;
    calls.push({
      pathname,
      method: req.method(),
      atMs: Date.now(),
      postData: req.postData()
    });
  });
  return calls;
}

function isExternalRequest(url) {
  try {
    const parsed = new URL(url);
    if (['data:', 'about:', 'blob:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    return !(host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]');
  } catch {
    return false;
  }
}

module.exports = {
  fetchSessionState,
  ensureAppShell,
  ensureHouseDistrictVisible,
  ensureAgentPanelExpanded,
  ensureBrainPanelVisible,
  ensurePrivyReadyForPhase2,
  enterHatch,
  completeHatch,
  configureLiteLlm,
  ensureLiteConnected,
  hatchAndConnectLite,
  connectAgentViaApi,
  mirrorSigilViaAgentApi,
  pressOpenViaAgentApi,
  unlockGateWithSigil,
  openToCreate,
  reachCreateViaLite,
  triggerWalletProfileCheck,
  attachPathRecorder,
  isExternalRequest
};

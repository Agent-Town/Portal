const { expect } = require('@playwright/test');
const { DEFAULT_TEST_TOKEN_ADDRESS } = require('./phase1');
const { selectStartPreset } = require('./experience');

const TEST_TOWNHALL_MINT_IDS = {
  userEvm: '11155111:456',
  userSolana: 'solana:user-asset-789',
  agentEvm: '11155111:457',
  agentSolana: 'solana:agent-asset-790'
};

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

async function isHouseRoute(page) {
  return /\/house(?:\?|$)/.test(String(page.url() || ''));
}

async function waitForHouseRoute(page, timeout = 2000) {
  if (await isHouseRoute(page)) return true;
  try {
    await page.waitForURL((url) => /\/house(?:\?|$)/.test(String(url || '')), { timeout });
    return true;
  } catch {
    return await isHouseRoute(page);
  }
}

async function waitForWalletCheckProgress(page, {
  priorStatus = '',
  timeout = 2500
} = {}) {
  const walletStatus = page.locator('#walletStatus');
  try {
    await expect.poll(async () => {
      if (await isHouseRoute(page)) return 'house';
      if (await walletStatus.count()) {
        const nextStatus = String((await walletStatus.first().textContent().catch(() => '')) || '').trim();
        if (nextStatus && nextStatus !== String(priorStatus || '').trim()) return 'status';
      }
      return 'wait';
    }, { timeout }).not.toBe('wait');
    return true;
  } catch {
    return await isHouseRoute(page);
  }
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
  if (await enterBtn.count()) {
    const target = enterBtn.first();
    try {
      if (await target.isVisible()) {
        await selectStartPreset(page, 'global-default');
        await Promise.all([
          page.waitForURL((url) => {
            try {
              const pathname = new URL(String(url)).pathname;
              return pathname === '/app' || pathname === '/';
            } catch {
              return false;
            }
          }, { timeout: 5000 }).catch(() => {}),
          target.click()
        ]);
      }
    } catch {
      // ignore test-only start screen timing races
    }
  }

  if (!(await mapVisible())) {
    await page.goto('/app');
  }
  await expect(districtMap).toBeVisible({ timeout: 5000 });
}

async function ensureHouseDistrictVisible(page) {
  const modalVisible = page.locator('#districtModalBackdrop:not(.is-hidden)');
  const houseSpot = page.locator('.townDistrictHotspot[data-district="house"]');

  if (!(await modalVisible.count())) {
    await expect(houseSpot).toBeVisible({ timeout: 4000 });
    await houseSpot.first().click({ force: true });
    if (!(await modalVisible.count())) {
      await page.evaluate(() => {
        const target = document.querySelector('.townDistrictHotspot[data-district="house"]');
        if (target instanceof HTMLElement) target.click();
      });
    }
  }

  await expect(modalVisible).toHaveCount(1, { timeout: 5000 });
  const body = page.locator('#districtModalBody');
  await expect(body).not.toHaveClass(/is-loading/, { timeout: 5000 });
}

async function ensureTownhallDistrictVisible(page) {
  const townhallVisible = async () => {
    const candidates = [
      page.locator('#townhallStepHuman'),
      page.locator('#townhallStepAgent'),
      page.locator('#townhallStepProcessing'),
      page.getByTestId('townhall-single-path-note'),
      page.locator('#step1Panel'),
      page.locator('#step2Panel')
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      if (!count) continue;
      if (await locator.first().isVisible().catch(() => false)) return true;
    }
    return false;
  };

  if (await isHouseRoute(page)) return;
  if (await townhallVisible()) return;

  const backdrop = page.locator('#districtModalBackdrop');
  if (await backdrop.isVisible().catch(() => false)) {
    const closeBtn = page.locator('#districtModalClose');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }
  }

  if (await isHouseRoute(page)) return;
  if (await townhallVisible()) return;

  const openTownhallBtn = page.getByRole('button', { name: /Open Town Hall/i });
  if (await openTownhallBtn.count()) {
    const target = openTownhallBtn.first();
    if (await target.isVisible().catch(() => false)) {
      await target.click();
    }
  }

  if (!(await townhallVisible()) && !(await isHouseRoute(page))) {
    const townhallSpot = page.locator('.townDistrictHotspot[data-district="townhall"]');
    if (await townhallSpot.count()) {
      await townhallSpot.first().click({ force: true }).catch(() => {});
    }
  }

  await expect.poll(async () => {
    if (await isHouseRoute(page)) return 'house';
    if (await townhallVisible()) return 'townhall';
    return 'wait';
  }, { timeout: 8000 }).not.toBe('wait');

  if (await isHouseRoute(page)) return;
  const body = page.locator('#districtModalBody');
  if (await body.count()) {
    await expect(body).not.toHaveClass(/is-loading/, { timeout: 5000 }).catch(() => {});
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
  const brainTab = page.getByTestId('agent-debug-tab-brain');
  if (await brainTab.count()) {
    const target = brainTab.first();
    if (await target.isVisible()) {
      await target.click();
    }
  }
  const brainPanel = page.getByTestId('agent-debug-panel-brain');
  if (await brainPanel.count()) {
    await expect(brainPanel).not.toHaveClass(/is-hidden/, { timeout: 2000 });
  }
}

async function enterHatch(page, intent = 'signin', { navigate = true } = {}) {
  await ensureAppShell(page, { navigate });
  if (await isHouseRoute(page)) return;

  const legacyAuthBtn = page.getByTestId(`auth-${intent}`);
  if (await legacyAuthBtn.count()) {
    const target = legacyAuthBtn.first();
    if (await target.isVisible().catch(() => false)) {
      await target.click();
      const legacyHatchPanel = page.getByTestId('hatch-panel');
      if (await legacyHatchPanel.count()) {
        await expect(legacyHatchPanel).toBeVisible({ timeout: 1500 });
        return;
      }
    }
  }

  await ensureTownhallDistrictVisible(page);
  await expect.poll(async () => {
    if (await isHouseRoute(page)) return 'house';
    const candidates = [
      page.locator('#townhallStepHuman'),
      page.locator('#townhallStepAgent'),
      page.locator('#townhallStepProcessing'),
      page.getByTestId('townhall-single-path-note'),
      page.locator('#step1Panel'),
      page.locator('#step2Panel')
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      if (!count) continue;
      if (await locator.first().isVisible().catch(() => false)) return 'townhall';
    }
    return 'wait';
  }, { timeout: 5000 }).not.toBe('wait');
}

async function completeHatch(page) {
  const hatchPanel = page.getByTestId('hatch-panel');
  if (await hatchPanel.count()) {
    await expect(hatchPanel).toBeVisible({ timeout: 1000 });
    const btn = page.getByTestId('hatch-btn');
    if (await btn.count()) {
      const target = btn.first();
      if (await target.isVisible().catch(() => false)) {
        await target.click();
      }
    }
    const status = page.getByTestId('hatch-status');
    if (await status.count()) {
      await expect(status).toContainText(/continue|setup|configure|ready|connect|complete|activated/i, { timeout: 2000 });
    }
    return;
  }

  await ensureTownhallDistrictVisible(page);
}

async function completeTownhallStory(page, {
  humanName = 'Robin',
  agentName = 'OpenClaw',
  humanPrompt = 'Human prompt text',
  agentPrompt = 'Agent prompt text'
} = {}) {
  await ensureTownhallDistrictVisible(page);

  const stateBefore = await fetchSessionState(page).catch(() => null);
  if (stateBefore?.onboarding?.registrationComplete === true) {
    return;
  }

  const connectWalletBtn = page.getByRole('button', { name: /Connect wallet|Disconnect wallet/i });
  if (await connectWalletBtn.count()) {
    const target = connectWalletBtn.first();
    if (await target.isVisible().catch(() => false)) {
      const label = String((await target.textContent().catch(() => '')) || '');
      if (/connect/i.test(label)) {
        await target.click().catch(() => {});
      }
    }
  }

  const walletAddrNode = page.locator('#walletAddr');
  let solanaAddress = DEFAULT_TEST_TOKEN_ADDRESS;
  if (await walletAddrNode.count()) {
    const raw = String((await walletAddrNode.first().textContent().catch(() => '')) || '').trim();
    if (raw && raw !== '—') solanaAddress = raw;
  }

  const registerResp = await postAgentRoute(page, '/api/townhall/register', {
    profile: {
      humanName,
      agentName,
      humanAvatar: { prompt: humanPrompt },
      agentAvatar: { prompt: agentPrompt }
    },
    erc8004: {
      user: {
        evm: { id: TEST_TOWNHALL_MINT_IDS.userEvm, chain: 'sepolia' },
        solana: { id: TEST_TOWNHALL_MINT_IDS.userSolana, cluster: 'devnet' }
      },
      agent: {
        evm: { id: TEST_TOWNHALL_MINT_IDS.agentEvm, chain: 'sepolia' },
        solana: { id: TEST_TOWNHALL_MINT_IDS.agentSolana, cluster: 'devnet' }
      }
    },
    wallet: {
      chain: 'solana',
      address: solanaAddress
    }
  });
  if (!registerResp?.ok || !registerResp?.body?.ok) {
    const reason = String(registerResp?.body?.error || `HTTP_${registerResp?.status || 500}`);
    throw new Error(`TOWNHALL_REGISTER_FAILED:${reason}`);
  }

  await page.reload();
  await ensureTownhallDistrictVisible(page);
  await expect(page.locator('#townhallRegisterState')).toContainText('Registered', { timeout: 5000 });
}

async function configureLiteLlm(page, {
  provider = 'test-local',
  model = 'deterministic',
  apiKey = 'phase2-test-key'
} = {}) {
  await ensureBrainPanelVisible(page);

  await expect(page.getByTestId('lite-llm-panel')).toBeVisible({ timeout: 2000 });
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

  await expect.poll(async () => {
    const state = await fetchSessionState(page);
    return !!state?.agent?.connected;
  }, { timeout: 12000 }).toBe(true);

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
  await completeTownhallStory(page);
  await configureLiteLlm(page);
  await ensureLiteConnected(page);

  const continueBtn = page.getByTestId('townhall-continue-btn');
  const sigilKeyBtn = page.getByTestId('sigil-key');
  await expect.poll(async () => {
    if (await sigilKeyBtn.count() && await sigilKeyBtn.first().isVisible().catch(() => false)) return 'sigil';
    if (
      await continueBtn.count()
      && await continueBtn.first().isVisible().catch(() => false)
      && await continueBtn.first().isEnabled().catch(() => false)
    ) return 'continue';
    return 'wait';
  }, { timeout: 10000 }).not.toBe('wait');

  const readyState = await (async () => {
    if (await sigilKeyBtn.count() && await sigilKeyBtn.first().isVisible().catch(() => false)) return 'sigil';
    if (
      await continueBtn.count()
      && await continueBtn.first().isVisible().catch(() => false)
      && await continueBtn.first().isEnabled().catch(() => false)
    ) return 'continue';
    return 'wait';
  })();

  if (readyState === 'continue') {
    await continueBtn.first().click();
  }
  await expect(sigilKeyBtn).toBeVisible({ timeout: 5000 });
}

async function unlockGateWithSigil(page, sigil = 'key') {
  const sigilBtn = page.getByTestId(`sigil-${sigil}`);
  if (!(await sigilBtn.count()) || !(await sigilBtn.first().isVisible().catch(() => false))) {
    await ensureTownhallDistrictVisible(page);
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
    if (page.url().includes('/create')) break;
    const run = await runSkillStep(page, 'Read SKILL.md and press Open after the human has pressed Open.');
    if (run?.ok === false && String(run?.error?.code || '').toUpperCase() === 'LLM_RUN_FAILED') {
      break;
    }
    await page.waitForTimeout(180);
  }
  if (!page.url().includes('/create')) {
    await pressOpenViaAgentApi(page);
  }
  if (!page.url().includes('/create')) {
    const createLink = page.locator('#openReady a[href="/create"]');
    if (await createLink.count()) {
      const target = createLink.first();
      if (await target.isVisible()) {
        await target.click();
      }
    }
  }
  if (!page.url().includes('/create')) {
    await page.goto('/create');
  }
  await page.waitForURL('**/create', { timeout: 10000 });
}

async function reachCreateViaLite(page) {
  await hatchAndConnectLite(page, 'signup');
  await unlockGateWithSigil(page, 'key');
  await openToCreate(page);
}

async function triggerWalletProfileCheck(page) {
  if (await isHouseRoute(page)) return;
  await ensureTownhallDistrictVisible(page).catch(() => {});
  if (await isHouseRoute(page)) return;

  const walletStatus = page.locator('#walletStatus');
  const priorStatus = await (async () => {
    if (!(await walletStatus.count())) return '';
    return String((await walletStatus.first().textContent().catch(() => '')) || '').trim();
  })();

  const candidates = [
    page.getByTestId('hatch-wallet-check'),
    page.locator('#hatchWalletCheckBtn'),
    page.getByTestId('hatch-wallet-connect'),
    page.getByRole('button', { name: /Check wallet/i }),
    page.getByRole('button', { name: /Connect wallet/i }),
    page.locator('#connectWalletBtn')
  ];
  for (const locator of candidates) {
    if (await isHouseRoute(page)) return;
    const count = await locator.count().catch(() => 0);
    if (!count) continue;
    const target = locator.first();
    if (!(await target.isVisible().catch(() => false))) continue;

    const enabled = await target.isEnabled().catch(() => false);
    if (!enabled) {
      if (await waitForWalletCheckProgress(page, { priorStatus, timeout: 2500 })) return;
      continue;
    }

    try {
      await target.click({ timeout: 1500 });
      return;
    } catch (error) {
      if (await waitForWalletCheckProgress(page, { priorStatus, timeout: 2500 })) return;
      throw error;
    }
  }
  if (await waitForHouseRoute(page, 2500)) return;
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

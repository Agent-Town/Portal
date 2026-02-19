const { expect } = require('@playwright/test');

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

async function enterHatch(page, intent = 'signin') {
  await page.goto('/');
  await page.getByTestId(`auth-${intent}`).click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 500 });
}

async function completeHatch(page) {
  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 1000 });
  const btn = page.getByTestId('hatch-btn');
  if (await btn.count()) {
    const target = btn.first();
    if (await target.isVisible()) {
      await target.click();
    }
  }
  await expect(page.getByTestId('hatch-status')).toContainText(/continue|setup|configure|ready|connect|complete|activated/i, { timeout: 2000 });
}

async function configureLiteLlm(page, {
  provider = 'test-local',
  model = 'deterministic',
  apiKey = 'phase2-test-key'
} = {}) {
  await expect(page.getByTestId('lite-llm-panel')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-llm-provider')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-llm-model')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-llm-api-key')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-llm-save')).toBeVisible({ timeout: 2000 });

  await page.getByTestId('lite-llm-provider').selectOption(provider);
  await page.getByTestId('lite-llm-model').selectOption(model);
  await page.getByTestId('lite-llm-api-key').fill(apiKey);
  await page.getByTestId('lite-llm-save').click();
  await expect(page.getByTestId('lite-llm-status')).toContainText(/configured|saved|ready/i, { timeout: 2000 });
}

async function ensureLiteConnected(page) {
  const connectBtn = page.getByTestId('lite-agent-connect');
  if (await connectBtn.count()) {
    if (await connectBtn.first().isVisible()) {
      await connectBtn.first().click();
    }
  }
  await expect(page.getByTestId('lite-agent-status')).toContainText(/connected/i, { timeout: 7000 });
}

async function hatchAndConnectLite(page, intent = 'signin') {
  await enterHatch(page, intent);
  await completeHatch(page);
  await configureLiteLlm(page);
  await ensureLiteConnected(page);
}

async function unlockGateWithSigil(page, sigil = 'key') {
  await page.getByTestId(`sigil-${sigil}`).click();
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
  await page.waitForURL('**/create', { timeout: 4000 });
}

async function reachCreateViaLite(page) {
  await hatchAndConnectLite(page, 'signup');
  await unlockGateWithSigil(page, 'key');
  await openToCreate(page);
}

async function triggerWalletProfileCheck(page) {
  const candidates = [
    page.getByTestId('hatch-wallet-check'),
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

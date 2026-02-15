const { expect } = require('@playwright/test');

async function fetchSessionState(page) {
  return page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    return resp.json();
  });
}

async function enterHatch(page, intent = 'signin') {
  await page.goto('/');
  await page.getByTestId(`auth-${intent}`).click();
  await expect(page.getByTestId('hatch-panel')).toBeVisible({ timeout: 500 });
}

async function completeHatch(page) {
  await page.getByTestId('hatch-btn').click();
  await expect(page.getByTestId('hatch-status')).toContainText(/complete|hatched|ready/i, { timeout: 2000 });
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
  await expect(page.getByTestId('lite-agent-status')).toContainText(/connected/i, { timeout: 2000 });
}

async function hatchAndConnectLite(page, intent = 'signin') {
  await enterHatch(page, intent);
  await completeHatch(page);
  await configureLiteLlm(page);
  await ensureLiteConnected(page);
}

async function unlockGateWithSigil(page, sigil = 'key') {
  await page.getByTestId(`sigil-${sigil}`).click();
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED', { timeout: 3000 });
  await expect(page.getByTestId('open-btn')).toBeEnabled();
}

async function openToCreate(page) {
  await page.getByTestId('open-btn').click();
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
  unlockGateWithSigil,
  openToCreate,
  reachCreateViaLite,
  triggerWalletProfileCheck,
  attachPathRecorder,
  isExternalRequest
};

const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { enterHatch, triggerWalletProfileCheck, connectAgentViaApi, configureLiteLlm } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const DIR = '/tmp/portal-screenshots';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

/**
 * Helper: enter the app first (without onboarding gate), then inject
 * onboarding state and trigger a UI refresh so the gate activates.
 */
async function enterThenActivateOnboarding(page, step, extras = {}) {
  await enterHatch(page, 'signup');
  await page.waitForTimeout(800);

  // Now intercept /api/state to inject onboarding
  await page.route('**/api/state', async (route) => {
    let json;
    try {
      const response = await route.fetch();
      json = await response.json();
    } catch {
      json = { ok: true };
    }
    if (!json.onboarding) json.onboarding = {};
    json.onboarding.required = true;
    json.onboarding.registrationComplete = step !== 'townhall_profile';
    json.onboarding.step = step;
    if (extras.llmConfigured) {
      if (!json.lite) json.lite = {};
      json.lite.llmConfigured = true;
    }
    if (extras.signupComplete) {
      if (!json.signup) json.signup = {};
      json.signup.complete = true;
    }
    await route.fulfill({ body: JSON.stringify(json) });
  });

  // Trigger a state poll so lastState picks up the intercepted onboarding state
  await page.evaluate(async () => {
    const state = await (await fetch('/api/state', { credentials: 'include' })).json();
    if (typeof window.updateUI === 'function') await window.updateUI(state);
  });
  await page.waitForTimeout(800);

  // Open the district for this step — triggers stepper render
  const districtForStep = {
    townhall_profile: 'townhall',
    brain: 'brain',
    sigil: 'sigil',
    ceremony: 'ceremony'
  };
  await page.evaluate((d) => window.showDistrict(d), districtForStep[step] || 'townhall');
  await page.waitForTimeout(step === 'ceremony' ? 3000 : 1500);
}

async function openAppThenActivateOnboarding(page, step, extras = {}) {
  await page.route('**/api/state', async (route) => {
    let json;
    try {
      const response = await route.fetch();
      json = await response.json();
    } catch {
      json = { ok: true };
    }
    if (!json.onboarding) json.onboarding = {};
    json.onboarding.required = true;
    json.onboarding.registrationComplete = step !== 'townhall_profile';
    json.onboarding.step = step;
    if (extras.llmConfigured) {
      if (!json.lite) json.lite = {};
      json.lite.llmConfigured = true;
    }
    if (extras.signupComplete) {
      if (!json.signup) json.signup = {};
      json.signup.complete = true;
    }
    await route.fulfill({ body: JSON.stringify(json) });
  });

  await page.goto('/app');
  await page.waitForTimeout(1000);

  const districtForStep = {
    townhall_profile: 'townhall',
    brain: 'brain',
    sigil: 'sigil',
    ceremony: 'ceremony'
  };
  await page.evaluate(async (d) => {
    const state = await (await fetch('/api/state', { credentials: 'include' })).json();
    if (typeof window.updateUI === 'function') await window.updateUI(state);
    if (typeof window.showDistrict === 'function') await window.showDistrict(d);
  }, districtForStep[step] || 'townhall');
  await page.waitForTimeout(step === 'ceremony' ? 3000 : 1500);
}

test('stepper renders at townhall step with step 1 active', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'townhall_profile');

  const stepperNodes = page.locator('.onboarding-stepper-node');
  await expect(stepperNodes).toHaveCount(4, { timeout: 5000 });

  await expect(page.locator('[data-testid="stepper-step-townhall_profile"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-testid="stepper-step-brain"]')).not.toHaveClass(/is-active/);

  const labels = await page.locator('.onboarding-stepper-label').allTextContents();
  expect(labels).toEqual(['Profile', 'Brain', 'Sigil', 'House']);

  await page.screenshot({ path: `${DIR}/privy_01_stepper_townhall.png` });
});

test('stepper shows brain as active with townhall complete', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'brain');

  await expect(page.getByTestId('brain-connect-illustration')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#brainTierFree')).toBeVisible({ timeout: 3000 });

  const stepperNodes = page.locator('.onboarding-stepper-node');
  await expect(stepperNodes).toHaveCount(4, { timeout: 3000 });

  await expect(page.locator('[data-testid="stepper-step-townhall_profile"]')).toHaveClass(/is-complete/);
  await expect(page.locator('[data-testid="stepper-step-brain"]')).toHaveClass(/is-active/);

  const checkmark = page.locator('[data-testid="stepper-step-townhall_profile"] .onboarding-stepper-circle');
  await expect(checkmark).toContainText('✓');

  await page.screenshot({ path: `${DIR}/privy_02_stepper_brain.png` });
});

test('registration completion swaps the open townhall modal into brain config', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'townhall_profile');
  await page.unroute('**/api/state');
  await page.route('**/api/state', async (route) => {
    let json;
    try {
      const response = await route.fetch();
      json = await response.json();
    } catch {
      json = { ok: true };
    }
    json.onboarding = {
      ...(json.onboarding || {}),
      required: true,
      registrationComplete: true,
      step: 'brain'
    };
    if (!json.lite) json.lite = {};
    json.lite.llmConfigured = false;
    await route.fulfill({ body: JSON.stringify(json) });
  });

  await page.evaluate(async () => {
    const state = await (await fetch('/api/state', { credentials: 'include' })).json();
    if (typeof window.updateUI === 'function') await window.updateUI(state);
  });

  await expect(page.locator('#brainTierFree')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="stepper-step-brain"]')).toHaveClass(/is-active/);
  await expect(page.locator('#townhallRegisterPanel')).toHaveCount(0);
});

test('agent dock auto-expands at brain step', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'brain');

  // syncTownhallGate runs via poll — wait for it
  await page.waitForTimeout(1500);

  const dock = page.locator('#agentSidebar');
  const isMinimized = await dock.evaluate(el => el.classList.contains('minimized'));
  expect(isMinimized).toBe(false);

  await page.screenshot({ path: `${DIR}/privy_03_dock_expanded.png` });
});

test('sigil grid: 40px icons, explainer, picks, stepper at step 3', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'sigil', { llmConfigured: true });

  await expect(page.locator('#agentSidebar')).toBeVisible({ timeout: 5000 });
  const sigilIcons = page.locator('.sigilIcon');
  await expect(sigilIcons.first()).toBeVisible({ timeout: 5000 });
  expect(await sigilIcons.count()).toBeGreaterThanOrEqual(4);

  const fontSize = await sigilIcons.first().evaluate(el => getComputedStyle(el).fontSize);
  expect(fontSize).toBe('40px');

  await expect(page.locator('.sigil-explainer')).toBeVisible();
  expect(await page.locator('.sigil-picks').count()).toBeGreaterThanOrEqual(4);

  await expect(page.locator('[data-testid="stepper-step-sigil"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-testid="stepper-step-brain"]')).toHaveClass(/is-complete/);

  await page.screenshot({ path: `${DIR}/privy_04_sigil_grid.png` });
});

test('the gated /app sigil route triggers the live worker loop after brain setup', async ({ page }) => {
  await installMockSolanaWallet(page);
  await openAppThenActivateOnboarding(page, 'sigil', { llmConfigured: true });
  await configureLiteLlm(page, {
    provider: 'test-local',
    model: 'deterministic',
    apiKey: 'phase2-test-key'
  });
  await connectAgentViaApi(page, { agentName: 'OpenClaw Lite' });
  await page.evaluate(async () => {
    const mod = await import('/openclaw-lite/gateway.js');
    let gateway = mod?.default || mod;
    if (gateway && typeof gateway.then === 'function') gateway = await gateway;
    const original = typeof gateway?.experienceRun === 'function'
      ? gateway.experienceRun.bind(gateway)
      : null;
    window.__appSigilExperienceRunCalls = 0;
    if (original) {
      gateway.experienceRun = async (...args) => {
        window.__appSigilExperienceRunCalls += 1;
        return await original(...args);
      };
    }
  });

  await page.evaluate(async () => {
    const state = await (await fetch('/api/state', { credentials: 'include' })).json();
    if (typeof window.updateUI === 'function') await window.updateUI(state);
  });

  await expect(page.getByTestId('worker-reconnect-btn')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('sigil-key').click();

  await expect.poll(() => page.evaluate(() => window.__appSigilExperienceRunCalls || 0), { timeout: 12000 }).toBeGreaterThan(0);
});

test('ceremony embeds /create?embed=1 iframe with stepper at step 4', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'ceremony', { llmConfigured: true, signupComplete: true });

  const iframe = page.locator('.districtFrame');
  const frame = page.frameLocator('.districtFrame');
  await expect(iframe).toBeVisible({ timeout: 5000 });
  expect(await iframe.getAttribute('src')).toContain('/create?embed=1');

  await expect(page.locator('[data-testid="stepper-step-ceremony"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-testid="stepper-step-townhall_profile"]')).toHaveClass(/is-complete/);
  await expect(page.locator('[data-testid="stepper-step-brain"]')).toHaveClass(/is-complete/);
  await expect(page.locator('[data-testid="stepper-step-sigil"]')).toHaveClass(/is-complete/);
  await expect(frame.getByTestId('create-ceremony-illustration')).toBeVisible();
  await expect(frame.getByTestId('create-ceremony-explainer')).toBeVisible();
  await expect(frame.getByText('You and your agent are moving into your house')).toBeVisible();
  await expect(frame.getByText('Paint a few pixels to add your side of the house key.')).toBeVisible();
  await expect(frame.getByText('Your agent creates the matching side in the background.')).toBeVisible();
  await expect(frame.getByText('When both sides come together, the joined key opens your house.')).toBeVisible();

  await page.screenshot({ path: `${DIR}/privy_05_ceremony_embed.png` });
});

test('ceremony postMessage closes modal', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'ceremony', { llmConfigured: true, signupComplete: true });

  await expect(page.locator('.districtFrame')).toBeVisible({ timeout: 5000 });

  await page.unroute('**/api/state');

  await page.evaluate(() => {
    window.postMessage({ type: 'agenttown:ceremony-complete', houseId: 'test-house-abc' }, '*');
  });
  await page.waitForTimeout(2000);

  const isHidden = await page.locator('#districtModalBackdrop').evaluate(el => el.classList.contains('is-hidden'));
  expect(isHidden).toBe(true);

  await page.screenshot({ path: `${DIR}/privy_06_ceremony_complete.png` });
});

test('direct house route stays on Plan Wagons when a house exists despite stale ceremony step', async ({ page }) => {
  await installMockSolanaWallet(page);
  const houseId = 'StaleCeremonyHouse111111111111111111111111111';

  await page.route('**/api/state', async (route) => {
    let json;
    try {
      const response = await route.fetch();
      json = await response.json();
    } catch {
      json = { ok: true };
    }
    json.authenticated = true;
    json.onboarding = {
      ...(json.onboarding || {}),
      required: true,
      registrationComplete: true,
      step: 'ceremony'
    };
    json.lite = {
      ...(json.lite || {}),
      llmConfigured: true
    };
    json.signup = {
      ...(json.signup || {}),
      complete: true
    };
    json.ceremony = {
      ...(json.ceremony || {}),
      houseId
    };
    json.houseId = houseId;
    await route.fulfill({ body: JSON.stringify(json) });
  });

  await page.goto('/app?district=house');
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Plan Wagons');
  await expect(page.getByTestId('house-platform-illustration')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#townhallRegisterPanel')).toHaveCount(0);
  await expect(page.locator('.districtFrame')).toHaveCount(0);

  await page.waitForTimeout(1800);
  await expect(page.locator('#districtModalTitle')).toHaveText('Plan Wagons');
  await expect(page.getByTestId('house-platform-illustration')).toBeVisible();
  await expect(page.locator('#townhallRegisterPanel')).toHaveCount(0);
});

test('townhall char count and inline validation', async ({ page }) => {
  await installMockSolanaWallet(page);
  await enterThenActivateOnboarding(page, 'townhall_profile');

  const nameInput = page.locator('#townhallHumanName');
  await expect(nameInput).toBeVisible({ timeout: 3000 });

  await nameInput.fill('TestHero');
  await page.waitForTimeout(200);
  await expect(page.locator('#townhallHumanNameCount')).toContainText('8 / 48');
  await page.screenshot({ path: `${DIR}/privy_07_charcount.png` });

  await nameInput.fill('');
  await nameInput.blur();
  await page.waitForTimeout(200);
  await expect(page.locator('#townhallHumanNameError')).toContainText('Name is required');
  await page.screenshot({ path: `${DIR}/privy_08_validation.png` });

  await nameInput.fill('Hero');
  await page.waitForTimeout(200);
  await expect(page.locator('#townhallHumanNameError')).toHaveText('');
});

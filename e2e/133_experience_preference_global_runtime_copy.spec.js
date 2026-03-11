const { test, expect } = require('@playwright/test');
const { seedExperiencePreference, buildPreference } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('global-default keeps app runtime and debug shell copy in English', async ({ page }) => {
  const preference = buildPreference('global-default');

  await seedExperiencePreference(page, 'global-default');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        lite: { driver: 'vendor', lastError: '' },
        agent: { connected: false, source: 'openclaw-lite' },
        signup: { complete: false, mode: 'agent' },
        experiencePreference: preference,
      }),
    });
  });

  await page.goto('/');

  await expect(page.locator('#agentPanelTitle')).toHaveText('Agent Comms');
  await expect(page.locator('#chatInput')).toHaveAttribute('placeholder', 'Message agent...');
  await expect(page.locator('#agentDebugTabTraffic')).toHaveText('Worker Traffic');
  await expect(page.locator('#agentDebugRefreshBtn')).toHaveText('Refresh');
  await expect(page.locator('#agentDebugToggleBtn')).toHaveAttribute('title', 'Toggle debug panel');
  await expect(page.locator('#agentPanelZoomInBtn')).toHaveAttribute('title', /Increase panel size/);
});

test('global-default keeps deep debug headings and mint runtime errors in English', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  await seedExperiencePreference(page, 'global-default');

  await page.goto('/app?liteDriver=phase1');
  await page.waitForFunction(() => !!window.__openclawLiteTest, null, { timeout: 10000 });

  await page.evaluate(async () => {
    await window.__openclawLiteTest.visitExperience({ url: '/skill.md' });
  });

  await page.getByTestId('agent-debug-tab-session').click();
  await page.locator('#agentDebugRefreshBtn').click();

  const sessionPane = page.getByTestId('agent-debug-session');
  await expect(sessionPane).toContainText('Transcript integrity (repair-sensitive):', { timeout: 8000 });
  await expect(sessionPane).toContainText('Worker session context (authoritative for LLM input):', { timeout: 8000 });
  await expect(sessionPane).toContainText('System prompt preview:', { timeout: 8000 });

  const mintMessages = await page.evaluate(() => ({
    solana: window.knownMintErrorMessage({ message: 'PRIVY_WALLET_RPC_SIGN_UNAVAILABLE' }, 'solana'),
    evm: window.knownMintErrorMessage({ message: 'MINT_EVM_SPONSORED_TIMEOUT' }, 'evm'),
  }));
  expect(mintMessages.solana).toBe('Privy signer is unavailable for sponsored Solana send.');
  expect(mintMessages.evm).toBe('Privy sponsored Sepolia transaction timed out before confirmation.');
});

test('global-default keeps share creation ceremony errors on the house page in English', async ({ page }) => {
  const preference = buildPreference('global-default');

  await seedExperiencePreference(page, 'global-default');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        houseId: 'house-en-runtime',
        lite: { driver: 'vendor' },
        signup: { complete: true, mode: 'agent' },
        share: null,
        shareApproval: { human: false, agent: false },
        experiencePreference: preference,
      })
    });
  });
  await page.route('**/api/share/by-house/**', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'NOT_FOUND' })
    });
  });
  await page.route('**/api/share/create', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'AGENT_REQUIRED' })
    });
  });

  await page.goto('/house');
  await expect(page.locator('#createShareBtn')).toBeEnabled();
  await page.locator('#createShareBtn').click();

  await expect(page.locator('#shareError')).toHaveText('Agent approval required. Ask your agent to reconnect to this house.');
  await expect(page.locator('#shareRequirement')).toHaveText('Waiting on agent approval. Ask them to reconnect to this house.');
});

test('global-default keeps deep house runtime errors in English', async ({ page }) => {
  const preference = buildPreference('global-default');

  await seedExperiencePreference(page, 'global-default');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        houseId: 'house-en-runtime-errors',
        lite: { driver: 'vendor' },
        signup: { complete: true, mode: 'agent' },
        experiencePreference: preference,
      })
    });
  });

  await page.goto('/house');
  await page.evaluate(() => {
    window.setError('AG0_SDK_NOT_BUNDLED');
  });
  await expect(page.locator('#error')).toHaveText('ERC-8004 minting is disabled until the local Agent0 SDK bundle is built.');

  await page.evaluate(() => {
    window.setPublicMediaError('PUBLIC_PROMPT_REQUIRED');
  });
  await expect(page.locator('#publicUploadError')).toHaveText('Enter the public image prompt before publishing.');
});

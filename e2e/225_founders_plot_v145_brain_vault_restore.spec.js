const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame,
  placeFirstLumberCamp
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

const walletHeaders = {
  'x-wallet-chain': 'solana',
  'x-wallet-address': 'So1anaMockToken1111111111111111111111111111'
};

const wrongWalletHeaders = {
  'x-wallet-chain': 'solana',
  'x-wallet-address': 'So1anaMockToken2222222222222222222222222222'
};

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('V1.4.5 Brain vault restores encrypted Brain config on a fresh wallet browser before Real Clover starts', async ({ browser, request }) => {
  test.setTimeout(45_000);
  const secret = 'sk-vault-secret-abc12345';
  const passphrase = 'correct horse vault staple';

  const contextA = await browser.newContext({ extraHTTPHeaders: walletHeaders });
  const pageA = await contextA.newPage();
  const frameA = await openFoundersPlotFrame(pageA);

  const placed = await placeFirstLumberCamp(frameA, 'v145:vault:lumber');
  expect(placed?.ok).toBe(true);
  await advancePlot(frameA, 31_000);
  let state = await getPlotState(frameA);
  expect(state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP')).toBe(true);

  const brainStatus = await frameA.evaluate(async ({ apiKey }) => {
    const lib = await import('/openclaw-lite/llm-config-library.js');
    await lib.saveLlmConfig({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey,
      authMode: 'api-key',
      useProxy: true
    });
    return await window.__foundersPlotTest.refreshBrainStatus();
  }, { apiKey: secret });
  expect(brainStatus.configured).toBe(true);
  expect(brainStatus.realReady).toBe(true);

  const savedVault = await frameA.evaluate(async ({ phrase }) => {
    return await window.__foundersPlotTest.backupBrainVaultForTest(phrase, {
      agentBackup: {
        schemaVersion: 1,
        agentName: 'Clover',
        packRefs: ['skill.md', 'heartbeat.md', 'tools.md', 'goals.md'],
        memorySummary: 'Clover remembers the first lumber camp.',
        checkpointSummary: 'First town setup checkpoint.',
        safeSettings: {
          standingOrder: 'protect_reserves'
        },
        migration: {
          from: 'v1',
          to: 'v1'
        }
      }
    });
  }, { phrase: passphrase });
  expect(savedVault.ok).toBe(true);
  expect(JSON.stringify(savedVault)).not.toContain(secret);
  await contextA.close();

  const sameWalletVaultResp = await request.get('/api/agent/lite/brain-vault?includeSealed=1', {
    headers: walletHeaders
  });
  expect(sameWalletVaultResp.ok()).toBeTruthy();
  const sameWalletVault = await sameWalletVaultResp.json();
  expect(sameWalletVault.vault.available).toBe(true);
  expect(sameWalletVault.vault.ciphertext.ct).toBeTruthy();
  expect(JSON.stringify(sameWalletVault)).not.toContain(secret);
  expect(sameWalletVault.vault.agentBackup).toEqual(expect.objectContaining({
    schemaVersion: 1,
    agentName: 'Clover',
    migration: expect.objectContaining({ from: 'v1', to: 'v1' }),
    restoredActsAutomatically: false
  }));

  const wrongWalletVaultResp = await request.get('/api/agent/lite/brain-vault?includeSealed=1', {
    headers: wrongWalletHeaders
  });
  expect(wrongWalletVaultResp.ok()).toBeTruthy();
  const wrongWalletVault = await wrongWalletVaultResp.json();
  expect(wrongWalletVault.vault.available).toBe(false);
  expect(JSON.stringify(wrongWalletVault)).not.toContain('gpt-4o-mini');

  const contextB = await browser.newContext({ extraHTTPHeaders: walletHeaders });
  const pageB = await contextB.newPage();
  const frameB = await openFoundersPlotFrame(pageB);

  state = await getPlotState(frameB);
  expect(state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP')).toBe(true);

  const emptyBrain = await frameB.evaluate(() => window.__foundersPlotTest.getBrainStatus());
  expect(emptyBrain.configured).toBe(false);
  await frameB.evaluate(async () => window.__foundersPlotTest.refreshBrainVaultStatus());
  await frameB.evaluate(() => window.__foundersPlotTest.openDrawer('foreman'));
  await expect(frameB.getByTestId('brain-vault-restore-prompt')).toBeVisible();
  await expect(frameB.locator('body')).not.toContainText(secret);

  await frameB.getByTestId('brain-vault-passphrase').fill(passphrase);
  await frameB.getByTestId('brain-vault-restore').click();
  await expect.poll(async () => {
    return await frameB.evaluate(() => window.__foundersPlotTest.getBrainStatus());
  }, { timeout: 8000 }).toEqual(expect.objectContaining({
    configured: true,
    realReady: true,
    provider: 'openai',
    model: 'gpt-4o-mini'
  }));

  const restoredSecret = await frameB.evaluate(async () => {
    const lib = await import('/openclaw-lite/llm-config-library.js');
    const config = await lib.loadLlmConfig();
    return config.apiKey || '';
  });
  expect(restoredSecret).toBe(secret);

  const runtime = await frameB.evaluate(async () => {
    return await window.__foundersPlotTest.startForemanRuntime();
  });
  expect(runtime.ok).toBe(true);
  expect(runtime.runtime?.status).toBe('OBSERVING');
  const runtimeState = await getPlotState(frameB);
  expect(runtimeState.foreman?.runtime?.brainReady).toBe(true);
  await expect(frameB.locator('body')).not.toContainText(secret);

  await contextB.close();
});

const { test, expect } = require('@playwright/test');
const { seedExperiencePreference, buildPreference } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mainland preset localizes app runtime and debug shell copy', async ({ page }) => {
  const preference = buildPreference('cn-mainland');

  await seedExperiencePreference(page, 'cn-mainland');
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

  await expect(page.locator('#agentPanelTitle')).toHaveText('Agent 通讯');
  await expect(page.locator('#chatInput')).toHaveAttribute('placeholder', '给 Agent 发消息...');
  await expect(page.locator('#agentDebugTabTraffic')).toHaveText('Worker 流量');
  await expect(page.locator('#agentDebugRefreshBtn')).toHaveText('刷新');
  await expect(page.locator('#agentDebugToggleBtn')).toHaveAttribute('title', '切换调试面板');
  await expect(page.locator('#agentPanelZoomInBtn')).toHaveAttribute('title', /增大面板尺寸/);
});

test('mainland preset localizes deep debug headings and mint runtime errors', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });
  await seedExperiencePreference(page, 'cn-mainland');

  await page.goto('/app?liteDriver=phase1');
  await page.waitForFunction(() => !!window.__openclawLiteTest, null, { timeout: 10000 });

  await page.evaluate(async () => {
    await window.__openclawLiteTest.visitExperience({ url: '/skill.md' });
  });

  await page.getByTestId('agent-debug-tab-session').click();
  await page.locator('#agentDebugRefreshBtn').click();

  const sessionPane = page.getByTestId('agent-debug-session');
  await expect(sessionPane).toContainText('Transcript 完整性（修复敏感）：', { timeout: 8000 });
  await expect(sessionPane).toContainText('Worker 会话上下文（LLM 输入的权威来源）：', { timeout: 8000 });
  await expect(sessionPane).toContainText('系统 prompt 预览：', { timeout: 8000 });

  const mintMessages = await page.evaluate(() => ({
    solana: window.knownMintErrorMessage({ message: 'PRIVY_WALLET_RPC_SIGN_UNAVAILABLE' }, 'solana'),
    evm: window.knownMintErrorMessage({ message: 'MINT_EVM_SPONSORED_TIMEOUT' }, 'evm'),
  }));
  expect(mintMessages.solana).toBe('Sponsored Solana 发送所需的 Privy signer 当前不可用。');
  expect(mintMessages.evm).toBe('Privy sponsored Sepolia 交易在确认前超时。');
});

test('mainland preset localizes share creation ceremony errors on the house page', async ({ page }) => {
  const preference = buildPreference('cn-mainland');

  await seedExperiencePreference(page, 'cn-mainland');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        houseId: 'house-cn-runtime',
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

  await expect(page.locator('#shareError')).toHaveText('需要 Agent 批准。请让 Agent 重新连接到这个 house。');
  await expect(page.locator('#shareRequirement')).toHaveText('正在等待 agent 批准。请让它重新连接到这个 house。');
});

test('mainland preset localizes deep house runtime errors', async ({ page }) => {
  const preference = buildPreference('cn-mainland');

  await seedExperiencePreference(page, 'cn-mainland');
  await page.route('**/api/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        houseId: 'house-cn-runtime-errors',
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
  await expect(page.locator('#error')).toHaveText('本地 Agent0 SDK bundle 还未构建，ERC-8004 铸造已被禁用。');

  await page.evaluate(() => {
    window.setPublicMediaError('PUBLIC_PROMPT_REQUIRED');
  });
  await expect(page.locator('#publicUploadError')).toHaveText('发布之前请先填写公开图片的提示词。');
});

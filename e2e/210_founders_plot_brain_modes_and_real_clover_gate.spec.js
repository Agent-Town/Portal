const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('No Brain, Preview Brain, and Real Brain expose distinct Clover gates', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);
  await frame.getByTestId('founders-clover-avatar').click();

  await expect(frame.getByTestId('founders-foreman-status')).toContainText('Manual Founder Mode');
  await expect(frame.getByTestId('foreman-start-btn')).toHaveText('Connect a Brain');
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeDisabled();
  await expect(frame.getByTestId('brain-chatgpt-login-card')).toBeVisible();
  await expect(frame.getByTestId('brain-chatgpt-login')).toHaveText('Log in with ChatGPT');

  await frame.getByTestId('brain-quick-provider').selectOption('openrouter');
  await frame.getByTestId('brain-quick-model').fill('nvidia/nemotron-3-super-120b-a12b:free');
  await frame.getByTestId('brain-quick-key').fill('or-free-test-key');
  await frame.getByTestId('brain-quick-save').click();

  await expect.poll(async () => {
    return await frame.evaluate(() => window.__foundersPlotTest.getBrainStatus().quality);
  }, { timeout: 5000 }).toBe('preview');
  await expect(frame.getByTestId('founders-foreman-status')).toContainText('Preview Clover');
  await expect(frame.getByTestId('foreman-start-btn')).toHaveText('Upgrade Brain');
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeDisabled();

  await frame.evaluate(async () => {
    await window.__foundersPlotTest.saveBrainConfigForTest({
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-4-5',
      apiKey: 'or-real-test-key',
      authMode: 'api-key',
      useProxy: false
    });
  });

  await expect.poll(async () => {
    return await frame.evaluate(() => window.__foundersPlotTest.getBrainStatus().realReady);
  }, { timeout: 5000 }).toBe(true);
  await expect(frame.getByTestId('foreman-start-btn')).toHaveText('Start Clover');
  await expect(frame.getByTestId('foreman-run-now-btn')).toBeDisabled();
});

test('Clover exposes ChatGPT login and starts the OpenAI Codex PKCE flow', async ({ page }) => {
  await page.addInitScript(() => {
    window.__foundersOpenedLoginUrls = [];
    window.open = (url) => {
      window.__foundersOpenedLoginUrls.push(String(url || ''));
      return { closed: false, close() {} };
    };
  });

  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);
  await frame.getByTestId('founders-clover-avatar').click();

  await frame.getByTestId('brain-chatgpt-login').click();

  await expect(frame.getByTestId('brain-chatgpt-status')).toContainText('Finish ChatGPT login', { timeout: 5000 });
  const openedUrls = await frame.evaluate(() => window.__foundersOpenedLoginUrls || []);
  expect(openedUrls).toHaveLength(1);
  expect(openedUrls[0]).toContain('https://auth.openai.com/oauth/authorize');
  expect(openedUrls[0]).toContain('originator=founders-plot-clover');
  expect(openedUrls[0]).toContain('code_challenge=');
});

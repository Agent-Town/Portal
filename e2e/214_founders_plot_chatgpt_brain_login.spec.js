const { test, expect } = require('@playwright/test');
const { getOpenFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('ChatGPT login is the primary brain CTA and persists openai-codex as Real Clover brain', async ({ page }) => {
  await page.goto('/app?district=founders-plot&entry=play-first');
  const frame = await getOpenFoundersPlotFrame(page);

  await frame.evaluate(() => {
    window.__foundersPlotOpenedOAuthUrl = '';
    window.open = (url) => {
      window.__foundersPlotOpenedOAuthUrl = String(url || '');
      return { closed: false };
    };
  });

  await frame.getByTestId('founders-clover-avatar').click();
  await expect(frame.getByTestId('brain-quick-connect-sheet')).toBeVisible();
  await expect(frame.getByTestId('chatgpt-brain-login')).toHaveText('Log in with ChatGPT');
  await expect(frame.getByTestId('brain-advanced-toggle')).toContainText('Use another brain');

  await frame.getByTestId('chatgpt-brain-login').click();
  await expect.poll(async () => {
    return await frame.evaluate(() => window.__foundersPlotOpenedOAuthUrl || '');
  }, { timeout: 5000 }).toContain('auth.openai.com/oauth/authorize');

  await frame.getByText('Having trouble finishing login?').click();
  await frame.getByTestId('chatgpt-brain-callback').fill('test-code-founders-chatgpt');
  await frame.getByTestId('chatgpt-brain-complete').click();

  await expect.poll(async () => {
    return await frame.evaluate(() => window.__foundersPlotTest.getBrainStatus());
  }, { timeout: 5000 }).toMatchObject({
    configured: true,
    provider: 'openai-codex',
    model: 'gpt-5.3-codex',
    quality: 'real',
    realReady: true
  });

  await expect(frame.getByTestId('chatgpt-brain-state')).toContainText(/connected/i);
  await expect(frame.getByTestId('foreman-start-btn')).toHaveText('Start Clover');
});

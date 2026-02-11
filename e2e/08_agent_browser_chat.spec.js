const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent drawer uses in-browser runtime + llm proxy path', async ({ page, request }) => {
  await page.goto('/');

  await page.click('#startHatchingBtn');
  await expect(page.locator('#hatchingStatus')).toContainText('Hatching active');
  await expect(page.locator('#agentDrawer')).toBeVisible();

  await page.fill('#agentApiKeyInput', 'test-key');
  await page.click('#agentApiKeySaveBtn');

  await page.fill('#agentInput', 'hello browser agent');
  await page.click('#agentSendBtn');

  await expect(page.locator('#agentChat')).toContainText('hello browser agent');
  await expect(page.locator('#agentChat')).toContainText('pi-ai ok');

  const stats = await request.get('/__test__/llm/stats');
  expect(stats.ok()).toBeTruthy();
  const body = await stats.json();
  expect(body.chatCompletions).toBeGreaterThanOrEqual(1);
});

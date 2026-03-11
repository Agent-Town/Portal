const { test, expect } = require('@playwright/test');
const { seedExperiencePreference } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mainland preset reorders provider recommendations and warns when OpenAI is selected', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
  await page.goto('/house');

  const providerSelect = page.locator('#llmProviderSelect');
  const modelSelect = page.locator('#llmModelIdInput');
  await expect(providerSelect).toHaveValue('qwen');
  await expect(page.locator('#llmProviderSelect option').first()).toHaveAttribute('value', 'qwen');
  await expect(modelSelect).toHaveValue('qwen3-coder-plus');
  await expect(page.locator('#llmModelIdInput option').first()).toHaveAttribute('value', 'qwen3-coder-plus');

  await page.evaluate(() => {
    const select = document.getElementById('llmProviderSelect');
    if (!(select instanceof HTMLSelectElement)) return;
    select.disabled = false;
    select.value = 'openai';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(page.locator('#llmProviderWarning')).toContainText('OpenAI');
  await expect(page.locator('#llmProviderWarning')).toContainText('qwen');
  await expect(page.locator('#llmProviderWarning')).toContainText('glm');
});

test('providers with template model IDs show an actionable warning', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
  await page.goto('/house');
  await expect(page.locator('#llmProviderSelect')).toHaveValue('qwen');

  await page.evaluate(() => {
    const select = document.getElementById('llmProviderSelect');
    if (!(select instanceof HTMLSelectElement)) return;
    select.disabled = false;
    select.value = 'qianfan';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(page.locator('#llmProviderWarning')).toContainText('qianfan');
  await expect(page.locator('#llmProviderWarning')).toContainText('真实模型 ID');
});

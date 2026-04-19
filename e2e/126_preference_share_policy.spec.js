const { test, expect } = require('@playwright/test');
const { seedExperiencePreference } = require('./helpers/experience');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('mainland preset uses generic human-post share wording on the house page', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
  await page.goto('/house');

  await expect(page.locator('#shareHumanPostLabel')).toHaveText('人类公开帖子');
  await expect(page.locator('#shareHumanPost')).toHaveAttribute('placeholder', 'https://example.com/post/...');
  await expect(page.locator('#shareAgentPostLabel')).toHaveText('Agent Moltbook 帖子');
});

test('mainland preset localizes share-link save recovery errors', async ({ page }) => {
  await seedExperiencePreference(page, 'cn-mainland');
  await page.route('**/api/human/posts', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'SHARE_NOT_FOUND' })
    });
  });

  await page.goto('/house');
  await expect(page.locator('#llmProviderSelect')).toHaveValue('qwen');
  await page.evaluate(() => {
    const shareActive = document.getElementById('shareActive');
    if (shareActive) shareActive.classList.remove('is-hidden');
    const shareSetup = document.getElementById('shareSetup');
    if (shareSetup) shareSetup.classList.add('is-hidden');
    const human = document.getElementById('shareHumanPost');
    if (human instanceof HTMLInputElement) human.value = 'https://example.com/post/123';
    const agent = document.getElementById('shareAgentPost');
    if (agent instanceof HTMLInputElement) agent.value = 'https://www.moltbook.com/post/456';
  });
  await page.evaluate(() => {
    const save = document.getElementById('saveSharePosts');
    if (save instanceof HTMLButtonElement) save.click();
  });

  await expect(page.locator('#sharePostsError')).toHaveText('未找到当前会话对应的分享链接。请重新生成分享链接。');
});

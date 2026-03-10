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

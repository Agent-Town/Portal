const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('home loads, shows team code and skill link', async ({ page, request }) => {
  await page.goto('/');

  await expect(page.getByTestId('team-code')).toHaveText(/TEAM-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  await expect(page.getByTestId('skill-link')).toBeVisible();

  // skill.md is reachable and looks like a skill file (frontmatter)
  const resp = await request.get('/skill.md');
  expect(resp.ok()).toBeTruthy();
  const txt = await resp.text();
  expect(txt).toContain('name: agent-town-playbook');
});

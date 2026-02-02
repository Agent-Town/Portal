const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset');
});

test('home loads, shows pair code and skill link', async ({ page, request }) => {
  await page.goto('/');

  await expect(page.getByTestId('pair-code')).toHaveText(/PAIR-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  await expect(page.getByTestId('skill-link')).toBeVisible();

  // skill.md is reachable and looks like a skill file (frontmatter)
  const resp = await request.get('/skill.md');
  expect(resp.ok()).toBeTruthy();
  const txt = await resp.text();
  expect(txt).toContain('name: elizatown-playbook');
});

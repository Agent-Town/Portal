const { test, expect } = require('@playwright/test');
const { enterHatch } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('home loads, hides visual team code, and keeps skill link reachable', async ({ page, request }) => {
  await enterHatch(page, 'signin');

  const state = await page.evaluate(async () => {
    const resp = await fetch('/api/state', { credentials: 'include' });
    return resp.json().catch(() => ({}));
  });
  expect(String(state?.teamCode || '')).toMatch(/^TEAM-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  await expect(page.getByTestId('team-code')).toHaveCount(0);
  await expect(page.getByTestId('skill-link')).toBeVisible();

  // skill.md is reachable and looks like a skill file (frontmatter)
  const resp = await request.get('/skill.md');
  expect(resp.ok()).toBeTruthy();
  const txt = await resp.text();
  expect(txt).toContain('name: agent-town-playbook');
});

const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('agent can connect and match the human sigil to unlock', async ({ page, request }) => {
  await page.goto('/');

  const teamCode = (await page.getByTestId('team-code').innerText()).trim();

  // Agent connects
  const connect = await request.post('/api/agent/connect', {
    data: { teamCode, agentName: 'ClawTest' }
  });
  expect(connect.ok()).toBeTruthy();

  await expect(page.getByTestId('agent-status')).toContainText('Agent connected');

  // Human selects the cookie sigil
  await page.getByTestId('sigil-cookie').click();

  // Agent selects the same sigil
  const sel = await request.post('/api/agent/select', {
    data: { teamCode, elementId: 'cookie' }
  });
  expect(sel.ok()).toBeTruthy();

  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');
  await expect(page.getByTestId('open-btn')).toBeEnabled();
});

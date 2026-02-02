const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset');
});

test('agent can connect and match the human sigil to unlock', async ({ page, request }) => {
  await page.goto('/');

  const pairCode = (await page.getByTestId('pair-code').innerText()).trim();

  // Agent connects
  const connect = await request.post('/api/agent/connect', {
    data: { pairCode, agentName: 'ClawTest' }
  });
  expect(connect.ok()).toBeTruthy();

  await expect(page.getByTestId('agent-status')).toContainText('Agent connected');

  // Human selects the cookie sigil
  await page.getByTestId('sigil-cookie').click();

  // Agent selects the same sigil
  const sel = await request.post('/api/agent/select', {
    data: { pairCode, elementId: 'cookie' }
  });
  expect(sel.ok()).toBeTruthy();

  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');
  await expect(page.getByTestId('beta-btn')).toBeEnabled();
});

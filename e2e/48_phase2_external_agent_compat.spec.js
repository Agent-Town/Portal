const { test, expect } = require('@playwright/test');
const { fetchSessionState } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('external agent API flow remains compatible when runtime fallback is requested', async ({ page, request }) => {
  await page.goto('/?liteDriver=phase1');

  const initial = await fetchSessionState(page);
  const teamCode = initial.teamCode;
  expect(teamCode).toMatch(/^TEAM-/);

  await page.evaluate(async () => {
    await fetch('/api/hatch/complete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
  });

  const connectResp = await request.post('/api/agent/connect', {
    data: { teamCode, agentName: 'CompatExternal' }
  });
  expect(connectResp.ok()).toBeTruthy();

  await page.getByTestId('sigil-key').click();
  const selectResp = await request.post('/api/agent/select', {
    data: { teamCode, elementId: 'key' }
  });
  expect(selectResp.ok()).toBeTruthy();
  await expect(page.getByTestId('match-status')).toContainText('UNLOCKED');

  await page.getByTestId('open-btn').click();
  const openResp = await request.post('/api/agent/open/press', { data: { teamCode } });
  expect(openResp.ok()).toBeTruthy();
  await page.waitForURL('**/create');

  const state = await fetchSessionState(page);
  expect(state.signup?.complete).toBe(true);
  expect(state.agent?.source).toBe('external');
  expect(state.lite).toBeTruthy();
  expect(state.lite.driver).toBe('phase1');
});


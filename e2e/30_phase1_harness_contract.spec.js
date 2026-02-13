const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('reset clears progress and /api/state exposes phase1 hatch defaults', async ({ request }) => {
  const beforeResp = await request.get('/api/state');
  expect(beforeResp.ok()).toBeTruthy();
  const before = await beforeResp.json();
  const previousTeamCode = before.teamCode;
  expect(previousTeamCode).toMatch(/^TEAM-/);

  const connectResp = await request.post('/api/agent/connect', {
    data: { teamCode: previousTeamCode, agentName: 'Phase1Harness' }
  });
  expect(connectResp.ok()).toBeTruthy();

  const dirtyResp = await request.get('/api/state');
  expect(dirtyResp.ok()).toBeTruthy();
  const dirty = await dirtyResp.json();
  expect(dirty.agent?.connected).toBe(true);

  const resetResp = await request.post('/__test__/reset', {
    headers: { 'x-test-reset': resetToken }
  });
  expect(resetResp.ok()).toBeTruthy();
  const reset = await resetResp.json();
  expect(reset.ok).toBe(true);

  const afterResp = await request.get('/api/state');
  expect(afterResp.ok()).toBeTruthy();
  const after = await afterResp.json();

  expect(after.teamCode).toMatch(/^TEAM-/);
  expect(after.teamCode).not.toBe(previousTeamCode);
  expect(after.agent?.connected).toBe(false);

  expect(after.hatch).toBeTruthy();
  expect(after.hatch.complete).toBe(false);
  expect(after.hatch.createdAt).toBeNull();
  expect(after.hatch.agentKind).toBeNull();

  expect(after.agent).toBeTruthy();
  expect(after.agent.source ?? null).toBeNull();
});

const { test, expect } = require('@playwright/test');
const { installMockSolanaWallet } = require('./helpers/phase1');
const { hatchAndConnectLite, unlockGateWithSigil, openToCreate, attachPathRecorder, fetchSessionState } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('vendor runtime bridge owns sigil, open, and ceremony agent actions', async ({ page }) => {
  await installMockSolanaWallet(page, { withDisconnect: true, multiplier: 21 });

  const calls = attachPathRecorder(page, [
    '/api/agent/select',
    '/api/agent/open/press',
    '/api/agent/house/commit',
    '/api/agent/house/reveal'
  ]);

  await hatchAndConnectLite(page, 'signup');

  const hasBridge = await page.evaluate(() => typeof window.OpenClawLiteRuntimeBridge?.init === 'function');
  expect(hasBridge).toBe(true);

  await unlockGateWithSigil(page, 'key');
  await openToCreate(page);

  await page.getByTestId('px-0-0').click();
  await page.getByTestId('share-btn').click();
  await page.waitForURL('**/house?house=*', { timeout: 10_000 });

  const byPath = (pathname) => calls.filter((entry) => entry.pathname === pathname);
  expect(byPath('/api/agent/select').length).toBeGreaterThan(0);
  expect(byPath('/api/agent/open/press').length).toBeGreaterThan(0);
  expect(byPath('/api/agent/house/commit').length).toBeGreaterThan(0);
  expect(byPath('/api/agent/house/reveal').length).toBeGreaterThan(0);

  const selectAt = byPath('/api/agent/select')[0].atMs;
  const openAt = byPath('/api/agent/open/press')[0].atMs;
  const commitAt = byPath('/api/agent/house/commit')[0].atMs;
  const revealAt = byPath('/api/agent/house/reveal')[0].atMs;

  expect(openAt).toBeGreaterThanOrEqual(selectAt);
  expect(commitAt).toBeGreaterThanOrEqual(openAt);
  expect(revealAt).toBeGreaterThanOrEqual(commitAt);

  const state = await fetchSessionState(page);
  expect(state.signup?.complete).toBe(true);
  expect(typeof state.houseId).toBe('string');
  expect(state.houseId.length).toBeGreaterThan(20);
});

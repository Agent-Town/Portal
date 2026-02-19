const { test, expect } = require('@playwright/test');
const { hatchAndConnectLite, fetchSessionState } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('runtime bridge boots the OpenClaw Lite worker with server-lite runtime state remaining neutral', async ({ page }) => {
  const seen = {
    workerEntry: 0,
    workerRuntime: 0,
    runtimeInfoApi: 0
  };

  page.on('request', (req) => {
    const pathname = new URL(req.url()).pathname;
    if (pathname === '/openclaw-lite/worker.js') seen.workerEntry += 1;
    if (pathname === '/openclaw-lite/runtime-worker.js') seen.workerRuntime += 1;
    if (pathname === '/api/agent/lite/runtime') seen.runtimeInfoApi += 1;
  });

  await hatchAndConnectLite(page, 'signup');

  await expect.poll(() => seen.workerEntry, { timeout: 5000 }).toBeGreaterThan(0);
  await expect.poll(() => seen.workerRuntime, { timeout: 5000 }).toBeGreaterThan(0);
  await expect.poll(() => seen.runtimeInfoApi, { timeout: 5000 }).toBeGreaterThan(0);

  const state = await fetchSessionState(page);
  expect(state.lite.driver).toBe('vendor');
  expect(state.lite.runtimeReady).toBe(false);
  expect(state.agent?.source).toBe('openclaw-lite');

  const bridgeShape = await page.evaluate(() => ({
    hasBridge: !!window.OpenClawLiteRuntimeBridge,
    hasInit: typeof window.OpenClawLiteRuntimeBridge?.init === 'function',
    hasSelect: typeof window.OpenClawLiteRuntimeBridge?.selectSigil === 'function'
  }));
  expect(bridgeShape.hasBridge).toBe(true);
  expect(bridgeShape.hasInit).toBe(true);
  expect(bridgeShape.hasSelect).toBe(true);
});

const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('phase2 harness exposes lite runtime contract and bootstrap endpoint', async ({ request }) => {
  const stateResp = await request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();

  expect(state.lite).toBeTruthy();
  expect(state.lite.driver).toBe('vendor');
  expect(state.lite.runtimeReady).toBe(false);
  expect(state.lite.llmConfigured).toBe(false);
  expect(state.lite.llmProvider ?? null).toBeNull();
  expect(state.lite.llmModel ?? null).toBeNull();
  expect(state.lite.runtimeVersion ?? null).toBeNull();
  expect(state.lite.lastError ?? null).toBeNull();

  const runtimeResp = await request.get('/api/agent/lite/runtime');
  expect(runtimeResp.ok()).toBeTruthy();
  const runtime = await runtimeResp.json();
  expect(runtime.ok).toBe(true);
  expect(runtime.teamCode).toMatch(/^TEAM-/);
  expect(typeof runtime.runtimeVersion).toBe('string');
  expect(runtime.runtimeVersion.length).toBeGreaterThan(0);
  expect(typeof runtime.origin).toBe('string');
  expect(runtime.origin.length).toBeGreaterThan(0);

  const llmResp = await request.get('/api/agent/lite/llm/config');
  expect(llmResp.ok()).toBeTruthy();
  const llm = await llmResp.json();
  expect(llm.ok).toBe(true);
  expect(llm.configured).toBe(false);
  expect(llm.apiKeySet).toBe(false);
});

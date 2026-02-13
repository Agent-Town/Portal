const { test, expect } = require('@playwright/test');
const { enterHatch, completeHatch, configureLiteLlm, fetchSessionState } = require('./helpers/phase2');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('vendor runtime requires LLM config and becomes ready after user saves LLM settings', async ({ page }) => {
  await enterHatch(page, 'signin');
  await completeHatch(page);

  await expect(page.getByTestId('lite-llm-panel')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('lite-agent-status')).not.toContainText(/connected/i);

  const before = await fetchSessionState(page);
  expect(before.lite).toBeTruthy();
  expect(before.lite.driver).toBe('vendor');
  expect(before.lite.llmConfigured).toBe(false);
  expect(before.lite.runtimeReady).toBe(false);

  await configureLiteLlm(page, {
    provider: 'test-local',
    model: 'deterministic',
    apiKey: 'phase2-test-key'
  });

  await expect(page.getByTestId('lite-agent-status')).toContainText(/connected/i, { timeout: 2000 });

  const state = await fetchSessionState(page);
  expect(state.lite).toBeTruthy();
  expect(state.lite.driver).toBe('vendor');
  expect(state.lite.llmConfigured).toBe(true);
  expect(state.lite.llmProvider).toBe('test-local');
  expect(state.lite.llmModel).toBe('deterministic');
  expect(state.lite.runtimeReady).toBe(true);
  expect(typeof state.lite.runtimeVersion).toBe('string');
  expect(state.lite.runtimeVersion.length).toBeGreaterThan(0);
  expect(state.lite.lastError ?? null).toBeNull();
  expect(JSON.stringify(state)).not.toContain('phase2-test-key');
});

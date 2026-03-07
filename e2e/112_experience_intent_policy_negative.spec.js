const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool
} = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('AC-N1: unknown UI intent is rejected with UI_INTENT_UNKNOWN', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const result = await invokeExperienceTool(page, 'agent_town_ui_totally_unknown', {});
  expect(result?.ok).toBe(false);
  expect(result?.applied).toBe(false);
  expect(String(result?.error?.code || '')).toBe('UI_INTENT_UNKNOWN');
});

test('AC-N2: invalid UI params are rejected with UI_INTENT_INVALID_PARAM', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const result = await invokeExperienceTool(page, 'agent_town_ui_open_modal', {
    modal: 'not-a-real-modal'
  });
  expect(result?.ok).toBe(false);
  expect(result?.applied).toBe(false);
  expect(String(result?.error?.code || '')).toBe('UI_INTENT_INVALID_PARAM');
});

test('AC-N3: selector/html payload is rejected and does not inject DOM nodes', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const beforeInjectedCount = await page.locator('#intentInjectedNode').count();
  expect(beforeInjectedCount).toBe(0);

  const result = await invokeExperienceTool(page, 'agent_town_ui_open_modal', {
    modal: 'atlas',
    selector: 'body',
    html: '<div id="intentInjectedNode">x</div>'
  });
  expect(result?.ok).toBe(false);
  expect(result?.applied).toBe(false);
  expect(String(result?.error?.code || '')).toBe('UI_INTENT_INVALID_PARAM');
  await expect(page.locator('#intentInjectedNode')).toHaveCount(0);
});

test('AC-N4: irreversible action intent is blocked with CONFIRMATION_REQUIRED when no approval token exists', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const result = await invokeExperienceTool(page, 'agent_town_ui_publish_post', {
    channel: 'x',
    text: 'post without explicit approval'
  });
  expect(result?.ok).toBe(false);
  expect(result?.applied).toBe(false);
  expect(String(result?.error?.code || '')).toBe('CONFIRMATION_REQUIRED');
});

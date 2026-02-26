const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readPathname
} = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('AC-58: agent_town_ui_open_modal opens Atlas modal without route change and returns deterministic envelope', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const result = await invokeExperienceTool(page, 'agent_town_ui_open_modal', {
    modal: 'atlas',
    params: {}
  });

  // AC-58.1: URL path remains /app.
  expect(await readPathname(page)).toBe('/app');

  // AC-58.2: District modal is visible in <= 2000ms.
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 2000 });

  // AC-58.3: Modal title is Atlas Depot.
  await expect(page.locator('#districtModalTitle')).toHaveText('Atlas Depot');

  // AC-58.4 and AC-58.5: Response envelope.
  expect(result?.ok).toBe(true);
  expect(result?.applied).toBe(true);
  expect(result?.stateSnapshot?.modal?.open).toBe(true);
  expect(result?.error || null).toBeNull();
});

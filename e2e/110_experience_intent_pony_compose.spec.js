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

test('AC-60: agent_town_ui_pony_compose opens compose view in modal and prefills recipient/subject/draft', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const payload = {
    toHouseId: 'hs_test_receiver',
    subject: 'Spec Subject',
    draft: 'Spec Draft Body'
  };

  const result = await invokeExperienceTool(page, 'agent_town_ui_pony_compose', payload);

  // AC-60.1: Pony modal visible within 2000ms.
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 2000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Pony Express');

  // AC-60.2: Compose panel open without route replacement.
  expect(await readPathname(page)).toBe('/app');
  await expect(page.getByTestId('pony-compose-panel')).toBeVisible();

  // AC-60.3: Prefill values exactly match payload.
  await expect(page.getByTestId('pony-compose-to')).toHaveValue(payload.toHouseId);
  await expect(page.getByTestId('pony-compose-subject')).toHaveValue(payload.subject);
  await expect(page.getByTestId('pony-compose-draft')).toHaveValue(payload.draft);

  // AC-60.4: Deterministic response envelope.
  expect(result?.ok).toBe(true);
  expect(result?.applied).toBe(true);
  expect(result?.error || null).toBeNull();
});

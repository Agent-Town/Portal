const { test, expect } = require('@playwright/test');
const { bootstrapExperienceIntentHarness } = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('AC-62: worker tool registry exposes experience state/ui tool families', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const registry = await page.evaluate(async () => {
    return await window.__openclawLiteTest.getToolRegistryInfo();
  });

  const names = Array.isArray(registry?.names) ? registry.names : [];
  expect(names).toContain('agent_town_state_get_session');
  expect(names).toContain('agent_town_state_get_agent_state');
  expect(names).toContain('agent_town_ui_open_modal');
  expect(names).toContain('agent_town_ui_open_progression_atlas');
  expect(names).toContain('agent_town_ui_atlas_search');
  expect(names).toContain('agent_town_ui_pony_compose');
  expect(names).toContain('agent_town_progression_get_state');
  expect(names).toContain('agent_town_progression_draft_strategy');
  expect(names).toContain('agent_town_progression_save_strategy');
  expect(names).toContain('agent_town_progression_generate_icon_draft');
  expect(names).toContain('agent_town_progression_save_edited_strategy');
  expect(names).toContain('agent_town_progression_select_strategy');
  expect(names).toContain('agent_town_progression_explain_node');
});

const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  openTrainerFromSidebar,
  openTrainerToolsTab,
  listTrainerToolNames,
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer namespace tools are discoverable when enabled and hidden when disabled', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const enabledTools = await listTrainerToolNames(page);
  expect(enabledTools).toContain('trainer.list_runs');
  expect(enabledTools).toContain('trainer.list_actions');
  expect(enabledTools).toContain('trainer.invoke_action');

  await gotoAppWithLite(page, { trainerNamespace: false });
  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const disabledTools = await listTrainerToolNames(page);
  expect(disabledTools).not.toContain('trainer.list_runs');
  expect(disabledTools).not.toContain('trainer.list_actions');
  expect(disabledTools).not.toContain('trainer.invoke_action');
});

const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  openTrainerFromSidebar,
  openTrainerToolsTab,
  listTrainerToolNames
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('plugin harness extracts dynamic skill actions from active skill and surfaces skill_action tools', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  await expect(page.getByTestId('trainer-skill-catalog')).toContainText('Skill actions (plugin):', { timeout: 5000 });
  const toolNames = await listTrainerToolNames(page);
  const actionTools = toolNames.filter((name) => name.startsWith('skill_action.'));
  expect(actionTools.length).toBeGreaterThan(0);
});

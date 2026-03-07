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

test('inference parser extracts actions from markdown endpoint definitions when explicit block is absent', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const catalog = page.getByTestId('trainer-skill-catalog');
  await expect(catalog).toContainText('Skill actions (plugin):', { timeout: 5000 });
  await expect(catalog).toContainText('canvas.paint', { timeout: 5000 });

  const toolNames = await listTrainerToolNames(page);
  const skillActionNames = toolNames.filter((name) => name.startsWith('skill_action.'));
  expect(skillActionNames).toContain('skill_action.agent.state');
  expect(skillActionNames).toContain('skill_action.share.instructions');
  expect(skillActionNames).not.toContain('skill_action.agent.state.2');
  expect(skillActionNames).not.toContain('skill_action.share.instructions.2');
  expect(skillActionNames.some((name) => /\.\d+$/.test(name))).toBe(false);
});

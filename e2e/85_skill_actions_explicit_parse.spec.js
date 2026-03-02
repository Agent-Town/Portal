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

test('explicit skill-actions-v1 block is parsed deterministically into dynamic tools', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/fixtures/skill-actions-explicit/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const catalog = page.getByTestId('trainer-skill-catalog');
  await expect(catalog).toContainText('health.check', { timeout: 5000 });
  await expect(catalog).toContainText('health.strict_fail', { timeout: 5000 });

  const toolNames = await listTrainerToolNames(page);
  expect(toolNames).toContain('skill_action.health.check');
  expect(toolNames).toContain('skill_action.health.strict_fail');
});

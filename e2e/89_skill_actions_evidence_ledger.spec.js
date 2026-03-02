const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  openTrainerFromSidebar,
  openTrainerToolsTab
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer surfaces plugin evidence rows and action run counters after invocation', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/fixtures/skill-actions-explicit/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.health.check');
  await page.getByTestId('trainer-tool-params').fill('{}');
  await page.getByTestId('trainer-tool-invoke').click();

  await expect(page.getByTestId('trainer-tool-result')).toContainText('"evidenceKey": "health.check.ok"', { timeout: 5000 });
  await expect(page.getByTestId('trainer-skill-catalog')).toContainText('runs: 1 (ok=1', { timeout: 5000 });
  await expect(page.getByTestId('trainer-integrity')).toContainText('Skill action tools:', { timeout: 5000 });
});

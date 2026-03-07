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

test('plugin-invoked skill actions validate success rules and surface deterministic failures', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/fixtures/skill-actions-explicit/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.health.check');
  await page.getByTestId('trainer-tool-params').fill('{}');
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"actionId": "health.check"', { timeout: 5000 });
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"ok": true', { timeout: 5000 });

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.health.strict_fail');
  await page.getByTestId('trainer-tool-params').fill('{}');
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"actionId": "health.strict_fail"', { timeout: 5000 });
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"code": "SUCCESS_RULE_FAILED"', { timeout: 5000 });
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"ok": false', { timeout: 5000 });
});

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

test('plugin security guards block cross-origin, method mismatch, and oversize payloads', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/fixtures/skill-actions-security/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.cross.origin.block');
  await page.getByTestId('trainer-tool-params').fill('{}');
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"code": "ORIGIN_BLOCKED"', { timeout: 5000 });

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.method.block');
  await page.getByTestId('trainer-tool-params').fill('{}');
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"code": "METHOD_NOT_ALLOWED"', { timeout: 5000 });

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.body.limit');
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify({ blob: 'abcdefghijklmnopqrstuvwxyz' }, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"code": "SIZE_LIMIT"', { timeout: 5000 });
});

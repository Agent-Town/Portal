const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  openTrainerFromSidebar
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer shows transcript integrity and supports tool-lab invocation', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: lite echo');

  await openTrainerFromSidebar(page);

  const integrity = page.getByTestId('trainer-integrity');
  await expect(integrity).toContainText('Tool results:', { timeout: 5000 });
  await expect(integrity).toContainText('Orphan tool results:', { timeout: 5000 });

  await page.getByTestId('trainer-tab-tools').click();

  const skillCatalog = page.getByTestId('trainer-skill-catalog');
  await expect(skillCatalog).toContainText('Skills extracted:', { timeout: 5000 });

  await page.getByTestId('trainer-tool-name').selectOption('workspace_list');
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify({ path: 'workspace/' }, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();

  const toolResult = page.getByTestId('trainer-tool-result');
  await expect(toolResult).toContainText('"ok": true', { timeout: 5000 });
  await expect(toolResult).toContainText('"tool": "workspace_list"', { timeout: 5000 });
});

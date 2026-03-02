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

test('canvas plugin actions report missing params deterministically and allow direct image verification call', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.canvas.paint');
  await page.getByTestId('trainer-tool-params').fill('{}');
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"code": "PARAM_UNRESOLVED"', { timeout: 5000 });

  await page.getByTestId('trainer-tool-name').selectOption('skill_action.canvas.image');
  const teamCode = await page.evaluate(async () => {
    const res = await fetch('/api/state', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return String(data?.teamCode || '');
  });
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify({ teamCode }, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"actionId": "canvas.image"', { timeout: 5000 });
  await expect(page.getByTestId('trainer-tool-result')).toContainText('"ok": true', { timeout: 5000 });
  await expect(page.getByTestId('trainer-tool-result')).toContainText(`teamCode=${teamCode}`, { timeout: 5000 });
  await expect(page.getByTestId('trainer-tool-result')).not.toContainText('TEAM-ABCD-EFGH');
});

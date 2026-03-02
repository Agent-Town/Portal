const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  openTrainerFromSidebar,
  openTrainerToolsTab,
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function invokeTool(page, toolName, params = {}) {
  await page.getByTestId('trainer-tool-name').selectOption(toolName);
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify(params, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText(`"tool": "${toolName}"`, { timeout: 5000 });
  return await page.evaluate(() => {
    const node = document.getElementById('trainerToolResult');
    return node ? JSON.parse(String(node.textContent || '{}')) : null;
  });
}

test('trainer.list_actions reflects active skill and updates after skill switch', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);

  const firstVisit = await visitSkill(page, '/skill.md');
  expect(firstVisit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const before = await invokeTool(page, 'trainer.list_actions', {});
  expect(before?.ok).toBe(true);
  const beforeIds = Array.isArray(before?.actions) ? before.actions.map((row) => String(row?.id || '')) : [];
  expect(beforeIds).toContain('canvas.paint');

  const secondVisit = await visitSkill(page, '/fixtures/skill-actions-explicit/skill.md');
  expect(secondVisit?.ok).toBe(true);
  let afterIds = [];
  await expect.poll(async () => {
    await page.evaluate(async () => {
      if (typeof window.__agentTownTrainerRefresh === 'function') {
        await window.__agentTownTrainerRefresh();
      }
    });
    const after = await invokeTool(page, 'trainer.list_actions', {});
    afterIds = Array.isArray(after?.actions) ? after.actions.map((row) => String(row?.id || '')) : [];
    return afterIds.includes('health.check') && afterIds.includes('health.strict_fail');
  }, { timeout: 8000 }).toBe(true);
  expect(afterIds).not.toContain('canvas.paint');
});

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
  const resultNode = page.getByTestId('trainer-tool-result');
  const beforeText = String((await resultNode.textContent()) || '');
  await page.getByTestId('trainer-tool-name').selectOption(toolName);
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify(params, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();
  await expect.poll(async () => {
    const current = String((await resultNode.textContent()) || '');
    return current.length > 0 && current !== beforeText;
  }, { timeout: 5000 }).toBe(true);
  await expect(resultNode).toContainText(`"tool": "${toolName}"`, { timeout: 5000 });
  return await page.evaluate(() => {
    const node = document.getElementById('trainerToolResult');
    return node ? JSON.parse(String(node.textContent || '{}')) : null;
  });
}

test('trainer.invoke_action validates inputs and executes action requests with provided params', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const missing = await invokeTool(page, 'trainer.invoke_action', {});
  expect(missing?.ok).toBe(false);
  expect(String(missing?.code || '')).toBe('TRAINER_PARAM_INVALID');

  const unknown = await invokeTool(page, 'trainer.invoke_action', { actionId: 'does.not.exist', params: {} });
  expect(unknown?.ok).toBe(false);
  expect(String(unknown?.code || '')).toBe('TRAINER_NOT_FOUND');

  const teamCode = await page.evaluate(async () => {
    const res = await fetch('/api/state', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return String(data?.teamCode || '');
  });
  expect(teamCode).toMatch(/^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

  const success = await invokeTool(page, 'trainer.invoke_action', {
    actionId: 'canvas.image',
    params: { teamCode },
  });
  expect(success?.ok).toBe(true);
  expect(String(success?.actionId || '')).toBe('canvas.image');
  expect(String(success?.request?.url || '')).toContain(`teamCode=${teamCode}`);
  expect(JSON.stringify(success)).not.toContain('TEAM-ABCD-EFGH');
});

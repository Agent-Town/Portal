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
  }, { timeout: 6000 }).toBe(true);
  await expect(resultNode).toContainText(`"tool": "${toolName}"`, { timeout: 5000 });
  return await page.evaluate(() => {
    const node = document.getElementById('trainerToolResult');
    return node ? JSON.parse(String(node.textContent || '{}')) : null;
  });
}

test('trainer namespace supports a deterministic human-agent coop loop for canvas verification', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const teamCode = await page.evaluate(async () => {
    const res = await fetch('/api/state', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return String(data?.teamCode || '');
  });
  expect(teamCode).toMatch(/^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

  const before = await invokeTool(page, 'trainer_explain_not_used', { actionId: 'canvas.image' });
  expect(before?.ok).toBe(true);
  expect(before?.actionExists).toBe(true);
  expect(Number(before?.freshEvidenceCount || 0)).toBe(0);

  const humanDemo = await invokeTool(page, 'trainer_invoke_action', {
    actionId: 'canvas.image',
    params: { teamCode },
  });
  expect(humanDemo?.ok).toBe(true);

  const agentRepeat = await invokeTool(page, 'trainer_invoke_action', {
    actionId: 'canvas.image',
    params: { teamCode },
  });
  expect(agentRepeat?.ok).toBe(true);

  const evidence = await invokeTool(page, 'trainer_list_evidence', {
    actionId: 'canvas.image',
    freshOnly: true,
  });
  expect(evidence?.ok).toBe(true);
  expect(Array.isArray(evidence?.evidence)).toBeTruthy();
  expect((evidence?.evidence || []).length).toBeGreaterThan(0);

  const after = await invokeTool(page, 'trainer_explain_not_used', { actionId: 'canvas.image' });
  expect(after?.ok).toBe(true);
  expect(Number(after?.freshEvidenceCount || 0)).toBeGreaterThan(0);

  const actions = await invokeTool(page, 'trainer_list_actions', {});
  expect(actions?.ok).toBe(true);
  const canvasImage = (Array.isArray(actions?.actions) ? actions.actions : [])
    .find((row) => String(row?.id || '') === 'canvas.image');
  expect(canvasImage && typeof canvasImage === 'object').toBeTruthy();
  expect(Number(canvasImage?.runStats?.invocations || 0)).toBeGreaterThanOrEqual(2);
});

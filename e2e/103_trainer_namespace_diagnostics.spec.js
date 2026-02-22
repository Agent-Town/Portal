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

async function readSessionHeader(page) {
  await page.getByTestId('agent-debug-tab-session').click();
  await expect.poll(async () => {
    const text = await page.getByTestId('agent-debug-session').textContent();
    return String(text || '').includes('"trainerNamespacePlugin"');
  }, { timeout: 8000 }).toBe(true);
  return await page.evaluate(() => {
    const node = document.getElementById('agentDebugSession');
    const raw = String(node?.textContent || '');
    const chunks = raw.split(/\n\n+/).map((row) => row.trim()).filter(Boolean);
    if (!chunks.length) return null;
    try {
      return JSON.parse(chunks[0]);
    } catch {
      return null;
    }
  });
}

test('trainer diagnostics tools expose transcript integrity + not-used reasons and align with Session Context diagnostics', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const missingAction = await invokeTool(page, 'trainer.invoke_action', {
    actionId: 'does.not.exist',
    params: {},
  });
  expect(missingAction?.ok).toBe(false);
  expect(String(missingAction?.code || '')).toBe('TRAINER_NOT_FOUND');

  const integrity = await invokeTool(page, 'trainer.get_transcript_integrity', {});
  expect(integrity?.ok).toBe(true);
  expect(integrity?.transcriptIntegrity && typeof integrity.transcriptIntegrity === 'object').toBeTruthy();
  expect(Number.isFinite(Number(integrity?.transcriptIntegrity?.syntheticCount || 0))).toBe(true);
  expect(Array.isArray(integrity?.transcriptIntegrity?.syntheticRecent)).toBeTruthy();

  const explain = await invokeTool(page, 'trainer.explain_not_used', { actionId: 'canvas.paint' });
  expect(explain?.ok).toBe(true);
  expect(explain?.actionId).toBe('canvas.paint');
  expect(Array.isArray(explain?.reasonCodes)).toBeTruthy();

  const sessionTool = await invokeTool(page, 'trainer.get_session_context', {});
  expect(sessionTool?.ok).toBe(true);
  expect(sessionTool?.trainerNamespace && typeof sessionTool.trainerNamespace === 'object').toBeTruthy();
  expect(sessionTool?.trainerNamespace?.tierPolicy && typeof sessionTool.trainerNamespace.tierPolicy === 'object').toBeTruthy();
  expect(sessionTool?.trainerNamespace?.budgetRemaining && typeof sessionTool.trainerNamespace.budgetRemaining === 'object').toBeTruthy();

  const sessionHeader = await readSessionHeader(page);
  expect(sessionHeader && typeof sessionHeader === 'object').toBeTruthy();

  const headerTrainer = sessionHeader?.trainerNamespacePlugin || {};
  expect(headerTrainer?.tierPolicy && typeof headerTrainer.tierPolicy === 'object').toBeTruthy();
  expect(headerTrainer?.budgetRemaining && typeof headerTrainer.budgetRemaining === 'object').toBeTruthy();
  expect(Array.isArray(headerTrainer?.pendingApprovals)).toBeTruthy();
  expect(Array.isArray(headerTrainer?.recentBlockCodes)).toBeTruthy();
  expect((headerTrainer.recentBlockCodes || []).some((row) => String(row?.code || '') === 'TRAINER_NOT_FOUND')).toBeTruthy();

  const toolReasonCodes = Array.isArray(explain?.reasonCodes) ? explain.reasonCodes : [];
  const headerReasonCodes = Array.isArray(sessionHeader?.skillActionsPlugin?.reasonCodes)
    ? sessionHeader.skillActionsPlugin.reasonCodes
    : [];
  expect(new Set(headerReasonCodes)).toEqual(new Set(toolReasonCodes));
});

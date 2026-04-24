const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
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

test('trainer destructive tools require approval token, allow one operation, and expire deterministically', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer approval gate run');

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const runs = await invokeTool(page, 'trainer_list_runs', { limit: 1 });
  expect(runs?.ok).toBe(true);
  const attemptId = String(runs?.runs?.[0]?.attemptId || '');
  expect(attemptId.length).toBeGreaterThan(0);

  const blockedDelete = await invokeTool(page, 'trainer_delete_trace', { attemptId });
  expect(blockedDelete?.ok).toBe(false);
  expect(String(blockedDelete?.code || '')).toBe('TRAINER_APPROVAL_REQUIRED');

  const approval = await page.evaluate(() => {
    return window.AgentTownTrainerNamespacePlugin.issueApprovalToken({
      scopes: ['trainer.delete_trace'],
      ttlMs: 60000,
      uses: 1,
    });
  });
  const approvalToken = String(approval?.token || '');
  expect(approvalToken.length).toBeGreaterThan(0);

  const approvedDelete = await invokeTool(page, 'trainer_delete_trace', {
    attemptId,
    approvalToken,
  });
  expect(approvedDelete?.ok).toBe(true);
  expect(String(approvedDelete?.attemptId || '')).toBe(attemptId);

  const consumedDelete = await invokeTool(page, 'trainer_delete_trace', {
    attemptId,
    approvalToken,
  });
  expect(consumedDelete?.ok).toBe(false);
  expect(String(consumedDelete?.code || '')).toBe('TRAINER_APPROVAL_REQUIRED');

  const expiredApproval = await page.evaluate(() => {
    return window.AgentTownTrainerNamespacePlugin.issueApprovalToken({
      scopes: ['trainer.clear_traces'],
      ttlMs: 1,
      uses: 1,
    });
  });
  const expiredToken = String(expiredApproval?.token || '');
  expect(expiredToken.length).toBeGreaterThan(0);
  const expiresAtMs = Number(expiredApproval?.expiresAtMs || 0);
  expect(expiresAtMs).toBeGreaterThan(0);

  const expiredClear = await invokeTool(page, 'trainer_clear_traces', {
    approvalToken: expiredToken,
    __nowMs: expiresAtMs + 1,
  });
  expect(expiredClear?.ok).toBe(false);
  expect(String(expiredClear?.code || '')).toBe('TRAINER_APPROVAL_REQUIRED');
});

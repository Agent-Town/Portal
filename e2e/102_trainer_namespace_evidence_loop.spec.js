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

test('trainer.list_evidence supports deterministic freshness and expiry windows after invoke_action', async ({ page }) => {
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

  const invoke = await invokeTool(page, 'trainer_invoke_action', {
    actionId: 'canvas.image',
    params: { teamCode },
  });
  expect(invoke?.ok).toBe(true);

  const fresh = await invokeTool(page, 'trainer_list_evidence', {
    actionId: 'canvas.image',
    freshOnly: true,
  });
  expect(fresh?.ok).toBe(true);
  const freshRows = Array.isArray(fresh?.evidence) ? fresh.evidence : [];
  expect(freshRows.length).toBeGreaterThan(0);

  const first = freshRows[0] || {};
  expect(String(first?.actionId || '')).toBe('canvas.image');
  expect(first?.expired).toBe(false);
  expect(Number(first?.ttlMs || 0)).toBeGreaterThan(0);

  const atMs = Number(first?.atMs || 0);
  const ttlMs = Number(first?.ttlMs || 0);
  expect(atMs).toBeGreaterThan(0);
  const futureNow = atMs + ttlMs + 1;

  const allFuture = await invokeTool(page, 'trainer_list_evidence', {
    actionId: 'canvas.image',
    freshOnly: false,
    __nowMs: futureNow,
  });
  expect(allFuture?.ok).toBe(true);
  const allFutureRows = Array.isArray(allFuture?.evidence) ? allFuture.evidence : [];
  expect(allFutureRows.length).toBeGreaterThan(0);
  expect(allFutureRows.some((row) => row?.expired === true)).toBeTruthy();

  const freshFuture = await invokeTool(page, 'trainer_list_evidence', {
    actionId: 'canvas.image',
    freshOnly: true,
    __nowMs: futureNow,
  });
  expect(freshFuture?.ok).toBe(true);
  const freshFutureRows = Array.isArray(freshFuture?.evidence) ? freshFuture.evidence : [];
  expect(freshFutureRows.length).toBe(0);
});

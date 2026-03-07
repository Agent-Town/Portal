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

test('trainer namespace redacts secret-like values from diagnostics and avoids leaking raw secrets into debug panes', async ({ page }) => {
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

  const rawSecret = 'sk-live-abcdefghijklmnopqrstuvwxyz123456';

  const invoke = await invokeTool(page, 'trainer.invoke_action', {
    actionId: 'canvas.image',
    params: {
      teamCode,
      secretToken: rawSecret,
      authorization: `Bearer ${rawSecret}`,
    },
  });
  expect(invoke?.ok).toBe(true);

  const sessionContext = await invokeTool(page, 'trainer.get_session_context', {});
  expect(sessionContext?.ok).toBe(true);
  const sessionDump = JSON.stringify(sessionContext || {});
  expect(sessionDump).not.toContain(rawSecret);
  expect(sessionDump.toLowerCase()).toContain('redacted');

  const auditRows = Array.isArray(sessionContext?.trainerNamespace?.recentAudit)
    ? sessionContext.trainerNamespace.recentAudit
    : [];
  expect(auditRows.length).toBeGreaterThan(0);
  const invokeAudit = auditRows.find((row) => String(row?.tool || '') === 'trainer.invoke_action');
  expect(invokeAudit && typeof invokeAudit === 'object').toBeTruthy();
  expect(JSON.stringify(invokeAudit || {})).not.toContain(rawSecret);

  await page.getByTestId('agent-debug-tab-session').click();
  await expect.poll(async () => {
    const text = await page.getByTestId('agent-debug-session').textContent();
    return String(text || '').includes('"trainerNamespacePlugin"');
  }, { timeout: 8000 }).toBe(true);
  const sessionPaneText = String((await page.getByTestId('agent-debug-session').textContent()) || '');
  expect(sessionPaneText).not.toContain(rawSecret);

  await page.getByTestId('agent-debug-tab-traffic').click();
  const trafficPaneText = String((await page.getByTestId('agent-debug-traffic').textContent()) || '');
  expect(trafficPaneText).not.toContain(rawSecret);
});

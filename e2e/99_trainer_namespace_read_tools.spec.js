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
  await page.getByTestId('trainer-tool-name').selectOption(toolName);
  await page.getByTestId('trainer-tool-params').fill(JSON.stringify(params, null, 2));
  await page.getByTestId('trainer-tool-invoke').click();
  await expect(page.getByTestId('trainer-tool-result')).toContainText(`"tool": "${toolName}"`, { timeout: 5000 });
  return await page.evaluate(() => {
    const node = document.getElementById('trainerToolResult');
    return node ? JSON.parse(String(node.textContent || '{}')) : null;
  });
}

function runEpochMs(run) {
  const row = run && typeof run === 'object' ? run : {};
  const numCandidates = [
    row.createdAtMs,
    row.startedAtMs,
    row.updatedAtMs,
    row.timestampMs,
    row.stats && row.stats.startedAtMs,
    row.stats && row.stats.endedAtMs,
  ];
  for (const value of numCandidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  const textCandidates = [row.createdAt, row.startedAt, row.updatedAt];
  for (const value of textCandidates) {
    const parsed = Date.parse(String(value || ''));
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return 0;
}

test('trainer namespace read tools return deterministic run, event, and session context payloads', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer namespace read tools: first run');
  await runExperience(page, 'trainer namespace read tools: second run');

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const runsResult = await invokeTool(page, 'trainer.list_runs', { limit: 20 });
  expect(runsResult?.ok).toBe(true);
  const runs = Array.isArray(runsResult?.runs) ? runsResult.runs : [];
  expect(runs.length).toBeGreaterThan(0);

  const epochs = runs.map(runEpochMs).filter((value) => value > 0);
  for (let i = 1; i < epochs.length; i += 1) {
    expect(epochs[i - 1]).toBeGreaterThanOrEqual(epochs[i]);
  }

  const attemptId = String(runs[0]?.attemptId || '').trim();
  expect(attemptId.length).toBeGreaterThan(0);

  const runResult = await invokeTool(page, 'trainer.get_run', { attemptId });
  expect(runResult?.ok).toBe(true);
  expect(String(runResult?.attemptId || '')).toBe(attemptId);
  const run = runResult?.run && typeof runResult.run === 'object' ? runResult.run : {};

  const events = Array.isArray(run.events) ? run.events : [];
  const seq = Number(events[0]?.seq || 1);
  expect(Number.isFinite(seq)).toBe(true);
  expect(seq).toBeGreaterThan(0);

  const eventResult = await invokeTool(page, 'trainer.get_event', { attemptId, seq });
  expect(eventResult?.ok).toBe(true);
  expect(String(eventResult?.attemptId || '')).toBe(attemptId);
  expect(Number(eventResult?.seq || 0)).toBe(seq);
  expect(eventResult?.event && typeof eventResult.event === 'object').toBeTruthy();

  const sessionResult = await invokeTool(page, 'trainer.get_session_context', {});
  expect(sessionResult?.ok).toBe(true);
  expect(sessionResult?.sessionContext && typeof sessionResult.sessionContext === 'object').toBeTruthy();
  expect(sessionResult?.sessionContext?.runtimeContext && typeof sessionResult.sessionContext.runtimeContext === 'object').toBeTruthy();
});

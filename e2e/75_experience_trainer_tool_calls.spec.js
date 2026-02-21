const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  listTrainerAttemptIds,
  readTrainerEvents,
  openTrainerFromSidebar
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer records tool registry + requested/executed tool calls and inspector view', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: lite echo');

  await expect.poll(async () => (await listTrainerAttemptIds(page)).length, { timeout: 5000 }).toBeGreaterThan(0);
  const attemptIds = await listTrainerAttemptIds(page);
  const attemptId = attemptIds[attemptIds.length - 1];
  const events = await readTrainerEvents(page, attemptId);
  const types = events.map((event) => event.type);
  expect(types).toContain('tool.registry.snapshot');
  expect(types).toContain('llm.turn.start');
  expect(types).toContain('llm.turn.end');
  expect(types).toContain('tool.call.requested');
  expect(types).toContain('tool.call.executed');

  await openTrainerFromSidebar(page);
  await expect(page.getByTestId('trainer-root')).toBeVisible();

  const timeline = page.getByTestId('trainer-timeline');
  await expect(timeline.getByRole('button', { name: /tool.call.executed/i }).first()).toBeVisible({ timeout: 5000 });
  await timeline.getByRole('button', { name: /tool.call.executed/i }).first().click();

  const inspector = page.getByTestId('trainer-inspector');
  await expect(inspector).toContainText('tool: lite_echo');
  await expect(inspector).toContainText(/ok:\s+true/i);
});

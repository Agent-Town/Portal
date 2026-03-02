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

test('trainer surfaces TOOL_NOT_FOUND with one-click debugger context', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: missing tool');

  await expect.poll(async () => (await listTrainerAttemptIds(page)).length, { timeout: 5000 }).toBeGreaterThan(0);
  const attemptIds = await listTrainerAttemptIds(page);
  const attemptId = attemptIds[attemptIds.length - 1];
  const events = await readTrainerEvents(page, attemptId);
  const errEvent = events.find((event) => event.type === 'error' && event?.data?.kind === 'TOOL_NOT_FOUND');
  expect(errEvent).toBeTruthy();
  expect(errEvent?.data?.requestedToolName).toBe('trainer_missing_tool_probe');
  expect(typeof errEvent?.data?.toolRegistrySha256).toBe('string');
  expect(errEvent?.data?.toolRegistrySha256).toMatch(/^[0-9a-f]{64}$/);
  expect(typeof errEvent?.data?.turnId).toBe('string');
  expect(errEvent?.data?.turnId.length).toBeGreaterThan(0);

  await openTrainerFromSidebar(page);
  const timeline = page.getByTestId('trainer-timeline');
  await expect(timeline.getByRole('button', { name: /error/i }).first()).toBeVisible({ timeout: 5000 });
  await timeline.getByRole('button', { name: /error/i }).first().click();

  const inspector = page.getByTestId('trainer-inspector');
  await expect(inspector).toContainText('kind: TOOL_NOT_FOUND');
  await expect(inspector).toContainText('requestedToolName: trainer_missing_tool_probe');
  await expect(inspector).toContainText(/registryTools\(/);
});

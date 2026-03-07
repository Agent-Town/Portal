const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  listTrainerAttemptIds,
  readTrainerEvents
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer coaching mode records pending calls and intervention outcomes', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await page.evaluate(async () => {
    await window.__openclawLiteTest.trainerSetCoaching({ enabled: true, mode: 'reject' });
  });
  await runExperience(page, 'trainer probe: lite echo');

  await expect.poll(async () => (await listTrainerAttemptIds(page)).length, { timeout: 5000 }).toBeGreaterThan(0);
  let attemptIds = await listTrainerAttemptIds(page);
  let latestAttemptId = attemptIds[attemptIds.length - 1];
  let events = await readTrainerEvents(page, latestAttemptId);

  const pendingReject = events.find((event) => event.type === 'tool.call.pending');
  expect(pendingReject).toBeTruthy();
  const interventionReject = events.find((event) => event.type === 'human.intervention' && event?.data?.action === 'tool.reject');
  expect(interventionReject).toBeTruthy();
  const executedReject = events.find((event) => event.type === 'tool.call.executed' && event?.data?.error?.code === 'APPROVAL_REJECTED');
  expect(executedReject).toBeTruthy();

  await page.evaluate(async () => {
    await window.__openclawLiteTest.trainerSetCoaching({ enabled: true, mode: 'approve' });
  });
  await runExperience(page, 'trainer probe: lite echo');

  attemptIds = await listTrainerAttemptIds(page);
  latestAttemptId = attemptIds[attemptIds.length - 1];
  events = await readTrainerEvents(page, latestAttemptId);

  const pendingApprove = events.find((event) => event.type === 'tool.call.pending');
  expect(pendingApprove).toBeTruthy();
  const interventionApprove = events.find((event) => event.type === 'human.intervention' && event?.data?.action === 'tool.approve');
  expect(interventionApprove).toBeTruthy();
  const executedApprove = events.find((event) => event.type === 'tool.call.executed' && event?.data?.ok === true);
  expect(executedApprove).toBeTruthy();
});

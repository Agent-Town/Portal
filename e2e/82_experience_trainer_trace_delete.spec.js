const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  openTrainerFromSidebar,
  listTrainerAttemptIds
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer can delete one trace and clear all traces', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: lite echo');
  await runExperience(page, 'trainer probe: missing tool');

  await openTrainerFromSidebar(page);

  const attempts = page.getByTestId('trainer-attempts').getByRole('button');
  await expect(attempts).toHaveCount(2, { timeout: 5000 });

  const initialAttemptIds = await listTrainerAttemptIds(page);
  expect(initialAttemptIds).toHaveLength(2);

  await page.getByTestId('trainer-attempt-delete').first().click();

  await expect(page.getByTestId('trainer-attempts').getByRole('button')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#trainerStatusLine')).toContainText('Deleted local trace cache');

  const afterSingleDeleteIds = await listTrainerAttemptIds(page);
  expect(afterSingleDeleteIds).toHaveLength(1);

  await page.getByTestId('trainer-clear-all').click();

  await expect(page.getByTestId('trainer-attempts')).toContainText('No attempts yet.', { timeout: 5000 });
  await expect(page.locator('#trainerStatusLine')).toContainText('Cleared 1 local cache attempt');

  const afterClearAllIds = await listTrainerAttemptIds(page);
  expect(afterClearAllIds).toHaveLength(0);
});

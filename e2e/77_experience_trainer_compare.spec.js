const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  openTrainerFromSidebar
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer compare view summarizes multi-run metrics for N=3 attempts', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: lite echo');
  await runExperience(page, 'trainer probe: missing tool');
  await runExperience(page, 'trainer probe: lite echo');

  await openTrainerFromSidebar(page);

  const attempts = page.getByTestId('trainer-attempts').getByRole('button');
  await expect(attempts).toHaveCount(3, { timeout: 5000 });

  const compare = page.getByTestId('trainer-compare');
  await expect(compare).toContainText('Success rate:');
  await expect(compare).toContainText('Median duration:');
  await expect(compare).toContainText('Tool failure rates:');
  await expect(compare).toContainText('Divergence fingerprints:');
});

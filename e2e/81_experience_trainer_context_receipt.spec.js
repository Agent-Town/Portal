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

test('trainer inspector shows context receipt raw payload, provenance, and diff', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: lite echo');
  await runExperience(page, 'trainer probe: missing tool');

  await openTrainerFromSidebar(page);
  await expect(page.getByTestId('trainer-attempts').getByRole('button').first()).toBeVisible({ timeout: 5000 });
  await page.getByTestId('trainer-attempts').getByRole('button').first().click();

  const advancedToggle = page.locator('#trainerAdvancedToggle');
  if (!(await advancedToggle.isChecked())) {
    await advancedToggle.check();
  }

  const timeline = page.getByTestId('trainer-timeline');
  await expect(timeline.getByRole('button', { name: /llm.turn.start/i }).first()).toBeVisible({ timeout: 5000 });
  await timeline.getByRole('button', { name: /llm.turn.start/i }).first().click();

  const inspector = page.getByTestId('trainer-inspector');
  await expect(inspector).toContainText('llmRequest.system:');
  await expect(inspector).toContainText('llmRequest.messages:');
  await expect(inspector).toContainText('llmRequest.tools:');
  await expect(inspector).toContainText('provenance.sections:');
  await expect(inspector).toContainText('runtime-context');
  await expect(inspector).toContainText('active-skill');
  await expect(inspector).toContainText('tool-registry');
  await expect(inspector).toContainText('diff.vs.previous:');
  await expect(inspector).not.toContainText('(no previous receipt)');
});

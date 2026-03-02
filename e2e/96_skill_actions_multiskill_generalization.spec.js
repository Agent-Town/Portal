const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  openTrainerFromSidebar,
  openTrainerToolsTab,
  listTrainerToolNames
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('plugin generalizes across multiple skills without hardcoded per-skill adapters', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);

  let visit = await visitSkill(page, '/fixtures/skill-actions-explicit/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  let toolNames = await listTrainerToolNames(page);
  expect(toolNames).toContain('skill_action.health.check');

  visit = await visitSkill(page, '/fixtures/skill-actions-security/skill.md');
  expect(visit?.ok).toBe(true);

  await page.evaluate(async () => {
    if (typeof window.__agentTownTrainerRefresh === 'function') {
      await window.__agentTownTrainerRefresh();
    }
  });

  toolNames = await listTrainerToolNames(page);
  expect(toolNames).toContain('skill_action.cross.origin.block');
  expect(toolNames).not.toContain('skill_action.health.check');
});

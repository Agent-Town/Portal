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

test('dynamic skill action tool set updates when active skill changes', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);

  const firstVisit = await visitSkill(page, '/fixtures/skill-actions-explicit/skill.md');
  expect(firstVisit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  let toolNames = await listTrainerToolNames(page);
  expect(toolNames).toContain('skill_action.health.check');

  const secondVisit = await visitSkill(page, '/skill.md');
  expect(secondVisit?.ok).toBe(true);

  await page.evaluate(async () => {
    if (typeof window.__agentTownTrainerRefresh === 'function') {
      await window.__agentTownTrainerRefresh();
    }
  });

  toolNames = await listTrainerToolNames(page);
  expect(toolNames).not.toContain('skill_action.health.check');
  expect(toolNames.some((name) => name.startsWith('skill_action.canvas'))).toBeTruthy();
});

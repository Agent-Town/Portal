const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  openTrainerFromSidebar,
  openTrainerToolsTab,
  listTrainerToolNames,
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer namespace tools are discoverable when enabled', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await openTrainerFromSidebar(page);
  await openTrainerToolsTab(page);

  const enabledTools = await listTrainerToolNames(page);
  expect(enabledTools).toContain('trainer_list_runs');
  expect(enabledTools).toContain('trainer_list_actions');
  expect(enabledTools).toContain('trainer_invoke_action');
  const trainerTools = enabledTools.filter((name) => String(name || '').startsWith('trainer'));
  expect(trainerTools.some((name) => String(name || '').includes('.'))).toBe(false);
});

test('runtime feature flag cannot be bypassed by query/localStorage overrides', async ({ page }) => {
  await gotoAppWithLite(page, { trainerNamespace: true });

  const result = await page.evaluate(() => {
    const plugin = window.AgentTownTrainerNamespacePlugin;
    if (!plugin || typeof plugin.resolveEnabled !== 'function') return null;
    localStorage.setItem('agentTown:feature:trainerNamespace', '1');
    const fromQuery = plugin.resolveEnabled({
      runtimeFeatureFlag: false,
      locationSearch: '?trainerNamespace=1',
      storageOverride: null,
    });
    localStorage.removeItem('agentTown:feature:trainerNamespace');
    const fromStorageOverride = plugin.resolveEnabled({
      runtimeFeatureFlag: false,
      storageOverride: true,
      locationSearch: '',
    });
    return {
      fromQuery,
      fromStorageOverride,
    };
  });

  expect(result).toBeTruthy();
  expect(result.fromQuery).toBe(false);
  expect(result.fromStorageOverride).toBe(false);
});

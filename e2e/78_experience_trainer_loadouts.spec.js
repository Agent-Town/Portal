const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  setDeterministicLlm,
  visitSkill,
  runExperience,
  listTrainerAttemptIds,
  readTrainerManifest,
  openTrainerFromSidebar
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('trainer tracks loadout manifests/checkpoints and allows active loadout selection', async ({ page }) => {
  await gotoAppWithLite(page);
  await setDeterministicLlm(page);
  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: lite echo');

  await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    await api.workspaceWriteFile({ path: 'workspace/SKILL.md', content: '# SKILL\n\nCheckpoint A.\n' });
    await api.workspaceWriteFile({ path: 'workspace/tools.md', content: '# tools\n\nallow lite_echo only\n' });
    await api.setLlmConfig({
      provider: 'test-local',
      modelId: 'deterministic',
      modelRef: 'test-local/deterministic',
      api: 'openai-completions',
      apiKey: 'trainer-test-key',
      reasoning: 'high',
      useProxy: true
    });
  });

  await runExperience(page, 'trainer probe: lite echo');

  const loadoutsResult = await page.evaluate(async () => {
    return await window.__openclawLiteTest.trainerListLoadouts({ questId: 'portal_onboarding_v1' });
  });
  expect(loadoutsResult?.ok).toBe(true);
  const loadouts = loadoutsResult?.data?.loadouts || [];
  expect(loadouts.length).toBeGreaterThanOrEqual(2);
  expect(typeof loadoutsResult?.data?.activeLoadoutId).toBe('string');
  expect(loadoutsResult.data.activeLoadoutId.length).toBeGreaterThan(0);

  const attemptIds = await listTrainerAttemptIds(page);
  expect(attemptIds.length).toBeGreaterThanOrEqual(2);
  for (const attemptId of attemptIds) {
    const manifest = await readTrainerManifest(page, attemptId);
    expect(typeof manifest?.loadoutId).toBe('string');
    expect(manifest.loadoutId.length).toBeGreaterThan(0);
  }

  const beforeActive = loadoutsResult?.data?.activeLoadoutId;
  await openTrainerFromSidebar(page);
  const useButtons = page.getByTestId('trainer-loadouts').getByRole('button', { name: 'Use' });
  await expect(useButtons.first()).toBeVisible({ timeout: 5000 });
  await useButtons.first().click();

  await expect.poll(async () => {
    const result = await page.evaluate(async () => {
      return await window.__openclawLiteTest.trainerListLoadouts({ questId: 'portal_onboarding_v1' });
    });
    return result?.data?.activeLoadoutId || null;
  }, { timeout: 5000 }).not.toBe(beforeActive);
});

const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readPathname
} = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('AC-63: OpenClaw Lite opens Progression Atlas and saves selected strategy through visible UI', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const result = await invokeExperienceTool(page, 'agent_town_ui_open_progression_atlas', {
    strategyKey: 'rush-hq3'
  });

  expect(await readPathname(page)).toBe('/app');
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Progression Atlas');
  expect(result?.ok).toBe(true);
  expect(result?.applied).toBe(true);
  expect(result?.stateSnapshot?.progressionAtlas?.strategyKey).toBe('rush-hq3');

  const atlasFrame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await expect(atlasFrame.getByTestId('progression-atlas-root')).toBeVisible();
  await expect(atlasFrame.getByText('Rush HQ3').first()).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-strategy-compare')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-balanced-food-wood').getByText('Balanced Food-Wood')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-balanced-food-wood').getByText('More legible for new players')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('Delegate Outputs First')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('collectOutputs checkpoint')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('collectOutputs, queueProduction')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-tree')).toBeVisible();
  const farmTreeNode = atlasFrame.getByTestId('progression-atlas-tree-node-building_farm_plot_place');
  await expect(farmTreeNode.getByLabel('Food chain')).toBeVisible();
  await expect(farmTreeNode.locator('img[src="/assets/icons/agent-town/farm-plot-gpt-image-2-v1.png"]')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-tree-node-hq_level_3').getByLabel('HQ Level 3')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-hq_level_3')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-building_farm_plot_place').getByRole('heading', { name: 'Build Farm Plot' })).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-building_quarry_place').getByRole('heading', { name: 'Build Quarry' })).toBeVisible();

  const beforeAtlas = await page.evaluate(async () => {
    const res = await fetch('/api/founders-plot/progression-atlas', { credentials: 'include' });
    return await res.json();
  });
  expect(beforeAtlas?.ok).toBe(true);
  expect(beforeAtlas?.gameplayStableHash).toMatch(/^[a-f0-9]{64}$/);

  await atlasFrame.getByTestId('progression-atlas-draft-delegate-outputs-first').click();
  await expect(atlasFrame.getByTestId('progression-atlas-recommended-strategy').getByRole('heading', { name: 'Delegate Outputs First' })).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-tree-node-foreman_collect_outputs').locator('.atlasTreeIcon[aria-label="Foreman output collection"]')).toBeVisible();

  await atlasFrame.getByTestId('progression-atlas-save-strategy').click();
  await expect(atlasFrame.getByTestId('progression-atlas-selected-strategy')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-saved-strategies').getByText('Delegate Outputs First')).toBeVisible();

  const afterAtlas = await page.evaluate(async () => {
    const res = await fetch('/api/founders-plot/progression-atlas', { credentials: 'include' });
    return await res.json();
  });
  expect(afterAtlas?.ok).toBe(true);
  expect(afterAtlas?.gameplayStableHash).toBe(beforeAtlas.gameplayStableHash);
  expect(afterAtlas?.atlas?.selectedStrategyId).toBeTruthy();
  expect(afterAtlas?.atlas?.strategies?.find((strategy) => strategy.selected)?.strategyKey).toBe('delegate-outputs-first');
  expect(afterAtlas?.gameplaySnapshot?.audit?.eventCount).toBe(beforeAtlas.gameplaySnapshot.audit.eventCount);
  expect(afterAtlas?.gameplaySnapshot?.plot?.inventory).toEqual(beforeAtlas.gameplaySnapshot.plot.inventory);
});

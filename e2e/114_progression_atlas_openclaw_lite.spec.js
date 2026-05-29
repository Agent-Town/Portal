const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readPathname
} = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function runLiteTool(page, tool, params = {}) {
  const result = await page.evaluate(async ({ toolName, toolParams }) => {
    const api = window.__openclawLiteTest;
    if (!api || typeof api.runTool !== 'function') {
      throw new Error('window.__openclawLiteTest.runTool is not available');
    }
    return await api.runTool({ tool: toolName, params: toolParams || {} });
  }, { toolName: tool, toolParams: params });
  const text = result?.content?.[0]?.text || '{}';
  return JSON.parse(text);
}

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
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-coverage')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-status-legend').getByText('DONE')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-status-legend').getByText('AVAILABLE')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-building_WORKSHOP_place').getByText('Build Workshop')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-building_MARKET_STALL_place').getByText('Build Market Stall')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-permission_sellSurplusFood_unlock').getByText('Sell surplus food')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-reward_hq_level-5_claim').getByText('Claim Founder stipend')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-strategy-compare')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-balanced-food-wood').getByText('Balanced Food-Wood')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-balanced-food-wood').getByText('More legible for new players')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('Delegate Outputs First')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('collectOutputs checkpoint')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('collectOutputs, queueProduction')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-hq10-horizon').getByText('HQ10 Horizon')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-hq10-horizon').getByText('World Grid Civilization')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-hq10-horizon')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-horizon-hq6').getByText('HQ6: Expedition Board')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-horizon-hq10').getByText('HQ10: World Grid Civilization')).toBeVisible();
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

  await atlasFrame.getByTestId('progression-atlas-draft-hq10-horizon').click();
  await expect(atlasFrame.getByTestId('progression-atlas-recommended-strategy').getByRole('heading', { name: 'HQ10 Horizon' })).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-tree-node-future_hq_10_world_grid_civilization')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-future_hq_10_world_grid_civilization').getByRole('heading', { name: 'HQ10: World Grid Civilization' })).toBeVisible();

  await atlasFrame.getByTestId('progression-atlas-draft-delegate-outputs-first').click();
  await expect(atlasFrame.getByTestId('progression-atlas-recommended-strategy').getByRole('heading', { name: 'Delegate Outputs First' })).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-tree-node-foreman_collect_outputs').locator('.atlasTreeIcon[aria-label="Foreman output collection"]')).toBeVisible();

  await atlasFrame.getByTestId('progression-atlas-save-strategy').click();
  await expect(atlasFrame.getByTestId('progression-atlas-selected-strategy')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-saved-strategies').getByText('Delegate Outputs First')).toBeVisible();

  await atlasFrame.getByTestId('progression-atlas-open-editor').click();
  await expect(atlasFrame.getByTestId('progression-atlas-editor')).toBeVisible();
  await atlasFrame.getByTestId('progression-atlas-editor-add-step').click();
  await expect(atlasFrame.getByTestId('progression-atlas-editor-title')).toHaveValue('Scout Ridge');
  await atlasFrame.getByTestId('progression-atlas-editor-reason').fill('Sketch a player-authored scout step after HQ3 planning.');
  await atlasFrame.getByTestId('progression-atlas-editor-before').selectOption('hq.level.3');
  await atlasFrame.getByTestId('progression-atlas-editor-after').selectOption('foreman.queue_production');
  await atlasFrame.getByTestId('progression-atlas-editor-icon-prompt').fill('frontier ridge scout marker, Agent Town strategy icon');
  await atlasFrame.getByTestId('progression-atlas-editor-generate-icon').click();
  await expect(atlasFrame.getByTestId('progression-atlas-explanation')).toContainText('Attached a GenAI icon draft');
  await atlasFrame.getByTestId('progression-atlas-editor-save').click();
  await expect(atlasFrame.getByTestId('progression-atlas-saved-strategies').getByText('Delegate Outputs First Edited')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-editor_custom_11').getByRole('heading', { name: 'Scout Ridge' })).toBeVisible();

  const afterAtlas = await page.evaluate(async () => {
    const res = await fetch('/api/founders-plot/progression-atlas', { credentials: 'include' });
    return await res.json();
  });
  expect(afterAtlas?.ok).toBe(true);
  expect(afterAtlas?.gameplayStableHash).toBe(beforeAtlas.gameplayStableHash);
  expect(afterAtlas?.atlas?.selectedStrategyId).toBeTruthy();
  const selected = afterAtlas?.atlas?.strategies?.find((strategy) => strategy.selected);
  expect(selected?.strategyKey).toBe('custom-delegate_outputs_first_edited');
  expect(selected?.steps?.find((step) => step.title === 'Scout Ridge')?.icon?.generatedBy).toBe('progression_atlas_genai_icon_prompt_v1');
  expect(selected?.steps?.find((step) => step.title === 'Scout Ridge')?.beforeStepId).toBe('hq.level.3');
  expect(selected?.steps?.find((step) => step.title === 'Scout Ridge')?.afterStepId).toBe('foreman.queue_production');
  expect(afterAtlas?.gameplaySnapshot?.audit?.eventCount).toBe(beforeAtlas.gameplaySnapshot.audit.eventCount);
  expect(afterAtlas?.gameplaySnapshot?.plot?.inventory).toEqual(beforeAtlas.gameplaySnapshot.plot.inventory);
});

test('AC-64: OpenClaw Lite saves private Progression Atlas editor steps without gameplay mutation', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const beforeEnvelope = await runLiteTool(page, 'agent_town_progression_get_state');
  expect(beforeEnvelope?.ok).toBe(true);
  const beforeAtlas = beforeEnvelope?.data?.atlas;
  expect(beforeAtlas?.ok).toBe(true);
  expect(beforeAtlas?.atlas?.futureHorizon?.targetHqLevel).toBe(10);
  expect(beforeAtlas?.atlas?.strategyOptions?.find((strategy) => strategy.strategyKey === 'hq10-horizon')?.compare?.futureMilestones?.length).toBe(5);
  const beforeGameplayHash = beforeAtlas.gameplayStableHash;
  const beforeEventCount = beforeAtlas.gameplaySnapshot.audit.eventCount;
  const beforeInventory = beforeAtlas.gameplaySnapshot.plot.inventory;

  const iconEnvelope = await runLiteTool(page, 'agent_town_progression_generate_icon_draft', {
    title: 'Survey Crossing',
    prompt: 'cozy frontier-tech survey crossing marker, Agent Town strategy icon'
  });
  expect(iconEnvelope?.ok).toBe(true);
  const iconResult = iconEnvelope?.data?.icon;
  expect(iconResult?.ok).toBe(true);
  expect(iconResult.gameplayStableHash).toBe(beforeGameplayHash);
  expect(iconResult.icon.generatedBy).toBe('progression_atlas_genai_icon_prompt_v1');
  expect(iconResult.icon.genAi.prompt).toContain('survey crossing');

  const saveEnvelope = await runLiteTool(page, 'agent_town_progression_save_edited_strategy', {
    title: 'Atlas Co-Edit Sketch',
    goal: 'Let the visible browser agent help draft future expansion planning without changing gameplay.',
    summary: 'OpenClaw Lite-authored private Strategy Editor plan.',
    focus: ['Agent co-edit', 'Private plan', 'No gameplay mutation'],
    steps: [
      {
        stepId: 'editor.survey_crossing',
        title: 'Survey Crossing',
        reason: 'Mark a possible crossing after HQ3 planning.',
        nextAction: 'Review once expedition tools exist.',
        afterStepId: 'editor.second_plot_note',
        icon: iconResult.icon
      },
      {
        stepId: 'editor.second_plot_note',
        title: 'Second Plot Note',
        reason: 'Keep the expansion idea private until canonical scouting exists.',
        nextAction: 'Wait for Expedition Board tools.',
        beforeStepId: 'editor.survey_crossing'
      }
    ],
    select: true
  });
  expect(saveEnvelope?.ok).toBe(true);
  const saved = saveEnvelope?.data?.saved;
  expect(saved?.ok).toBe(true);
  expect(saved.gameplayStableHash).toBe(beforeGameplayHash);
  expect(saved.strategy.generatedBy).toBe('progression_atlas_strategy_editor_v1');
  expect(saved.strategy.steps.find((step) => step.stepId === 'editor.survey_crossing')?.afterStepId).toBe('editor.second_plot_note');
  expect(saved.strategy.steps.find((step) => step.stepId === 'editor.survey_crossing')?.icon?.generatedBy).toBe('progression_atlas_genai_icon_prompt_v1');

  const afterEnvelope = await runLiteTool(page, 'agent_town_progression_get_state');
  expect(afterEnvelope?.ok).toBe(true);
  const afterAtlas = afterEnvelope?.data?.atlas;
  expect(afterAtlas?.ok).toBe(true);
  expect(afterAtlas.gameplayStableHash).toBe(beforeGameplayHash);
  expect(afterAtlas.gameplaySnapshot.audit.eventCount).toBe(beforeEventCount);
  expect(afterAtlas.gameplaySnapshot.plot.inventory).toEqual(beforeInventory);
  const selected = afterAtlas.atlas.strategies.find((strategy) => strategy.selected);
  expect(selected?.title).toBe('Atlas Co-Edit Sketch');
  expect(selected?.steps.find((step) => step.title === 'Survey Crossing')).toBeTruthy();
});

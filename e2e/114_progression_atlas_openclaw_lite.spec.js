const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readPathname
} = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.setTimeout(90_000);

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
  await expect(page.locator('#districtModalTitle')).toHaveText('Founders Plot');
  expect(result?.ok).toBe(true);
  expect(result?.applied).toBe(true);
  expect(result?.stateSnapshot?.progressionAtlas?.strategyKey).toBe('rush-hq3');

  const foundersFrame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await expect(foundersFrame.getByTestId('fp-open-progression-atlas')).toBeVisible();
  await expect(foundersFrame.getByTestId('fp-progression-atlas-backdrop')).toBeVisible();
  const atlasFrame = foundersFrame.frameLocator('iframe[data-testid="fp-progression-atlas-frame"]');
  await expect(atlasFrame.getByTestId('progression-atlas-root')).toBeVisible();
  await expect(atlasFrame.getByText('Rush HQ3').first()).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-authority-boundary').getByText('Atlas executable actions')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-authority-boundary').getByText('metadata only').first()).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-work-order-brief').getByRole('heading', { name: 'Collect Ready Outputs Once' })).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-work-order-brief').getByText('No scheduler')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-world-grid-brief').getByText('HQ10: World Grid Civilization')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-world-grid-brief').getByText('Mutation policy: Advisory Only')).toBeVisible();
  const civicOps = atlasFrame.getByTestId('progression-atlas-civic-operations');
  await expect(civicOps.getByRole('heading', { name: 'HQ10D Current Public Work' })).toBeVisible();
  await expect(civicOps.getByRole('heading', { name: 'HQ11 Readiness' })).toBeVisible();
  await expect(civicOps.getByText('Atlas shows action references, lifecycle gates, receipts, and world deltas as metadata.')).toBeVisible();
  await expect(civicOps.getByText('Atlas executable actions: 0')).toBeVisible();
  await expect(civicOps.getByText('HQ11 readiness: advisory until a canonical server model exists')).toBeVisible();
  await expect(civicOps.getByText('Visual Actor Roles')).toBeVisible();
  await expect(civicOps.getByText('Civic Routekeeper: visual route/readiness steward only')).toBeVisible();
  await expect(atlasFrame.locator('img[src="/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp"]').first()).toBeVisible();
  await expect(atlasFrame.locator('img[src="/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.webp"]').first()).toBeVisible();
  await expect(atlasFrame.locator('img[src="/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.webp"]').first()).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-coverage')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-status-legend').getByText('DONE')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-status-legend').getByText('AVAILABLE')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-hq_upgrade_4').getByText('Upgrade HQ to Level 4')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-building_WORKSHOP_place').getByText('Build Workshop')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-building_MARKET_STALL_place').getByText('Build Market Stall')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-building_EXPEDITION_BOARD_place').getByText('Build Expedition Board')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-production_EXPEDITION_BOARD_SCOUT').getByText('Dispatch scout from Expedition Board')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-permission_sellSurplusFood_unlock').getByText('Sell surplus food')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-canonical-reward_hq_level-5_claim').getByText('Claim Founder stipend')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-engine-graph')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-engine-node-hq_level_3')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-engine-node-production_EXPEDITION_BOARD_SCOUT')).toBeVisible();
  await atlasFrame.getByTestId('progression-atlas-engine-node-hq_level_3').click();
  await expect(atlasFrame.getByTestId('progression-atlas-engine-inspector').getByText('hq.level.3')).toBeVisible();
  await atlasFrame.getByTestId('progression-atlas-engine-node-hq_upgrade_4').click();
  await expect(atlasFrame.getByTestId('progression-atlas-engine-inspector').getByText('Expedition Board READY')).toBeVisible();
  await atlasFrame.getByTestId('progression-atlas-engine-node-building_LUMBER_CAMP_place').click();
  await expect(atlasFrame.getByTestId('progression-atlas-action-ref-boundary')).toContainText('Non-executable action ref');
  await expect(atlasFrame.getByTestId('progression-atlas-action-ref-boundary')).toContainText('Atlas cannot execute this ref');
  await expect(atlasFrame.getByTestId('progression-atlas-strategy-compare')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-balanced-food-wood').getByText('Balanced Food-Wood')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-balanced-food-wood').getByText('More legible for new players')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('Delegate Outputs First')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('collectOutputs checkpoint')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-delegate-outputs-first').getByText('collectOutputs, queueProduction')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-hq10-horizon').getByText('HQ10 Horizon')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-compare-hq10-horizon').getByText('World Grid Civilization')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-hq10-horizon')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-engine-node-hq_level_6')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-horizon-hq7').getByText('HQ7: Settler Convoy')).toBeVisible();
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
  await expect(atlasFrame.getByTestId('progression-atlas-editor-gate')).toBeVisible();
  await atlasFrame.getByTestId('progression-atlas-editor-gate-title').fill('Scout Ridge Camp');
  await atlasFrame.getByTestId('progression-atlas-editor-gate-wood').fill('32');
  await atlasFrame.getByTestId('progression-atlas-editor-gate-stone').fill('8');
  await atlasFrame.getByTestId('progression-atlas-editor-gate-hq').fill('3');
  await atlasFrame.getByTestId('progression-atlas-editor-create-gate').click();
  await expect(atlasFrame.getByTestId('progression-atlas-explanation')).toContainText('Attached draft resource gate');
  await atlasFrame.getByTestId('progression-atlas-editor-before').selectOption('hq.level.3');
  await atlasFrame.getByTestId('progression-atlas-editor-after').selectOption('foreman.queue_production');
  await atlasFrame.getByTestId('progression-atlas-editor-icon-prompt').fill('frontier ridge scout marker, Agent Town strategy icon');
  await atlasFrame.getByTestId('progression-atlas-editor-generate-icon').click();
  await expect(atlasFrame.getByTestId('progression-atlas-explanation')).toContainText('Attached a GenAI icon draft');
  await atlasFrame.getByTestId('progression-atlas-editor-save').click();
  await expect(atlasFrame.getByTestId('progression-atlas-saved-strategies').getByText('Delegate Outputs First Edited')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-editor_custom_11').getByRole('heading', { name: 'Scout Ridge' })).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-editor_custom_11').getByTestId('progression-atlas-resource-gate').getByText('Scout Ridge Camp')).toBeVisible();
  await expect(atlasFrame.getByTestId('progression-atlas-step-editor_custom_11').getByTestId('progression-atlas-resource-gate').getByText('wood 32, stone 8')).toBeVisible();

  const afterAtlas = await page.evaluate(async () => {
    const res = await fetch('/api/founders-plot/progression-atlas', { credentials: 'include' });
    return await res.json();
  });
  expect(afterAtlas?.ok).toBe(true);
  expect(afterAtlas?.gameplayStableHash).toMatch(/^[a-f0-9]{64}$/);
  expect(afterAtlas?.atlas?.selectedStrategyId).toBeTruthy();
  const selected = afterAtlas?.atlas?.strategies?.find((strategy) => strategy.selected);
  expect(selected?.strategyKey).toBe('custom-delegate_outputs_first_edited');
  expect(selected?.steps?.find((step) => step.title === 'Scout Ridge')?.icon?.generatedBy).toBe('progression_atlas_genai_icon_prompt_v1');
  expect(selected?.steps?.find((step) => step.title === 'Scout Ridge')?.beforeStepId).toBe('hq.level.3');
  expect(selected?.steps?.find((step) => step.title === 'Scout Ridge')?.afterStepId).toBe('foreman.queue_production');
  const scoutGate = selected?.steps?.find((step) => step.title === 'Scout Ridge')?.resourceGate;
  expect(scoutGate?.canonicalNodeId).toBeNull();
  expect(scoutGate?.gateId).toContain('scout_ridge_camp');
  expect(scoutGate?.estimatedCost).toEqual({ wood: 32, stone: 8 });
  expect(scoutGate?.requirements?.items?.find((item) => item.resource === 'HQ')?.required).toBe(3);
  expect(scoutGate?.source).toBe('strategy_editor_gate_draft_v1');
  expect(scoutGate?.promotionStatus).toBe('draft');
  expect(afterAtlas?.gameplaySnapshot?.audit?.eventCount).toBe(beforeAtlas.gameplaySnapshot.audit.eventCount);
  expect(afterAtlas?.gameplaySnapshot?.plot?.inventory).toEqual(beforeAtlas.gameplaySnapshot.plot.inventory);

  await atlasFrame.getByTestId('progression-atlas-engine-node-hq_level_3').click();
  await atlasFrame.getByTestId('progression-atlas-engine-proposal-title').fill('Expedition Board Proposal');
  await atlasFrame.getByTestId('progression-atlas-engine-proposal-wood').fill('44');
  await atlasFrame.getByTestId('progression-atlas-engine-proposal-stone').fill('20');
  await atlasFrame.getByTestId('progression-atlas-engine-proposal-hq').fill('3');
  await atlasFrame.getByTestId('progression-atlas-engine-draft-proposal').click();
  await expect(atlasFrame.getByTestId('progression-atlas-explanation')).toContainText('draft engine-graph proposal');
  await expect(atlasFrame.getByTestId('progression-atlas-editor-title')).toHaveValue('Expedition Board Proposal');
  await atlasFrame.getByTestId('progression-atlas-editor-save').click();
  await expect(atlasFrame.getByTestId('progression-atlas-step-editor_engine_expedition_board_proposal').getByTestId('progression-atlas-resource-gate').getByText('wood 44, stone 20')).toBeVisible();

  const afterProposalAtlas = await page.evaluate(async () => {
    const res = await fetch('/api/founders-plot/progression-atlas', { credentials: 'include' });
    return await res.json();
  });
  expect(afterProposalAtlas?.ok).toBe(true);
  expect(afterProposalAtlas?.gameplayStableHash).toMatch(/^[a-f0-9]{64}$/);
  expect(afterProposalAtlas?.gameplaySnapshot?.audit?.eventCount).toBe(beforeAtlas.gameplaySnapshot.audit.eventCount);
  expect(afterProposalAtlas?.gameplaySnapshot?.plot?.inventory).toEqual(beforeAtlas.gameplaySnapshot.plot.inventory);
  const proposalStrategy = afterProposalAtlas?.atlas?.strategies?.find((strategy) => strategy.selected);
  const proposalStep = proposalStrategy?.steps?.find((step) => step.title === 'Expedition Board Proposal');
  expect(proposalStep?.canonicalProposal?.parentNodeId).toBe('hq.level.3');
  expect(proposalStep?.canonicalProposal?.promotionStatus).toBe('draft');
  expect(proposalStep?.canonicalProposal?.authorityBoundary).toBe('requires_engine_promotion');
  expect(proposalStep?.resourceGate?.estimatedCost).toEqual({ wood: 44, stone: 20 });
  expect(proposalStep?.resourceGate?.requirements?.items?.find((item) => item.resource === 'HQ')?.required).toBe(3);
});

test('AC-64: OpenClaw Lite saves private Progression Atlas editor steps without gameplay mutation', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const beforeEnvelope = await runLiteTool(page, 'agent_town_progression_get_state');
  expect(beforeEnvelope?.ok).toBe(true);
  const beforeAtlas = beforeEnvelope?.data?.atlas;
  expect(beforeAtlas?.ok).toBe(true);
  expect(beforeAtlas?.atlas?.futureHorizon?.targetHqLevel).toBe(10);
  expect(beforeAtlas?.atlas?.strategyOptions?.find((strategy) => strategy.strategyKey === 'hq10-horizon')?.compare?.futureMilestones?.length).toBe(4);
  const beforeEventCount = beforeAtlas.gameplaySnapshot.audit.eventCount;
  const beforeInventory = beforeAtlas.gameplaySnapshot.plot.inventory;

  const iconEnvelope = await runLiteTool(page, 'agent_town_progression_generate_icon_draft', {
    title: 'Survey Crossing',
    prompt: 'cozy frontier-tech survey crossing marker, Agent Town strategy icon'
  });
  expect(iconEnvelope?.ok).toBe(true);
  const iconResult = iconEnvelope?.data?.icon;
  expect(iconResult?.ok).toBe(true);
  expect(iconResult.plotId).toBe(beforeAtlas.plotId);
  expect(iconResult.gameplayStableHash).toMatch(/^[a-f0-9]{64}$/);
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
        resourceGate: { canonicalNodeId: 'hq.level.2' },
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
  expect(saved.gameplayStableHash).toMatch(/^[a-f0-9]{64}$/);
  expect(saved.strategy.generatedBy).toBe('progression_atlas_strategy_editor_v1');
  expect(saved.strategy.steps.find((step) => step.stepId === 'editor.survey_crossing')?.afterStepId).toBe('editor.second_plot_note');
  expect(saved.strategy.steps.find((step) => step.stepId === 'editor.survey_crossing')?.icon?.generatedBy).toBe('progression_atlas_genai_icon_prompt_v1');
  expect(saved.strategy.steps.find((step) => step.stepId === 'editor.survey_crossing')?.resourceGate?.estimatedCost).toEqual({ wood: 20, food: 10 });

  const afterEnvelope = await runLiteTool(page, 'agent_town_progression_get_state');
  expect(afterEnvelope?.ok).toBe(true);
  const afterAtlas = afterEnvelope?.data?.atlas;
  expect(afterAtlas?.ok).toBe(true);
  expect(afterAtlas.gameplayStableHash).toMatch(/^[a-f0-9]{64}$/);
  expect(afterAtlas.gameplaySnapshot.audit.eventCount).toBe(beforeEventCount);
  expect(afterAtlas.gameplaySnapshot.plot.inventory).toEqual(beforeInventory);
  const selected = afterAtlas.atlas.strategies.find((strategy) => strategy.selected);
  expect(selected?.title).toBe('Atlas Co-Edit Sketch');
  expect(selected?.steps.find((step) => step.title === 'Survey Crossing')).toBeTruthy();
});

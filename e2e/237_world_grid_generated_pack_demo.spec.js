const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('generated universe pack loads into Three.js and completes the first world-grid loop', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/experiences/world-grid/index.html?worldGridFeatureFlags=all');
  await expect(page.getByText('Territory survey ready')).toBeVisible();
  await expect(page.locator('[data-world-grid-stage][data-renderer="three"]')).toBeVisible();

  await page.locator('[data-world-grid-prompt]').fill('cozy mushroom frontier with clockwork gardeners and lantern moss');
  await page.getByRole('button', { name: 'Generate pack' }).click();

  await expect(page.locator('[data-world-grid-pack-status]')).toContainText(/pack validated/i);
  await expect(page.locator('[data-world-grid-generated-summary]')).toContainText('Cozy Mushroom Charter');
  await expect(page.locator('[data-world-grid-generated-summary]')).toContainText('complete the first claim');

  const generatedPack = await page.evaluate(() => window.__worldGridTest.getGeneratedPack());
  expect(generatedPack?.validationReport?.ok).toBe(true);
  expect(generatedPack?.prompt?.normalizedPrompt).toBeUndefined();
  expect(generatedPack?.generationBrief?.schemaVersion).toBe('agent-town-generation-brief-v1');
  expect(generatedPack?.generationBrief?.safety?.status).toBe('passed');
  expect(generatedPack?.assetPromptPlan?.targets?.length).toBe(23);
  expect(generatedPack?.assetPromptPlan?.targets?.every((asset) => asset.promptHash && asset.candidateOutputPath && asset.approvedOutputPath && asset.jobLogPath)).toBe(true);
  expect(generatedPack?.assetScaffold?.productionImageAssetCount).toBe(0);
  expect(generatedPack?.gameplayMapping?.canonicalEntities?.some((item) => item.canonicalId === 'resource.wood' && item.mechanicalKey === 'wood')).toBe(true);
  expect(generatedPack?.techFlavorTree?.nodes?.length).toBeGreaterThan(0);
  expect(generatedPack?.validationReport?.metrics?.canonicalEffectCoverage).toBe(1);
  expect(generatedPack?.validationReport?.metrics?.unlockRulesPreserved).toBe(true);
  await expect(page.locator('[data-world-grid-generated-summary]')).toContainText(generatedPack.techFlavorTree.nodes[0].generatedName);
  expect(generatedPack?.approvedModifiers?.selectedModifiers?.length).toBeGreaterThan(0);
  expect(generatedPack?.validationReport?.metrics?.enumOnlyModifiers).toBe(true);
  expect(generatedPack?.validationReport?.metrics?.canonicalRulesPreserved).toBe(true);

  const modifierPayload = await page.evaluate(async () => {
    const response = await fetch('/api/world/region?worldGridFeatureFlags=all');
    return response.json();
  });
  expect(modifierPayload?.generatedPackTechFlavorView?.validationReport?.ok).toBe(true);
  expect(modifierPayload?.generatedPackTechFlavorView?.balanceSimulation?.unlockRulesPreserved).toBe(true);
  expect(modifierPayload?.generatedPackModifierView?.validationReport?.ok).toBe(true);
  expect(modifierPayload?.generatedPackModifierView?.balanceSimulation?.resourceFormulaChanges).toBe(0);

  const sceneInfo = await page.evaluate(() => window.__worldGridTest.getSceneInfo());
  expect(sceneInfo?.renderer).toBe('three');
  expect(sceneInfo?.generatedPackId).toBe(generatedPack.packId);
  expect(sceneInfo?.palette?.background).toBe(generatedPack.stylePack.palette.background);
  expect(sceneInfo?.assetLoader?.assetAwareLoaderExists).toBe(true);
  expect(sceneInfo?.assetLoader?.plannedTextureTargetCount).toBe(23);
  expect(sceneInfo?.assetLoader?.missingTextureCount).toBe(0);
  expect(sceneInfo?.assetLoader?.handledMissingTextureCount).toBe(23);
  expect(sceneInfo?.assetLoader?.performanceBudgetPassed).toBe(true);
  expect(sceneInfo?.assetLoader?.firstLoopSafe).toBe(true);
  await expect(page.locator('[data-world-grid-stage]')).toHaveAttribute('data-generated-pack-id', generatedPack.packId);
  await expect(page.locator('[data-world-grid-stage]')).toHaveAttribute('data-asset-loader', 'v2');

  await page.locator('.world-grid-cell--claimable').first().click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText(/Cost:/);
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Mushroom Scrip');

  await page.getByRole('button', { name: /Plan Cozy route/ }).click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Claim status: planned');
  await page.getByRole('button', { name: /Complete Mushroom claim/ }).click();
  await expect(page.locator('[data-world-grid-loop-result]')).toContainText('Cozy route complete');

  const payload = await page.evaluate(() => window.__worldGridTest.getPayload());
  expect(payload?.region?.routes?.some((route) => route.status === 'open')).toBe(true);

  const report = await page.evaluate(() => window.__worldGridTest.getPlaytestReport());
  expect(report?.playtestPassed).toBe(true);
  expect(report?.measuredScoresRequired).toBe(true);
  expect(report?.defaultScoresUsed).toBe(false);
  expect(report?.scoreEvidence?.measured).toBe(true);
  expect(report?.screenshotEvidence?.captured).toBe(true);
  expect(report?.paletteContrastScore).toBeGreaterThanOrEqual(0.85);
  expect(report?.uiReadabilityScore).toBeGreaterThanOrEqual(0.85);
  expect(report?.styleCoherenceScore).toBeGreaterThanOrEqual(0.85);
  expect(report?.promptAlignmentScore).toBeGreaterThanOrEqual(0.85);
  expect(report?.validationReport?.metrics?.canonicalMappingCoverage).toBe(1);
  expect(report?.validationReport?.metrics?.measuredScoresPresent).toBe(true);
  expect(report?.validationReport?.metrics?.screenshotEvidenceRecorded).toBe(true);
  expect(report?.warnings?.some((warning) => warning.code === 'asset-loader-fallback-textures')).toBe(true);
  expect(consoleErrors).toEqual([]);
});

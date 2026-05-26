const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CANONICAL_TECH_CAPABILITIES,
  buildMeasuredPlaytestReport,
  createGeneratedPack,
  projectTechFlavorView,
  validateGeneratedPack,
  validatePlaytestReport,
  validateTechFlavorTree
} = require('../server/world_grid/generated_pack');

function packForTech(prompt = 'cozy mushroom frontier with clockwork gardeners and lantern moss') {
  return createGeneratedPack({
    owner: { ownerAccountId: 'owner_tech_flavor_tree' },
    prompt,
    nowMs: 160_000,
    candidateRoot: 'data/generated-packs-test'
  });
}

test('GU-14 tech flavor tree covers every canonical capability with generated lore', () => {
  const pack = packForTech();
  const report = validateTechFlavorTree(pack.techFlavorTree);
  const packReport = validateGeneratedPack(pack);
  const requiredIds = CANONICAL_TECH_CAPABILITIES.map((capability) => capability.canonicalCapabilityId);
  const nodeIds = pack.techFlavorTree.nodes.map((node) => node.canonicalCapabilityId);

  assert.equal(report.ok, true, JSON.stringify(report.checks));
  assert.equal(packReport.ok, true, JSON.stringify(packReport.checks));
  assert.equal(pack.techFlavorTree.schemaVersion, 'agent-town-tech-flavor-tree-v1');
  assert.deepEqual(new Set(nodeIds), new Set(requiredIds));
  assert.equal(pack.techFlavorTree.nodes.every((node) => node.generatedName && node.loreText), true);
  assert.equal(report.metrics.canonicalEffectCoverage, 1);
  assert.equal(report.metrics.customEffectCount, 0);
  assert.equal(report.metrics.generatedTechNamesVisible, true);
  assert.equal(report.metrics.unlockRulesPreserved, true);
});

test('GU-14 missing canonical effects and custom mechanics are rejected', () => {
  const pack = packForTech();
  const missing = {
    ...pack,
    techFlavorTree: {
      ...pack.techFlavorTree,
      nodes: pack.techFlavorTree.nodes.slice(0, -1),
      balanceSimulation: {
        ...pack.techFlavorTree.balanceSimulation,
        canonicalEffectCoverage: 0.83
      }
    }
  };
  const custom = {
    ...pack,
    techFlavorTree: {
      ...pack.techFlavorTree,
      nodes: [
        ...pack.techFlavorTree.nodes,
        {
          nodeId: 'tech_node_custom-coin-multiplier',
          canonicalCapabilityId: 'capability.custom.coin_multiplier',
          canonicalEffectId: 'effect.custom.coin_multiplier',
          generatedTechId: 'tech_custom-coin-multiplier',
          generatedName: 'Coin Multiplier',
          loreText: 'This custom tech tries to change resource math.',
          unlockRule: 'custom-formula',
          effectKind: 'metadata-only',
          canonicalRuleImpact: 'changes-resource-cost',
          mechanicDelta: 1,
          futureHook: { targetLane: 'v5-world-grid', status: 'metadata-only' },
          formula: 'coin * 2',
          customPermissions: ['grant_resources']
        }
      ],
      balanceSimulation: {
        ...pack.techFlavorTree.balanceSimulation,
        customEffectCount: 1,
        unlockRulesPreserved: false
      }
    }
  };

  const missingReport = validateTechFlavorTree(missing.techFlavorTree);
  const customReport = validateTechFlavorTree(custom.techFlavorTree);
  const customPackReport = validateGeneratedPack(custom);

  assert.equal(missingReport.ok, false);
  assert.equal(missingReport.checks.find((check) => check.id === 'TECH_FLAVOR_CANONICAL_EFFECT_COVERAGE').passed, false);
  assert.equal(customReport.ok, false);
  assert.equal(customReport.checks.find((check) => check.id === 'TECH_FLAVOR_NO_CUSTOM_MECHANICS').passed, false);
  assert.equal(customReport.checks.find((check) => check.id === 'TECH_FLAVOR_UNLOCK_RULES_PRESERVED').passed, false);
  assert.equal(customPackReport.ok, false);
  assert.equal(customPackReport.checks.find((check) => check.id === 'GENPACK_TECH_FLAVOR_TREE_VALID').passed, false);
});

test('GU-14 tech flavor projection preserves canonical unlock effects and first-loop pass', () => {
  const pack = packForTech('crystal cave outpost with echo miners and glow carts');
  const view = projectTechFlavorView(pack);
  const playtest = buildMeasuredPlaytestReport({
    pack,
    nowMs: 161_000,
    report: {
      packId: pack.packId,
      renderer: 'three',
      firstLoopCompleted: true,
      canonicalPayloadIntegrity: true,
      missingAssets: 0,
      consoleErrors: 0,
      assetLoader: {
        assetAwareLoaderExists: true,
        missingTextureCount: 0,
        handledMissingTextureCount: 23,
        fallbackTextureCount: 23,
        performanceBudgetPassed: true,
        firstLoopSafe: true
      },
      screenshotEvidence: {
        captured: true,
        hash: 'f'.repeat(64),
        width: 1280,
        height: 720,
        byteLength: 2400,
        source: 'tech-flavor-test'
      },
      scoreEvidence: {
        measured: true,
        measurementVersion: 'agent-town-browser-playtest-measurements-v1'
      }
    }
  });
  playtest.validationReport = validatePlaytestReport(playtest, pack);

  assert.equal(view.validationReport.ok, true, JSON.stringify(view.validationReport.checks));
  assert.equal(view.nodes.length, CANONICAL_TECH_CAPABILITIES.length);
  assert.equal(view.balanceSimulation.unlockRulesPreserved, true);
  assert.equal(view.balanceSimulation.customEffectCount, 0);
  assert.equal(playtest.validationReport.ok, true, JSON.stringify(playtest.validationReport.checks));
  assert.equal(playtest.validationReport.metrics.firstLoopCompleted, true);
});

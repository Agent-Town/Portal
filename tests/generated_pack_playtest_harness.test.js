const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildMeasuredPlaytestReport,
  createGeneratedPack,
  validatePlaytestReport
} = require('../server/world_grid/generated_pack');

const screenshotEvidence = {
  captured: true,
  hash: 'a'.repeat(64),
  width: 1280,
  height: 720,
  byteLength: 2400,
  source: 'test-browser-screenshot'
};

function measuredInput(pack, overrides = {}) {
  return {
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
    screenshotEvidence,
    scoreEvidence: {
      measured: true,
      measurementVersion: 'agent-town-browser-playtest-measurements-v1'
    },
    ...overrides
  };
}

function createPlaytestPack(ownerAccountId = 'owner_playtest_harness') {
  return createGeneratedPack({
    owner: { ownerAccountId },
    prompt: 'cozy mushroom frontier with clockwork gardeners and lantern moss',
    nowMs: 70_000,
    candidateRoot: 'data/generated-packs-test'
  });
}

test('measured generated-pack playtest passes with screenshot evidence and fallback warnings', () => {
  const pack = createPlaytestPack('owner_playtest_valid');
  const report = buildMeasuredPlaytestReport({
    pack,
    report: measuredInput(pack),
    nowMs: 70_500
  });
  report.validationReport = validatePlaytestReport(report, pack);
  report.playtestPassed = report.validationReport.ok;

  assert.equal(report.playtestPassed, true, JSON.stringify(report.validationReport.checks));
  assert.equal(report.measuredScoresRequired, true);
  assert.equal(report.defaultScoresUsed, false);
  assert.equal(report.scoreEvidence.measured, true);
  assert.equal(report.screenshotEvidence.captured, true);
  assert.equal(report.paletteContrastScore >= 0.85, true);
  assert.equal(report.styleCoherenceScore >= 0.85, true);
  assert.equal(report.promptAlignmentScore >= 0.85, true);
  assert.equal(report.warnings.some((warning) => warning.code === 'asset-loader-fallback-textures'), true);
});

test('playtest harness rejects bad contrast packs', () => {
  const pack = createPlaytestPack('owner_playtest_bad_contrast');
  pack.stylePack.palette.background = '#222222';
  pack.stylePack.palette.surface = '#222222';
  pack.stylePack.palette.ink = '#222222';
  const report = buildMeasuredPlaytestReport({
    pack,
    report: measuredInput(pack),
    nowMs: 71_000
  });
  const validation = validatePlaytestReport(report, pack);

  assert.equal(validation.ok, false);
  assert.equal(validation.checks.find((check) => check.id === 'PLAYTEST_PALETTE_CONTRAST_GATE').passed, false);
  assert.equal(validation.checks.find((check) => check.id === 'PLAYTEST_READABILITY_GATE').passed, false);
});

test('playtest harness rejects packs missing canonical mappings', () => {
  const pack = createPlaytestPack('owner_playtest_missing_mapping');
  pack.gameplayMapping.canonicalEntities = pack.gameplayMapping.canonicalEntities
    .filter((mapping) => mapping.canonicalId !== 'resource.wood');
  const report = buildMeasuredPlaytestReport({
    pack,
    report: measuredInput(pack),
    nowMs: 71_500
  });
  const validation = validatePlaytestReport(report, pack);

  assert.equal(validation.ok, false);
  assert.equal(validation.checks.find((check) => check.id === 'PLAYTEST_PACK_VALIDATION_GATE').passed, false);
});

test('playtest harness derives unhandled missing assets from loader evidence', () => {
  const pack = createPlaytestPack('owner_playtest_missing_asset');
  const report = buildMeasuredPlaytestReport({
    pack,
    report: measuredInput(pack, {
      missingAssets: 0,
      assetLoader: {
        assetAwareLoaderExists: true,
        missingTextureCount: 1,
        handledMissingTextureCount: 22,
        fallbackTextureCount: 22,
        performanceBudgetPassed: true,
        firstLoopSafe: true
      }
    }),
    nowMs: 71_750
  });
  const validation = validatePlaytestReport(report, pack);

  assert.equal(report.missingAssets, 1);
  assert.equal(validation.ok, false);
  assert.equal(validation.checks.find((check) => check.id === 'PLAYTEST_NO_MISSING_ASSETS').passed, false);
});

test('playtest harness cannot pass default scores or incomplete first loop', () => {
  const pack = createPlaytestPack('owner_playtest_defaults');
  const defaultReport = buildMeasuredPlaytestReport({
    pack,
    report: {
      packId: pack.packId,
      renderer: 'three',
      firstLoopCompleted: true,
      canonicalPayloadIntegrity: true,
      missingAssets: 0,
      consoleErrors: 0
    },
    nowMs: 72_000
  });
  const defaultValidation = validatePlaytestReport(defaultReport, pack);
  const incompleteReport = buildMeasuredPlaytestReport({
    pack,
    report: measuredInput(pack, { firstLoopCompleted: false }),
    nowMs: 72_500
  });
  const incompleteValidation = validatePlaytestReport(incompleteReport, pack);

  assert.equal(defaultReport.defaultScoresUsed, true);
  assert.equal(defaultValidation.ok, false);
  assert.equal(defaultValidation.checks.find((check) => check.id === 'PLAYTEST_MEASURED_SCORES_REQUIRED').passed, false);
  assert.equal(defaultValidation.checks.find((check) => check.id === 'PLAYTEST_SCREENSHOT_EVIDENCE_RECORDED').passed, false);
  assert.equal(incompleteValidation.ok, false);
  assert.equal(incompleteValidation.checks.find((check) => check.id === 'PLAYTEST_FIRST_LOOP_COMPLETED').passed, false);
});

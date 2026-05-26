const crypto = require('crypto');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REPLAYABILITY_PROMPT_SUITE,
  analyzePackDiversity,
  buildMeasuredPlaytestReport,
  createGeneratedPack,
  validatePlaytestReport
} = require('../server/world_grid/generated_pack');

function screenshotEvidenceForPack(pack) {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({
      packId: pack.packId,
      palette: pack.stylePack.palette,
      title: pack.universePack.name
    }))
    .digest('hex');
  return {
    captured: true,
    hash,
    width: 1280,
    height: 720,
    byteLength: 2400,
    source: 'replayability-suite-render-hash'
  };
}

function passingPlaytestReport(pack, index) {
  const report = buildMeasuredPlaytestReport({
    pack,
    nowMs: 110_000 + index,
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
      screenshotEvidence: screenshotEvidenceForPack(pack),
      scoreEvidence: {
        measured: true,
        measurementVersion: 'agent-town-browser-playtest-measurements-v1'
      }
    }
  });
  report.validationReport = validatePlaytestReport(report, pack);
  report.playtestPassed = report.validationReport.ok;
  return report;
}

function createSuitePacks() {
  return REPLAYABILITY_PROMPT_SUITE.map((prompt, index) => createGeneratedPack({
    owner: { ownerAccountId: `owner_replayability_${index}` },
    prompt,
    nowMs: 100_000 + index,
    candidateRoot: 'data/generated-packs-test'
  }));
}

test('GU-9 replayability suite proves 10 valid playable and meaningfully different packs', () => {
  const packs = createSuitePacks();
  const playtestReports = packs.map(passingPlaytestReport);
  const report = analyzePackDiversity(packs, {
    playtestReports,
    requirePlaytestReports: true,
    expectedPromptCount: 10,
    meaningfulDifferenceScoreMin: 0.65
  });

  assert.equal(report.ok, true, JSON.stringify(report.metrics));
  assert.equal(report.metrics.promptCount, 10);
  assert.equal(report.metrics.validPackCount, 10);
  assert.equal(report.metrics.firstLoopPassCount, 10);
  assert.equal(report.metrics.uniquePackIds, 10);
  assert.equal(report.metrics.uniqueReplayabilitySignatures, 10);
  assert.equal(report.metrics.uniqueScreenshotHashes, 10);
  assert.equal(report.metrics.pairwiseComparisonCount, 45);
  assert.equal(report.metrics.meaningfulDifferenceScoreMin >= 0.65, true);
  assert.equal(report.metrics.minimumPaletteDistance > 0, true);
  assert.equal(report.metrics.minimumLabelNameDistance >= 0.65, true);
  assert.equal(report.metrics.forbiddenAuthorityCount, 0);
  assert.equal(report.metrics.rawPromptLeakCount, 0);
  assert.equal(report.packResults.every((result) => result.validationOk && result.firstLoopPassed), true);
});

test('GU-9 replayability suite rejects repeated packs or reused screenshot evidence', () => {
  const packs = createSuitePacks();
  const repeatedPacks = [...packs.slice(0, 9), packs[0]];
  const repeatedPackReports = repeatedPacks.map(passingPlaytestReport);
  const repeatedPackReport = analyzePackDiversity(repeatedPacks, {
    playtestReports: repeatedPackReports,
    requirePlaytestReports: true,
    expectedPromptCount: 10
  });
  assert.equal(repeatedPackReport.ok, false);
  assert.equal(repeatedPackReport.metrics.uniquePackIds < 10, true);
  assert.equal(repeatedPackReport.metrics.uniqueReplayabilitySignatures < 10, true);

  const playtestReports = packs.map((pack, index) => {
    const report = passingPlaytestReport(pack, index);
    if (index === 9) {
      report.screenshotEvidence.hash = playtestReportsHashForReuse(packs[0]);
    }
    return report;
  });
  const reusedScreenshotReport = analyzePackDiversity(packs, {
    playtestReports,
    requirePlaytestReports: true,
    expectedPromptCount: 10
  });
  assert.equal(reusedScreenshotReport.ok, false);
  assert.equal(reusedScreenshotReport.metrics.uniqueScreenshotHashes, 9);
});

function playtestReportsHashForReuse(pack) {
  return screenshotEvidenceForPack(pack).hash;
}

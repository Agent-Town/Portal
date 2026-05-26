const crypto = require('crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  REPLAYABILITY_PROMPT_SUITE,
  analyzePackDiversity,
  buildMeasuredPlaytestReport,
  buildProductionReleaseGate,
  clearGeneratedPacksForTests,
  createGeneratedPack,
  exportGeneratedPack,
  generateAndStorePack,
  importGeneratedPack,
  publishPublicPackCard,
  recordPlaytestReport,
  reloadGeneratedPack,
  validatePlaytestReport,
  validateProductionReleaseGate
} = require('../server/world_grid/generated_pack');

async function withTempGeneratedPackStore(fn) {
  const previousRoot = process.env.GENERATED_PACK_STORE_ROOT;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-town-generated-pack-release-gate-'));
  process.env.GENERATED_PACK_STORE_ROOT = root;
  clearGeneratedPacksForTests({ clearDisk: true });
  try {
    return await fn(root);
  } finally {
    clearGeneratedPacksForTests({ clearDisk: true });
    fs.rmSync(root, { recursive: true, force: true });
    if (previousRoot === undefined) delete process.env.GENERATED_PACK_STORE_ROOT;
    else process.env.GENERATED_PACK_STORE_ROOT = previousRoot;
  }
}

async function withWorldGridServer({ identity, envPatch = {} }, fn) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    WORLD_GRID_FEATURE_FLAGS: process.env.WORLD_GRID_FEATURE_FLAGS,
    FEATURE_WORLD_GRID_GENERATED_PACKS: process.env.FEATURE_WORLD_GRID_GENERATED_PACKS,
    GENERATED_PACK_STORE_ROOT: process.env.GENERATED_PACK_STORE_ROOT
  };
  for (const [key, value] of Object.entries(envPatch)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: () => identity
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function screenshotEvidenceForPack(pack) {
  return {
    captured: true,
    hash: crypto.createHash('sha256')
      .update(JSON.stringify({
        packId: pack.packId,
        palette: pack.stylePack.palette,
        title: pack.universePack.name
      }))
      .digest('hex'),
    width: 1280,
    height: 720,
    byteLength: 2400,
    source: 'release-gate-suite-render-hash'
  };
}

function passingPlaytestInput(pack) {
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
    screenshotEvidence: screenshotEvidenceForPack(pack),
    scoreEvidence: {
      measured: true,
      measurementVersion: 'agent-town-browser-playtest-measurements-v1'
    }
  };
}

function suiteDiversityReport() {
  const packs = REPLAYABILITY_PROMPT_SUITE.map((prompt, index) => createGeneratedPack({
    owner: { ownerAccountId: `owner_release_gate_diversity_${index}` },
    prompt,
    nowMs: 160_000 + index,
    candidateRoot: 'data/generated-packs-test'
  }));
  const playtestReports = packs.map((pack, index) => {
    const report = buildMeasuredPlaytestReport({
      pack,
      nowMs: 161_000 + index,
      report: passingPlaytestInput(pack)
    });
    report.validationReport = validatePlaytestReport(report, pack);
    report.playtestPassed = report.validationReport.ok;
    return report;
  });
  return analyzePackDiversity(packs, {
    playtestReports,
    requirePlaytestReports: true,
    expectedPromptCount: 10,
    meaningfulDifferenceScoreMin: 0.65
  });
}

function approvedReleaseInputs() {
  return {
    authModelDocumented: true,
    costEstimateAccepted: true,
    explicitConsentRecorded: true,
    candidateAssetsReviewed: true,
    humanReviewSignoffHash: 'a'.repeat(64)
  };
}

test('GU-18 production release gate fails closed without playtest, approvals, diversity, persistence, or public-card evidence', () => {
  const pack = createGeneratedPack({
    owner: { ownerAccountId: 'owner_release_gate_closed' },
    prompt: 'cozy mushroom frontier with clockwork gardeners and lantern moss',
    nowMs: 150_000
  });
  const gate = buildProductionReleaseGate({ pack, nowMs: 150_500 });
  const validationReport = validateProductionReleaseGate(gate);

  assert.equal(validationReport.ok, true, JSON.stringify(validationReport.checks));
  assert.equal(gate.schemaVersion, 'agent-town-generated-pack-production-release-gate-v1');
  assert.equal(gate.releaseMode, 'prototype-gated');
  assert.equal(gate.publicReleaseEligible, false);
  assert.equal(gate.releasePrerequisites.schemaValid, true);
  assert.equal(gate.releasePrerequisites.assetManifestValid, true);
  assert.equal(gate.releasePrerequisites.playtestPassed, false);
  assert.equal(gate.releasePrerequisites.costConsentModelApproved, false);
  assert.equal(gate.releasePrerequisites.humanReviewComplete, false);
  assert.equal(gate.metrics.privateDataLeakCount, 0);
  assert.equal(gate.metrics.productionImageAssetCount, 0);
  assert.equal(gate.metrics.eligiblePrerequisiteCount < gate.metrics.requiredPrerequisiteCount, true);
  for (const reason of ['playtestPassed', 'diversitySuitePassed', 'packSaveReloadPassed', 'publicCardPrivacyPassed', 'costConsentModelApproved', 'candidateAssetsReviewed', 'humanReviewComplete']) {
    assert.equal(gate.blockingReasons.includes(reason), true, reason);
  }
});

test('GU-18 production release gate can pass only with explicit machine evidence and review approvals', () => withTempGeneratedPackStore(() => {
  const owner = { ownerAccountId: 'owner_release_gate_ready' };
  const pack = generateAndStorePack({
    owner,
    prompt: 'brass orbit rail town with moon garden markets',
    nowMs: 151_000
  });
  const playtestReport = recordPlaytestReport(owner, passingPlaytestInput(pack));
  const { publicCard, validationReport: cardValidationReport } = publishPublicPackCard(owner, pack.packId, { nowMs: 151_500 });
  const exportEnvelope = exportGeneratedPack(owner, pack.packId);

  clearGeneratedPacksForTests();
  const reloadResult = reloadGeneratedPack(owner, pack.packId);
  const importResult = importGeneratedPack({ ownerAccountId: 'owner_release_gate_import' }, exportEnvelope, { nowMs: 152_000 });
  let invalidImportRejected = false;
  assert.throws(() => {
    importGeneratedPack(owner, { ...exportEnvelope, packHash: '0'.repeat(64) });
  }, /INVALID_GENERATED_PACK_EXPORT/);
  invalidImportRejected = true;

  const diversityReport = suiteDiversityReport();
  const persistenceReport = {
    durablePackStorage: reloadResult.reloadReport.durablePackStorage === true,
    restartReloadPass: reloadResult.generatedPack.packId === pack.packId && reloadResult.reloadReport.fallbackUsed === false,
    exportImportRoundTrip: importResult.importReport.exportImportRoundTrip === true,
    invalidImportRejected,
    privateDataLeakCount: Math.max(
      Number(exportEnvelope.privateDataLeakCount || 0),
      Number(importResult.importReport.privateDataLeakCount || 0)
    )
  };
  const gate = buildProductionReleaseGate({
    pack,
    playtestReport,
    diversityReport,
    publicCard,
    persistenceReport,
    approvalInputs: approvedReleaseInputs(),
    nowMs: 152_500
  });
  const validationReport = validateProductionReleaseGate(gate);

  assert.equal(playtestReport.playtestPassed, true);
  assert.equal(cardValidationReport.ok, true);
  assert.equal(diversityReport.ok, true, JSON.stringify(diversityReport.metrics));
  assert.equal(validationReport.ok, true, JSON.stringify(validationReport.checks));
  assert.equal(gate.releaseMode, 'ready-for-controlled-release');
  assert.equal(gate.publicReleaseEligible, true);
  assert.equal(gate.blockingReasons.length, 0);
  assert.equal(Object.values(gate.releasePrerequisites).every((value) => value === true), true);
  assert.equal(gate.metrics.replayabilityPromptCount, 10);
  assert.equal(gate.metrics.privateDataLeakCount, 0);
  assert.equal(gate.metrics.productionImageAssetCount, 0);
  assert.equal(gate.metrics.eligiblePrerequisiteCount, gate.metrics.requiredPrerequisiteCount);
}));

test('GU-18 production release gate validation rejects tampered eligibility and blocking reasons', () => {
  const pack = createGeneratedPack({
    owner: { ownerAccountId: 'owner_release_gate_tamper' },
    prompt: 'tideglass harbor settlement with reef couriers and mist bells',
    nowMs: 153_000
  });
  const gate = buildProductionReleaseGate({ pack, nowMs: 153_500 });
  const forgedEligible = {
    ...gate,
    releaseMode: 'ready-for-controlled-release',
    publicReleaseEligible: true,
    blockingReasons: []
  };
  const mismatchedReasons = {
    ...gate,
    blockingReasons: gate.blockingReasons.slice(1)
  };

  const forgedReport = validateProductionReleaseGate(forgedEligible);
  const mismatchedReport = validateProductionReleaseGate(mismatchedReasons);

  assert.equal(forgedReport.ok, false);
  assert.equal(
    forgedReport.checks.find((check) => check.id === 'PRODUCTION_RELEASE_GATE_PREREQUISITES_COHERENT').passed,
    false
  );
  assert.equal(mismatchedReport.ok, false);
  assert.equal(
    mismatchedReport.checks.find((check) => check.id === 'PRODUCTION_RELEASE_GATE_PREREQUISITES_COHERENT').passed,
    false
  );
});

test('GU-18 production release gate API is generated-pack-gated and returns a valid fail-closed report', async () => {
  const identity = { pairId: 'session:release-gate-api', houseId: null };
  await withWorldGridServer({
    identity,
    envPatch: {
      NODE_ENV: 'production',
      WORLD_GRID_FEATURE_FLAGS: undefined,
      FEATURE_WORLD_GRID_GENERATED_PACKS: undefined
    }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/generated-pack/release-gate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await response.json();
    assert.equal(response.status, 403, JSON.stringify(body));
    assert.equal(body.error.code, 'FEATURE_DISABLED');
  });

  await withTempGeneratedPackStore(async (root) => {
    await withWorldGridServer({
      identity,
      envPatch: {
        NODE_ENV: 'test',
        WORLD_GRID_FEATURE_FLAGS: 'all',
        GENERATED_PACK_STORE_ROOT: root
      }
    }, async (baseUrl) => {
      const toolsResponse = await fetch(`${baseUrl}/api/world/tools`);
      const toolsBody = await toolsResponse.json();
      assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
      assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.generated_pack.release_gate'), true);

      const generateResponse = await fetch(`${baseUrl}/api/world/generated-pack/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'cozy mushroom frontier with clockwork gardeners and lantern moss' })
      });
      const generateBody = await generateResponse.json();
      assert.equal(generateResponse.status, 200, JSON.stringify(generateBody));

      const releaseResponse = await fetch(`${baseUrl}/api/world/generated-pack/release-gate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({})
      });
      const releaseBody = await releaseResponse.json();
      assert.equal(releaseResponse.status, 200, JSON.stringify(releaseBody));
      assert.equal(releaseBody.validationReport.ok, true, JSON.stringify(releaseBody.validationReport.checks));
      assert.equal(releaseBody.releaseGate.packId, generateBody.generatedPack.packId);
      assert.equal(releaseBody.releaseGate.releaseMode, 'prototype-gated');
      assert.equal(releaseBody.releaseGate.publicReleaseEligible, false);
      assert.equal(releaseBody.releaseGate.blockingReasons.includes('costConsentModelApproved'), true);
    });
  });
});

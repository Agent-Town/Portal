const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const express = require('express');

const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  buildMeasuredPlaytestReport,
  clearGeneratedPacksForTests,
  generateAndStorePack,
  getPublicPackCard,
  publishPublicPackCard,
  recordPlaytestReport,
  validatePlaytestReport,
  validatePublicPackCard
} = require('../server/world_grid/generated_pack');

async function withTempGeneratedPackStore(fn) {
  const previousRoot = process.env.GENERATED_PACK_STORE_ROOT;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-town-generated-pack-card-store-'));
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

function measuredReportForPack(pack) {
  const report = buildMeasuredPlaytestReport({
    pack,
    nowMs: 130_500,
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
        hash: 'c'.repeat(64),
        width: 1280,
        height: 720,
        byteLength: 2400,
        source: 'public-card-test-screenshot'
      },
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

test('GU-11 public pack card schema redacts raw prompt, private data, and debug fields', () => withTempGeneratedPackStore(() => {
  const owner = {
    ownerAccountId: 'owner_public_card_private',
    pairId: 'pair_public_card_private',
    houseId: 'house_public_card_private'
  };
  const pack = generateAndStorePack({
    owner,
    prompt: 'cozy mushroom frontier with clockwork gardeners and lantern moss',
    nowMs: 130_000,
    candidateRoot: 'data/generated-packs-test'
  });
  recordPlaytestReport(owner, measuredReportForPack(pack));

  const { publicCard, validationReport } = publishPublicPackCard(owner, pack.packId, { nowMs: 131_000 });
  const text = JSON.stringify(publicCard).toLowerCase();

  assert.equal(validationReport.ok, true, JSON.stringify(validationReport.checks));
  assert.equal(publicCard.schemaVersion, 'agent-town-generated-pack-public-card-v1');
  assert.equal(publicCard.title.includes('Charter'), true);
  assert.equal(publicCard.screenshot.present, true);
  assert.equal(publicCard.assetManifestSummary.assetCount > 0, true);
  assert.equal(publicCard.assetManifestSummary.plannedCandidateCount, 23);
  assert.equal(publicCard.moderation.privateDataLeakCount, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(publicCard, 'prompt'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(publicCard, 'rawPrompt'), false);
  assert.equal(text.includes(owner.ownerAccountId.toLowerCase()), false);
  assert.equal(text.includes(owner.pairId.toLowerCase()), false);
  assert.equal(text.includes(owner.houseId.toLowerCase()), false);
  for (const forbidden of ['brain', 'wallet', 'provider', 'oauth', 'debug', 'api key']) {
    assert.equal(text.includes(forbidden), false, forbidden);
  }

  const loaded = getPublicPackCard(publicCard.cardId);
  assert.equal(loaded.cardId, publicCard.cardId);
}));

test('GU-11 unsafe public pack cards fail moderation', () => withTempGeneratedPackStore(() => {
  const owner = { ownerAccountId: 'owner_public_card_unsafe' };
  const pack = generateAndStorePack({
    owner,
    prompt: 'brass moonrail desert town with prairie dog engineers',
    nowMs: 132_000,
    candidateRoot: 'data/generated-packs-test'
  });
  recordPlaytestReport(owner, measuredReportForPack(pack));
  const { publicCard } = publishPublicPackCard(owner, pack.packId, { nowMs: 132_500 });
  const unsafe = {
    ...publicCard,
    styleSummary: 'debug provider wallet Brain context with raw prompt instructions'
  };
  const report = validatePublicPackCard(unsafe, owner);

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.id === 'PUBLIC_CARD_BLOCKED_FIELDS_ABSENT').passed, false);
}));

async function withCardServer({ identity, envPatch = {} }, fn) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    WORLD_GRID_FEATURE_FLAGS: process.env.WORLD_GRID_FEATURE_FLAGS,
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

test('GU-11 public pack card loads without auth by unlisted card id', async () => {
  await withTempGeneratedPackStore(async (root) => {
    const identity = { pairId: 'session:public-card-author', houseId: null };
    let cardId = '';
    await withCardServer({
      identity,
      envPatch: {
        NODE_ENV: 'test',
        WORLD_GRID_FEATURE_FLAGS: 'all',
        GENERATED_PACK_STORE_ROOT: root
      }
    }, async (baseUrl) => {
      const generateResponse = await fetch(`${baseUrl}/api/world/generated-pack/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'tideglass harbor settlement with lobster sheriffs and mist bells' })
      });
      const generateBody = await generateResponse.json();
      assert.equal(generateResponse.status, 200, JSON.stringify(generateBody));

      const reportResponse = await fetch(`${baseUrl}/api/world/generated-pack/playtest-report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          packId: generateBody.generatedPack.packId,
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
            hash: 'd'.repeat(64),
            width: 1280,
            height: 720,
            byteLength: 2400,
            source: 'api-public-card-test'
          },
          scoreEvidence: {
            measured: true,
            measurementVersion: 'agent-town-browser-playtest-measurements-v1'
          }
        })
      });
      assert.equal(reportResponse.status, 200, await reportResponse.text());

      const publishResponse = await fetch(`${baseUrl}/api/world/generated-pack/public-card`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packId: generateBody.generatedPack.packId })
      });
      const publishBody = await publishResponse.json();
      assert.equal(publishResponse.status, 200, JSON.stringify(publishBody));
      assert.equal(publishBody.validationReport.ok, true);
      cardId = publishBody.publicCard.cardId;
    });

    await withCardServer({
      identity: null,
      envPatch: {
        NODE_ENV: 'production',
        WORLD_GRID_FEATURE_FLAGS: undefined,
        GENERATED_PACK_STORE_ROOT: root
      }
    }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/world/generated-pack/public-card/${cardId}`);
      const body = await response.json();
      assert.equal(response.status, 200, JSON.stringify(body));
      assert.equal(body.authRequired, false);
      assert.equal(body.publicCard.cardId, cardId);
      assert.equal(body.publicCard.screenshot.present, true);
      assert.equal(JSON.stringify(body.publicCard).includes(identity.pairId), false);
    });
  });
});

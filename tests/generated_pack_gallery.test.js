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
  listPublicPackGallery,
  publishPublicPackCard,
  recordPlaytestReport,
  reviewPublicPackCard,
  unpublishPublicPackCard,
  validatePlaytestReport,
  validatePublicPackGallery
} = require('../server/world_grid/generated_pack');

async function withTempGeneratedPackStore(fn) {
  const previousRoot = process.env.GENERATED_PACK_STORE_ROOT;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-town-generated-pack-gallery-store-'));
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

function measuredReportForPack(pack, hashChar = 'e') {
  const report = buildMeasuredPlaytestReport({
    pack,
    nowMs: 140_500,
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
        hash: hashChar.repeat(64),
        width: 1280,
        height: 720,
        byteLength: 2400,
        source: 'gallery-test-screenshot'
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

function publishCardForPrompt(owner, prompt, hashChar, nowMs) {
  const pack = generateAndStorePack({
    owner,
    prompt,
    nowMs,
    candidateRoot: 'data/generated-packs-test'
  });
  recordPlaytestReport(owner, measuredReportForPack(pack, hashChar));
  return publishPublicPackCard(owner, pack.packId, { nowMs: nowMs + 500 }).publicCard;
}

test('GU-12 curated gallery lists only approved cards with moderation metadata', () => withTempGeneratedPackStore(() => {
  const owner = {
    ownerAccountId: 'owner_gallery_private',
    pairId: 'pair_gallery_private',
    houseId: 'house_gallery_private'
  };
  const approved = publishCardForPrompt(owner, 'cozy mushroom frontier with clockwork gardeners and lantern moss', 'e', 140_000);
  const rejected = publishCardForPrompt(owner, 'brass moonrail desert town with copper wagons and prairie dust', 'f', 141_000);
  const pending = publishCardForPrompt(owner, 'tideglass harbor settlement with mist bells and reed bridges', 'a', 142_000);

  reviewPublicPackCard(approved.cardId, {
    decision: 'approve',
    reviewerId: 'qa-style-reviewer',
    tags: ['cozy', 'frontier', 'mushroom'],
    signoffNote: 'public-safe gallery approval'
  }, { nowMs: 143_000 });
  reviewPublicPackCard(rejected.cardId, {
    decision: 'reject',
    reviewerId: 'qa-style-reviewer',
    tags: ['reject'],
    signoffNote: 'hold for visual review'
  }, { nowMs: 143_500 });

  const { gallery, validationReport } = listPublicPackGallery({
    search: 'mushroom',
    tags: ['cozy'],
    sort: 'newest',
    nowMs: 144_000
  });
  const text = JSON.stringify(gallery).toLowerCase();

  assert.equal(validationReport.ok, true, JSON.stringify(validationReport.checks));
  assert.equal(gallery.schemaVersion, 'agent-town-generated-pack-gallery-v1');
  assert.equal(gallery.entries.length, 1);
  assert.equal(gallery.entries[0].cardId, approved.cardId);
  assert.equal(gallery.entries.some((entry) => entry.cardId === rejected.cardId), false);
  assert.equal(gallery.entries.some((entry) => entry.cardId === pending.cardId), false);
  assert.equal(gallery.metrics.approvedOnlyGallery, true);
  assert.equal(gallery.metrics.moderationMetadataRequired, true);
  assert.equal(gallery.metrics.privateDataLeakCount, 0);
  assert.equal(gallery.metrics.hiddenPendingOrRejectedCount, 2);
  assert.equal(gallery.entries[0].approvalStatus, 'approved');
  assert.equal(gallery.entries[0].moderation.status, 'passed');
  assert.equal(gallery.entries[0].moderation.rawPromptIncluded, false);
  assert.equal(gallery.entries[0].reviewerSignoff.reviewerId, 'qa-style-reviewer');
  assert.equal(gallery.entries[0].screenshot.present, true);
  assert.equal(gallery.entries[0].assetManifestSummary.assetCount > 0, true);
  assert.equal(Object.prototype.hasOwnProperty.call(gallery.entries[0], 'prompt'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(gallery.entries[0], 'rawPrompt'), false);
  assert.equal(text.includes(owner.ownerAccountId.toLowerCase()), false);
  assert.equal(text.includes(owner.pairId.toLowerCase()), false);
  assert.equal(text.includes(owner.houseId.toLowerCase()), false);
}));

test('GU-12 public gallery schema rejects missing moderation metadata', () => withTempGeneratedPackStore(() => {
  const owner = { ownerAccountId: 'owner_gallery_schema' };
  const approved = publishCardForPrompt(owner, 'sunforge canyon city with copper kin and weather towers', 'b', 145_000);
  reviewPublicPackCard(approved.cardId, {
    decision: 'approve',
    reviewerId: 'qa-style-reviewer',
    tags: ['sunforge'],
    signoffNote: 'approved'
  }, { nowMs: 146_000 });
  const { gallery } = listPublicPackGallery({ nowMs: 146_500 });
  const invalid = {
    ...gallery,
    entries: gallery.entries.map((entry) => {
      const { moderation, ...withoutModeration } = entry;
      return withoutModeration;
    })
  };
  const report = validatePublicPackGallery(invalid);

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.id === 'PUBLIC_GALLERY_SCHEMA_VALID').passed, false);
  assert.equal(report.checks.find((check) => check.id === 'PUBLIC_GALLERY_MODERATION_METADATA_REQUIRED').passed, false);
}));

test('GU-12 unpublish removes public card lookup and gallery visibility', () => withTempGeneratedPackStore(() => {
  const owner = { ownerAccountId: 'owner_gallery_unpublish' };
  const card = publishCardForPrompt(owner, 'winter pine hamlet with warm inns and lantern roads', 'c', 147_000);
  reviewPublicPackCard(card.cardId, {
    decision: 'approve',
    reviewerId: 'qa-style-reviewer',
    tags: ['winter'],
    signoffNote: 'approved'
  }, { nowMs: 148_000 });
  assert.equal(getPublicPackCard(card.cardId).cardId, card.cardId);
  assert.equal(listPublicPackGallery({ nowMs: 148_500 }).gallery.entries.length, 1);

  const result = unpublishPublicPackCard(card.cardId, {
    reviewerId: 'qa-style-reviewer',
    signoffNote: 'rollback'
  }, { nowMs: 149_000 });

  assert.equal(result.unpublishReport.publicCardRemoved, true);
  assert.equal(getPublicPackCard(card.cardId), null);
  assert.equal(listPublicPackGallery({ nowMs: 149_500 }).gallery.entries.length, 0);
}));

async function withGalleryServer({ identity, envPatch = {} }, fn) {
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

test('GU-12 curated gallery route loads approved cards without auth', async () => {
  await withTempGeneratedPackStore(async (root) => {
    const identity = { pairId: 'session:gallery-author', houseId: null };
    let cardId = '';
    await withGalleryServer({
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
        body: JSON.stringify({ prompt: 'crystal cave outpost with echo miners and glow carts' })
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
            source: 'api-gallery-test'
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
      cardId = publishBody.publicCard.cardId;

      const reviewResponse = await fetch(`${baseUrl}/api/world/generated-pack/gallery/review`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cardId,
          decision: 'approve',
          reviewerId: 'qa-style-reviewer',
          tags: ['crystal', 'cave'],
          signoffNote: 'approved'
        })
      });
      assert.equal(reviewResponse.status, 200, await reviewResponse.text());
    });

    await withGalleryServer({
      identity: null,
      envPatch: {
        NODE_ENV: 'production',
        WORLD_GRID_FEATURE_FLAGS: undefined,
        GENERATED_PACK_STORE_ROOT: root
      }
    }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/world/generated-pack/gallery?tags=crystal&limit=1`);
      const body = await response.json();
      assert.equal(response.status, 200, JSON.stringify(body));
      assert.equal(body.authRequired, false);
      assert.equal(body.validationReport.ok, true, JSON.stringify(body.validationReport.checks));
      assert.equal(body.gallery.entries.length, 1);
      assert.equal(body.gallery.entries[0].cardId, cardId);
      assert.equal(JSON.stringify(body.gallery).includes(identity.pairId), false);
    });
  });
});

test('GU-12 gallery review controls stay generated-pack feature-gated', async () => {
  await withTempGeneratedPackStore(async (root) => {
    await withGalleryServer({
      identity: { pairId: 'session:gallery-disabled', houseId: null },
      envPatch: {
        NODE_ENV: 'test',
        WORLD_GRID_FEATURE_FLAGS: 'none',
        GENERATED_PACK_STORE_ROOT: root
      }
    }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/world/generated-pack/gallery/review`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cardId: 'gen_card_0000000000000000',
          decision: 'approve',
          reviewerId: 'qa-style-reviewer'
        })
      });
      const body = await response.json();
      assert.equal(response.status, 403, JSON.stringify(body));
      assert.equal(body.error.code, 'FEATURE_DISABLED');
    });
  });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  clearGeneratedPacksForTests,
  currentGeneratedPack,
  exportGeneratedPack,
  generateAndStorePack,
  importGeneratedPack,
  reloadGeneratedPack,
  remixGeneratedPack,
  validateGeneratedPack
} = require('../server/world_grid/generated_pack');

function withTempGeneratedPackStore(fn) {
  const previousRoot = process.env.GENERATED_PACK_STORE_ROOT;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-town-generated-pack-store-'));
  process.env.GENERATED_PACK_STORE_ROOT = root;
  clearGeneratedPacksForTests({ clearDisk: true });
  try {
    return fn(root);
  } finally {
    clearGeneratedPacksForTests({ clearDisk: true });
    fs.rmSync(root, { recursive: true, force: true });
    if (previousRoot === undefined) delete process.env.GENERATED_PACK_STORE_ROOT;
    else process.env.GENERATED_PACK_STORE_ROOT = previousRoot;
  }
}

test('GU-10 durable storage reloads a stable generated pack after memory reset', () => withTempGeneratedPackStore(() => {
  const owner = { ownerAccountId: 'owner_persist_reload' };
  const prompt = 'cozy mushroom frontier with clockwork gardeners and lantern moss';
  const first = generateAndStorePack({ owner, prompt, nowMs: 120_000 });
  const second = generateAndStorePack({ owner, prompt, nowMs: 121_000 });

  assert.equal(first.packId, second.packId);
  assert.equal(second.validationReport.ok, true);

  clearGeneratedPacksForTests();
  const current = currentGeneratedPack(owner);
  assert.equal(current.packId, first.packId);
  assert.equal(current.validationReport.ok, true);

  const reloaded = reloadGeneratedPack(owner, first.packId);
  assert.equal(reloaded.generatedPack.packId, first.packId);
  assert.equal(reloaded.reloadReport.durablePackStorage, true);
  assert.equal(reloaded.reloadReport.fallbackUsed, false);
  assert.equal(reloaded.reloadReport.migrationVersion, 1);
}));

test('GU-10 export/import round trip excludes private owner data and survives validation', () => withTempGeneratedPackStore(() => {
  const owner = {
    ownerAccountId: 'owner_export_private',
    pairId: 'pair_export_private',
    houseId: 'house_export_private'
  };
  const importedOwner = { ownerAccountId: 'owner_import_target' };
  const generated = generateAndStorePack({
    owner,
    prompt: 'brass moonrail desert town with prairie dog engineers',
    nowMs: 122_000
  });
  const exportEnvelope = exportGeneratedPack(owner, generated.packId);
  const exportedText = JSON.stringify(exportEnvelope);

  assert.equal(exportEnvelope.schemaVersion, 'agent-town-generated-pack-export-v1');
  assert.equal(exportEnvelope.privateDataExcluded, true);
  assert.equal(exportEnvelope.privateDataLeakCount, 0);
  assert.equal(exportedText.includes(owner.ownerAccountId), false);
  assert.equal(exportedText.includes(owner.pairId), false);
  assert.equal(exportedText.includes(owner.houseId), false);
  assert.equal(exportEnvelope.pack.ownerAccountId, 'exported_owner_redacted');
  assert.equal(Object.prototype.hasOwnProperty.call(exportEnvelope.pack.prompt, 'normalizedPrompt'), false);

  const imported = importGeneratedPack(importedOwner, exportEnvelope, { nowMs: 123_000 });
  assert.equal(imported.generatedPack.packId, generated.packId);
  assert.equal(imported.generatedPack.ownerAccountId, importedOwner.ownerAccountId);
  assert.equal(imported.generatedPack.migration.importedFromExport, true);
  assert.equal(imported.importReport.exportImportRoundTrip, true);
  assert.equal(imported.importReport.privateDataLeakCount, 0);
  assert.equal(validateGeneratedPack(imported.generatedPack).ok, true);

  clearGeneratedPacksForTests();
  const reloaded = reloadGeneratedPack(importedOwner, generated.packId);
  assert.equal(reloaded.generatedPack.packId, generated.packId);
}));

test('GU-10 import rejects tampered or private-data-bearing exports', () => withTempGeneratedPackStore(() => {
  const owner = { ownerAccountId: 'owner_import_reject' };
  const generated = generateAndStorePack({
    owner,
    prompt: 'tideglass harbor settlement with lobster sheriffs and mist bells',
    nowMs: 124_000
  });
  const exportEnvelope = exportGeneratedPack(owner, generated.packId);
  const tampered = {
    ...exportEnvelope,
    pack: {
      ...exportEnvelope.pack,
      universePack: {
        ...exportEnvelope.pack.universePack,
        name: 'Tampered Harbor Charter'
      }
    }
  };

  assert.throws(
    () => importGeneratedPack(owner, tampered),
    /INVALID_GENERATED_PACK_EXPORT/
  );

  const privateExport = {
    ...exportEnvelope,
    pack: {
      ...exportEnvelope.pack,
      ownerAccountId: owner.ownerAccountId
    }
  };
  privateExport.packHash = exportEnvelope.packHash;
  assert.throws(
    () => importGeneratedPack(owner, privateExport),
    /INVALID_GENERATED_PACK_EXPORT/
  );
}));

test('GU-10 remix records parent lineage and missing-pack reload falls back to current pack', () => withTempGeneratedPackStore(() => {
  const owner = { ownerAccountId: 'owner_remix_lineage' };
  const parent = generateAndStorePack({
    owner,
    prompt: 'wizard school frontier with bookish builders and blue lanterns',
    nowMs: 125_000
  });
  const remix = remixGeneratedPack({
    owner,
    parentPackId: parent.packId,
    prompt: 'wizard school frontier remixed with crystal cave lantern libraries',
    nowMs: 126_000
  });

  assert.notEqual(remix.generatedPack.packId, parent.packId);
  assert.equal(remix.remixReport.remixLineageRecorded, true);
  assert.equal(remix.generatedPack.remix.parentPackId, parent.packId);
  assert.equal(remix.generatedPack.remix.rootPackId, parent.packId);
  assert.equal(remix.generatedPack.remix.generation, 1);
  assert.equal(remix.generatedPack.remix.lineage[0].parentPackId, parent.packId);

  clearGeneratedPacksForTests();
  const childReload = reloadGeneratedPack(owner, remix.generatedPack.packId);
  assert.equal(childReload.generatedPack.packId, remix.generatedPack.packId);

  const fallback = reloadGeneratedPack(owner, 'missing-pack-id');
  assert.equal(fallback.generatedPack.packId, remix.generatedPack.packId);
  assert.equal(fallback.reloadReport.fallbackUsed, true);
  assert.equal(fallback.reloadReport.fallbackReason, 'PACK_NOT_FOUND');
}));

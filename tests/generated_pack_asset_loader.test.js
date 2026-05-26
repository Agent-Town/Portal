const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  createGeneratedPack
} = require('../server/world_grid/generated_pack');

const root = path.resolve(__dirname, '..');

function loadBrowserAssetLoader() {
  const source = fs.readFileSync(path.join(root, 'public/experiences/world-grid/asset_loader.js'), 'utf8');
  const context = {
    window: {}
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.WorldGridAssetLoader;
}

function createLoaderPack(ownerAccountId = 'owner_asset_loader') {
  return createGeneratedPack({
    owner: { ownerAccountId },
    prompt: 'tideglass harbor settlement with lobster sheriffs and mist bells',
    nowMs: 60_000,
    candidateRoot: 'data/generated-packs-test'
  });
}

test('world-grid asset loader v2 turns generated pack contracts into fallback-safe runtime metadata', () => {
  const loader = loadBrowserAssetLoader();
  const pack = createLoaderPack('owner_asset_loader_fallback');
  const report = loader.buildAssetLoadReport(pack, { reducedMotion: true });

  assert.equal(loader.version, 'agent-town-world-grid-asset-loader-v2');
  assert.equal(report.assetAwareLoaderExists, true);
  assert.equal(report.mode, 'deterministic-fallback-assets');
  assert.equal(report.packId, pack.packId);
  assert.equal(report.plannedTextureTargetCount, 23);
  assert.equal(report.materialTargetCount, 9);
  assert.equal(report.loadedTextureCount, 0);
  assert.equal(report.fallbackTextureCount, 23);
  assert.equal(report.handledMissingTextureCount, 23);
  assert.equal(report.missingTextureCount, 0);
  assert.equal(report.performanceBudgetPassed, true);
  assert.equal(report.reducedMotion, true);
  assert.equal(report.targetKindCounts['terrain-texture'], 9);
  assert.equal(report.targetKindCounts['resource-icon'], 4);
  assert.equal(report.targetKindCounts['building-billboard'], 6);
  assert.equal(report.targetKindCounts['character-sprite'], 1);
  assert.equal(report.targetKindCounts['ui-ornament'], 2);
  assert.equal(report.targetKindCounts.postcard, 1);
  assert.equal(report.loadTargets.every((target) => target.generatedLabel && target.status === 'fallback-ready'), true);
});

test('world-grid asset loader accepts only safe public runtime assets and keeps unsafe paths on fallback', () => {
  const loader = loadBrowserAssetLoader();
  const pack = createLoaderPack('owner_asset_loader_runtime');
  const safePath = `public/experiences/world-grid/generated/${pack.packId}/sprites/resource-wood.webp`;
  const report = loader.buildAssetLoadReport(pack, {
    runtimeAssets: [
      {
        canonicalTarget: 'resource.wood',
        targetKind: 'resource-icon',
        publicPath: safePath
      },
      {
        canonicalTarget: 'resource.stone',
        targetKind: 'resource-icon',
        publicPath: '../private/stone.webp'
      }
    ]
  });
  const loaded = report.loadTargets.find((target) => target.canonicalTarget === 'resource.wood');
  const rejected = report.loadTargets.find((target) => target.canonicalTarget === 'resource.stone');

  assert.equal(report.mode, 'runtime-public-assets');
  assert.equal(report.loadedTextureCount, 1);
  assert.equal(report.fallbackTextureCount, 22);
  assert.equal(report.missingTextureCount, 0);
  assert.equal(loaded.status, 'runtime-public-asset-ready');
  assert.equal(loaded.runtimePath, safePath);
  assert.equal(loaded.browserPath, `/experiences/world-grid/generated/${pack.packId}/sprites/resource-wood.webp`);
  assert.equal(rejected.status, 'fallback-ready');
  assert.equal(loader.isSafeRuntimeAssetPath(safePath), true);
  assert.equal(loader.isSafeRuntimeAssetPath('../private/stone.webp'), false);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadManifest } = require('./v1_4_2_test_helpers');

const P0_WORLD_OBJECTS = [
  'hq',
  'lumber_camp',
  'farm_plot',
  'quarry',
  'workshop',
  'market_stall',
  'contract_board',
  'public_square',
  'foreman_hut',
  'clover'
];

test('scene backgrounds declare layered-plates metadata and forbid baked live objects', () => {
  const manifest = loadManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  const sceneAssets = assets.filter((asset) => String(asset?.id || '').startsWith('founders_plot_scene_'));
  const liveAssets = assets.filter((asset) => asset?.layerRole === 'live-object');
  const cloverAssets = assets.filter((asset) => asset?.characterId === 'clover');

  assert.equal(sceneAssets.length, 2, 'expected desktop and mobile scene plates');
  sceneAssets.forEach((asset) => {
    assert.equal(asset.layerRole, 'scene-base', `${asset.id} must declare scene-base layerRole`);
    assert.equal(asset?.sceneLayering?.mode, 'layered_plates', `${asset.id} must declare layered_plates mode`);
    assert.equal(asset?.sceneLayering?.containsLiveStatefulObjects, false, `${asset.id} must forbid baked live objects`);
    const forbidden = Array.isArray(asset?.sceneLayering?.forbiddenBakedContent)
      ? asset.sceneLayering.forbiddenBakedContent
      : [];
    P0_WORLD_OBJECTS.forEach((worldObjectId) => {
      assert.ok(forbidden.includes(worldObjectId), `${asset.id} must forbid baked ${worldObjectId}`);
    });
  });

  [
    'hq',
    'lumber_camp',
    'farm_plot',
    'quarry',
    'workshop',
    'market_stall',
    'contract_board',
    'public_square',
    'foreman_hut',
    'journal',
    'approval_inbox',
    'lot'
  ].forEach((worldObjectId) => {
    assert.ok(
      liveAssets.some((asset) => String(asset?.worldObjectId || '') === worldObjectId && asset?.stateDriven === true),
      `missing live-object metadata for ${worldObjectId}`
    );
  });

  assert.ok(cloverAssets.length > 0, 'missing Clover character assets');
  cloverAssets.forEach((asset) => {
    assert.equal(asset.layerRole, 'character', `${asset.id} must declare character layerRole`);
    assert.equal(asset.stateDriven, true, `${asset.id} must remain state-driven`);
  });
});

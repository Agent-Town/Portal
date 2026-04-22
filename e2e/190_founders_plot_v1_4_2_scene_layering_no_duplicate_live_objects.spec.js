const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('default route separates scene plates from live objects and keeps hero/debug assets out of gameplay', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const layering = await frame.evaluate(async () => {
    const manifest = await fetch('/experiences/founders-plot/assets/asset-manifest.json', { credentials: 'include', cache: 'no-store' }).then((response) => response.json());
    const sceneAssets = (manifest?.assets || []).filter((asset) => String(asset?.id || '').startsWith('founders_plot_scene_'));
    const stage = document.querySelector('.at-fp-stage');
    const liveLayer = document.querySelector('.at-fp-stageObjects');
    const gameplaySrcs = Array.from(document.querySelectorAll('.at-fp-stage img')).map((node) => node.getAttribute('src') || '');
    return {
      stageLayerRole: stage?.getAttribute('data-layer-role') || '',
      liveLayerRole: liveLayer?.getAttribute('data-layer-role') || '',
      sceneAssetIds: sceneAssets.map((asset) => asset.id),
      sceneLayeringModes: sceneAssets.map((asset) => asset?.sceneLayering?.mode || ''),
      containsLiveObjects: sceneAssets.map((asset) => asset?.sceneLayering?.containsLiveStatefulObjects),
      visibleWorldObjects: Array.from(document.querySelectorAll('[data-layer-role="live-object"][data-world-object]')).map((node) => node.getAttribute('data-world-object') || ''),
      gameplaySrcs,
      visibleText: document.body.innerText
    };
  });

  expect(layering.stageLayerRole).toBe('scene-base');
  expect(layering.liveLayerRole).toBe('live-object');
  expect(layering.sceneAssetIds).toEqual(expect.arrayContaining([
    'founders_plot_scene_desktop_v1_4_2',
    'founders_plot_scene_mobile_v1_4_2'
  ]));
  layering.sceneLayeringModes.forEach((mode) => expect(mode).toBe('layered_plates'));
  layering.containsLiveObjects.forEach((value) => expect(value).toBe(false));
  expect(layering.visibleWorldObjects).toEqual(expect.arrayContaining([
    'hq',
    'contract_board',
    'public_square',
    'foreman_hut'
  ]));
  layering.gameplaySrcs.forEach((src) => {
    expect(src).not.toMatch(/hero-cast/i);
    expect(src).not.toMatch(/townhall-onboarding|brain-connect|agenttown\.jpeg/i);
  });
  expect(layering.visibleText).not.toMatch(/OpenRouter|provider|runtimeId|Worker Traffic|Skill Context/i);
});

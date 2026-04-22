const { test, expect } = require('@playwright/test');
const { openFoundersPlotFrame } = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('HQ level 1, 3, and 5 read as distinct civic growth states', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const galleryInfo = await frame.evaluate(async () => {
    const state = structuredClone(window.__foundersPlotTest.getState()?.state || {});
    const manifest = await fetch('/experiences/founders-plot/assets/asset-manifest.json', { credentials: 'include', cache: 'no-store' }).then((response) => response.json());
    const assetMap = Object.fromEntries((manifest?.assets || []).map((asset) => [String(asset?.id || ''), asset]));

    const ensureGallery = () => {
      let gallery = document.getElementById('hqProgressionGallery');
      if (!gallery) {
        gallery = document.createElement('div');
        gallery.id = 'hqProgressionGallery';
        gallery.className = 'at-fp-hqProgressionGallery';
        gallery.style.cssText = [
          'position:fixed',
          'left:16px',
          'top:16px',
          'z-index:9999',
          'width:calc(100vw - 32px)',
          'display:grid',
          'grid-template-columns:repeat(3, minmax(0, 1fr))',
          'gap:12px',
          'padding:12px',
          'border-radius:24px',
          'background:rgba(255, 247, 230, 0.96)',
          'box-shadow:0 18px 42px rgba(61, 32, 15, 0.22)'
        ].join(';');
        document.body.appendChild(gallery);
      }
      gallery.innerHTML = '';
      return gallery;
    };

    const hqBuilding = (state.buildings || []).find((building) => building?.type === 'HQ');
    const gallery = ensureGallery();
    const entries = [];
    [1, 3, 5].forEach((level) => {
      const fixtureState = structuredClone(state);
      const fixtureHq = (fixtureState.buildings || []).find((building) => building?.type === 'HQ');
      if (fixtureHq) {
        fixtureHq.level = level;
        fixtureHq.state = 'READY';
        fixtureHq.runningJob = null;
        fixtureHq.completedJobs = [];
      }
      fixtureState.progress = {
        ...(fixtureState.progress || {}),
        currentLevel: level
      };
      fixtureState.plot = {
        ...(fixtureState.plot || {}),
        hqLevel: level
      };
      const scene = window.FoundersPlotSceneState.createSceneState(fixtureState, {
        viewportWidth: 1280,
        selectedKey: 'hq'
      });
      const card = document.createElement('section');
      card.className = 'at-fp-hqProgressionCard';
      card.dataset.hqLevel = String(level);
      card.style.cssText = 'display:grid;gap:8px;padding:10px;border-radius:18px;background:rgba(255,255,255,0.52);';
      const stageNode = document.createElement('div');
      stageNode.className = 'at-fp-hqProgressionStage';
      stageNode.style.cssText = 'position:relative;min-height:280px;border-radius:22px;overflow:hidden;';
      card.appendChild(stageNode);
      gallery.appendChild(card);
      window.FoundersPlotSceneRender.renderPlotStage(stageNode, scene, { assetMap });
      const hqNode = stageNode.querySelector('[data-world-object="hq"]');
      entries.push({
        level,
        objectId: hqNode?.getAttribute('data-scene-object-id') || '',
        assetId: hqNode?.getAttribute('data-asset-id') || '',
        visualTier: hqNode?.getAttribute('data-visual-tier') || '',
        label: hqNode?.getAttribute('aria-label') || ''
      });
    });
    return entries;
  });

  expect(galleryInfo).toHaveLength(3);
  expect(galleryInfo[0].objectId).toBe('HQ');
  expect(galleryInfo[0].visualTier).toMatch(/starter|level-1/i);
  expect(galleryInfo[1].visualTier).toMatch(/improved|level-3/i);
  expect(galleryInfo[2].visualTier).toMatch(/established|level-5/i);
  expect(galleryInfo[0].assetId).not.toBe('');
  expect(galleryInfo[1].assetId).not.toBe('');
  expect(galleryInfo[2].assetId).not.toBe('');
  expect(galleryInfo[0].label).toMatch(/level 1/i);
  expect(galleryInfo[1].label).toMatch(/level 3/i);
  expect(galleryInfo[2].label).toMatch(/level 5/i);

  await expect(frame.locator('#hqProgressionGallery')).toHaveScreenshot('founders-v1-4-2-cleanup-hq-progression-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});

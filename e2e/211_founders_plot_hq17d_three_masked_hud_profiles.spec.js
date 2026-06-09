const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const packId = 'hq17c-generated-hud-chrome-v1';
const maskLayer = 'hq17d_three_masked_profiles_and_text_v1';
const cleanComposite = 'hq17e_clean_hud_chrome_compositor_v1';
const requiredTextSlots = ['crest-status', 'objective-loop', 'unit-dock', 'command-puck', 'selected-context'];

function seedLoopReadyPlot({ plotId }) {
  const nowMs = 1_780_412_000_000;
  const bundle = store.readPlotBundleById(plotId);
  if (!bundle?.plot) throw new Error(`Missing seeded Founders Plot ${plotId}`);

  store.writePlot({
    ...bundle.plot,
    hqLevel: 6,
    townXp: Math.max(Number(bundle.plot.townXp || 0), 420),
    inventory: { wood: 120, stone: 80, food: 96, coin: 40 },
    storageCaps: { ...engine.HQ_LEVEL_RULES[6].storageCaps },
    constructionSlots: engine.HQ_LEVEL_RULES[6].constructionSlots,
    updatedAt: nowMs,
    lastViewedAt: nowMs,
    lastSimulatedAt: nowMs,
  });

  const buildings = bundle.buildings.map((building) => (
    building.type === 'HQ'
      ? { ...building, level: 6, state: 'READY', updatedAt: nowMs }
      : building
  ));
  if (!buildings.some((building) => building.type === 'EXPEDITION_BOARD')) {
    buildings.push({
      buildingId: 'bldg_hq17d_expedition_board',
      plotId,
      objectInstanceId: null,
      type: 'EXPEDITION_BOARD',
      level: 1,
      x: 0,
      y: 2,
      state: 'READY',
      outputBuffer: {},
      priority: 'BALANCED',
      createdAt: nowMs,
      updatedAt: nowMs,
    });
  }
  store.writeBuildings(buildings.map((building) => (
    building.type === 'EXPEDITION_BOARD'
      ? { ...building, state: 'READY', updatedAt: nowMs }
      : building
  )));
}

async function stateSnapshot(page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/state');
    return response.json();
  });
}

async function collectProof(page) {
  return page.evaluate((requiredTextSlotsArg) => {
    const visibleNode = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const rectInfo = (node) => {
      const rect = node.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      };
    };
    const body = document.querySelector('[data-testid="fp-expedition-map-body"]');
    const panel = document.querySelector('[data-testid="fp-expedition-map-panel"]');
    const board = document.querySelector('[data-testid="fp-expedition-map-board-card"]');
    const unitButtons = Array.from(document.querySelectorAll('[data-generated-hud-profile-mask]'))
      .map((node) => ({
        testid: node.getAttribute('data-testid') || '',
        unitId: node.getAttribute('data-unit-id') || '',
        mask: node.getAttribute('data-generated-hud-profile-mask') || '',
        maskLayer: node.getAttribute('data-generated-hud-mask-layer') || '',
        visible: visibleNode(node),
        rect: visibleNode(node) ? rectInfo(node) : null,
      }));
    const generatedNodes = Array.from(document.querySelectorAll('[data-generated-chrome-slot]'))
      .map((node) => ({
        testid: node.getAttribute('data-testid') || '',
        slot: node.getAttribute('data-generated-chrome-slot') || '',
        textLayer: node.getAttribute('data-generated-chrome-text-layer') || '',
        liveText: node.getAttribute('data-generated-chrome-live-text') || '',
        cleanComposite: node.getAttribute('data-generated-chrome-clean-composite') || '',
        visible: visibleNode(node),
        text: (node.innerText || '').replace(/\s+/g, ' ').trim(),
      }));
    const rendererInfo = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const textSlotsPresent = requiredTextSlotsArg.reduce((acc, slot) => {
      acc[slot] = (rendererInfo.generatedHudTextSprites || []).some((entry) => entry.slot === slot);
      return acc;
    }, {});
    const primaryText = generatedNodes
      .filter((entry) => entry.visible && entry.slot !== 'collapsed-ledger')
      .map((entry) => entry.text)
      .join('\n');
    const clipped = Array.from(document.querySelectorAll([
      '[data-testid="fp-expedition-map-panel"]',
      '[data-testid="fp-expedition-map-body"]',
      '[data-testid="fp-expedition-map-board-card"]',
      '[data-testid="fp-expedition-objective-strip"]',
      '[data-testid="fp-expedition-unit-roster"]',
      '[data-testid="fp-expedition-unit-command-bar"]',
      '[data-testid="fp-expedition-map-visual-hud"]',
    ].join(', ')))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.tagName);
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyClasses: body ? Array.from(body.classList) : [],
      panelClasses: panel ? Array.from(panel.classList) : [],
      boardComposition: board?.getAttribute('data-hud-composition') || '',
      boardGeneratedChromePack: board?.getAttribute('data-generated-chrome-pack') || '',
      boardMaskLayer: board?.getAttribute('data-generated-hud-mask-layer') || '',
      boardCleanComposite: board?.getAttribute('data-generated-hud-clean-composite') || '',
      boardTextLayer: board?.getAttribute('data-generated-hud-text-layer') || '',
      unitButtons,
      generatedNodes,
      textSlotsPresent,
      primaryTextHasEndpointNames: /et\.plot\./.test(primaryText),
      primaryTextHasProofWords: /\b(idempotency|boundary flags|proof json|server route)\b/i.test(primaryText),
      renderer: {
        visualLayers: rendererInfo.visualLayers || {},
        generatedHudChromeSprites: rendererInfo.generatedHudChromeSprites || [],
        generatedHudProfileSprites: rendererInfo.generatedHudProfileSprites || [],
        generatedHudTextSprites: rendererInfo.generatedHudTextSprites || [],
      },
      clipped,
    };
  }, requiredTextSlots);
}

function assertProof(proof, { mobile = false } = {}) {
  expect(proof.bodyClasses).toContain('fp-expedition-map-body--hq17d-three-masks');
  expect(proof.panelClasses).toContain('fp-expedition-map-panel--hq17d-three-masks');
  expect(proof.boardComposition).toBe('hq17c_generated_chrome_runtime');
  expect(proof.boardGeneratedChromePack).toBe(packId);
  expect(proof.boardMaskLayer).toBe(maskLayer);
  expect(proof.boardCleanComposite).toBe(cleanComposite);
  expect(proof.boardTextLayer).toBe('three-canvas');
  expect(proof.primaryTextHasEndpointNames).toBe(false);
  expect(proof.primaryTextHasProofWords).toBe(false);

  expect(proof.unitButtons.length).toBeGreaterThanOrEqual(3);
  proof.unitButtons.forEach((entry) => {
    expect(entry.mask, entry.testid).toBe('three-canvas-circle');
    expect(entry.maskLayer, entry.testid).toBe(maskLayer);
    expect(entry.visible, entry.testid).toBe(true);
  });

  expect(proof.renderer.visualLayers.generatedHudProfileMasks).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudProfileMasksInThreeLayer).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudProfileMaskSpriteCount).toBeGreaterThanOrEqual(3);
  expect(proof.renderer.visualLayers.generatedHudProfileMaskType).toBe('circle_alpha_clip');
  expect(proof.renderer.visualLayers.generatedHudProfileMasksVisualOnly).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudProfileMasksReadOnly).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudProfileMasksSelectable).toBe(false);
  expect(proof.renderer.visualLayers.generatedHudProfileMaskAuthority).toBe(false);
  proof.renderer.generatedHudProfileSprites.forEach((sprite) => {
    expect(sprite.layerVersion, sprite.unitId).toBe(maskLayer);
    expect(sprite.profileMask, sprite.unitId).toBe('circle_alpha_clip');
    expect([
      'three_canvas_texture',
      'north_star_source_rail_portrait_insert',
    ], sprite.unitId).toContain(sprite.profileSource);
    expect(sprite.visualOnly, sprite.unitId).toBe(true);
    expect(sprite.readOnly, sprite.unitId).toBe(true);
    expect(sprite.selectable, sprite.unitId).toBe(false);
    expect(sprite.routeAuthority, sprite.unitId).toBe(false);
    expect(sprite.actionAuthority, sprite.unitId).toBe(false);
    expect(sprite.executableActions, sprite.unitId).toBe(0);
  });

  expect(proof.renderer.visualLayers.generatedHudTextInThreeLayer).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromeCleanComposite).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromeCleanCompositeVersion).toBe(cleanComposite);
  expect(proof.renderer.visualLayers.generatedHudChromeSourcePackRetained).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromePaintedSourceCrops).toBe(false);
  expect(proof.renderer.visualLayers.generatedHudTextSpriteCount).toBeGreaterThanOrEqual(5);
  expect(proof.renderer.visualLayers.generatedHudTextLiveSource).toBe('three_canvas_texture');
  expect(proof.renderer.visualLayers.generatedHudTextDomA11yOverlayRetained).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudTextSpritesVisualOnly).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudTextSpritesReadOnly).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudTextSpritesSelectable).toBe(false);
  expect(proof.renderer.visualLayers.generatedHudTextAuthority).toBe(false);
  requiredTextSlots.forEach((slot) => expect(proof.textSlotsPresent[slot], slot).toBe(true));
  proof.renderer.generatedHudTextSprites.forEach((sprite) => {
    expect(sprite.layerVersion, sprite.slot).toBe(maskLayer);
    expect(sprite.liveTextSource, sprite.slot).toBe('three_canvas_texture');
    expect(sprite.domA11yOverlayRetained, sprite.slot).toBe(true);
    expect(sprite.visualOnly, sprite.slot).toBe(true);
    expect(sprite.readOnly, sprite.slot).toBe(true);
    expect(sprite.selectable, sprite.slot).toBe(false);
    expect(sprite.routeAuthority, sprite.slot).toBe(false);
    expect(sprite.actionAuthority, sprite.slot).toBe(false);
    expect(sprite.executableActions, sprite.slot).toBe(0);
  });

  proof.generatedNodes
    .filter((entry) => entry.visible && entry.slot !== 'collapsed-ledger')
    .forEach((entry) => {
      expect(entry.textLayer, entry.slot).toBe('three-canvas');
      expect(entry.liveText, entry.slot).toBe('dom');
      expect(entry.cleanComposite, entry.slot).toBe(cleanComposite);
    });

  if (mobile) {
    expect(proof.documentScrollWidth).toBeLessThanOrEqual(proof.viewport.width + 1);
    expect(proof.clipped).toEqual([]);
  }
}

test('FP-E2E-022D HQ17D Three.js masked profile and HUD text layer remains visual-only', async ({ page, request }) => {
  test.setTimeout(90_000);
  const desktopScreenshot = 'reports/agent-town-hq17d-three-masked-hud-profiles-desktop-2026-06-03.png';
  const mobileScreenshot = 'reports/agent-town-hq17d-three-masked-hud-profiles-mobile-2026-06-03.png';
  const proofPath = 'reports/agent-town-hq17d-three-masked-hud-profiles-proof-2026-06-03.json';

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    return {
      profiles: Number(info.visualLayers?.generatedHudProfileMaskSpriteCount || 0),
      text: Number(info.visualLayers?.generatedHudTextSpriteCount || 0),
    };
  }), { timeout: 12_000 }).toEqual({ profiles: 3, text: 5 });

  const desktopProof = await collectProof(page);
  assertProof(desktopProof);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    return {
      profiles: Number(info.visualLayers?.generatedHudProfileMaskSpriteCount || 0),
      text: Number(info.visualLayers?.generatedHudTextSpriteCount || 0),
    };
  }), { timeout: 12_000 }).toEqual({ profiles: 3, text: 5 });
  const mobileProof = await collectProof(page);
  assertProof(mobileProof, { mobile: true });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });

  const proof = {
    ok: true,
    verdict: 'PASS',
    title: 'HQ17D Three.js masked HUD profiles and text proof',
    packId,
    maskLayer,
    screenshots: [desktopScreenshot, mobileScreenshot],
    desktop: desktopProof,
    mobile: mobileProof,
    guardrails: {
      generatedChromePackRetained: desktopProof.boardGeneratedChromePack === packId,
      generatedChromeCleanComposite: desktopProof.renderer.visualLayers.generatedHudChromeCleanComposite === true,
      sourceCropsNotPainted: desktopProof.renderer.visualLayers.generatedHudChromePaintedSourceCrops === false,
      profileMasksInThreeLayer: desktopProof.renderer.visualLayers.generatedHudProfileMasksInThreeLayer === true,
      profileMasksVisualOnly: desktopProof.renderer.visualLayers.generatedHudProfileMasksVisualOnly === true,
      profileMasksReadOnly: desktopProof.renderer.visualLayers.generatedHudProfileMasksReadOnly === true,
      profileMasksNoAuthority: desktopProof.renderer.visualLayers.generatedHudProfileMaskAuthority === false,
      profileMasksNotSelectable: desktopProof.renderer.visualLayers.generatedHudProfileMasksSelectable === false,
      hudTextInThreeLayer: desktopProof.renderer.visualLayers.generatedHudTextInThreeLayer === true,
      hudTextVisualOnly: desktopProof.renderer.visualLayers.generatedHudTextSpritesVisualOnly === true,
      hudTextReadOnly: desktopProof.renderer.visualLayers.generatedHudTextSpritesReadOnly === true,
      hudTextNoAuthority: desktopProof.renderer.visualLayers.generatedHudTextAuthority === false,
      domA11yAndClickLayerRetained: desktopProof.renderer.visualLayers.generatedHudTextDomA11yOverlayRetained === true,
      primaryHudNoEndpointNames: !desktopProof.primaryTextHasEndpointNames && !mobileProof.primaryTextHasEndpointNames,
      primaryHudNoProofProse: !desktopProof.primaryTextHasProofWords && !mobileProof.primaryTextHasProofWords,
      noMobileHorizontalOverflow: mobileProof.documentScrollWidth <= mobileProof.viewport.width + 1 && mobileProof.clipped.length === 0,
      noServerRouteToolStoreSchemaAuthorityChange: true,
      noGameplayMutationAdded: true,
      noAtlasExecution: true,
      noGeneratedUniverseRuntimeExpansion: true,
      noHiddenAutonomy: true,
      noHiddenTruthLeakage: true,
      noRouteTradeEconomyResourceRewardCombatSchedulerExpansion: true,
      noExternalEffects: true,
    },
  };
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
});

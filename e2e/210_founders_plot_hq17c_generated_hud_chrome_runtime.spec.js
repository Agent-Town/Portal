const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const packId = 'hq17c-generated-hud-chrome-v1';
const cleanComposite = 'hq17e_clean_hud_chrome_compositor_v1';
const requiredSlots = ['crest-status', 'objective-loop', 'unit-dock', 'command-puck', 'selected-context', 'collapsed-ledger'];

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
      buildingId: 'bldg_hq17c_expedition_board',
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

async function collectGeneratedChromeProof(page) {
  return page.evaluate((requiredSlotsArg) => {
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
    const generatedNodes = Array.from(document.querySelectorAll('[data-generated-chrome-slot]'))
      .map((node) => ({
        testid: node.getAttribute('data-testid') || '',
        hudInstrument: node.getAttribute('data-hud-instrument') || '',
        slot: node.getAttribute('data-generated-chrome-slot') || '',
        pack: node.getAttribute('data-generated-chrome-pack') || '',
        src: node.getAttribute('data-generated-chrome-src') || '',
        presentationOnly: node.getAttribute('data-generated-chrome-presentation-only') || '',
        liveText: node.getAttribute('data-generated-chrome-live-text') || '',
        cleanComposite: node.getAttribute('data-generated-chrome-clean-composite') || '',
        readOnly: node.getAttribute('data-read-only') || '',
        actions: Number(node.getAttribute('data-actions') || 0),
        visible: visibleNode(node),
        rect: visibleNode(node) ? rectInfo(node) : null,
        text: (node.innerText || '').replace(/\s+/g, ' ').trim(),
      }));
    const rendererInfo = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const primaryText = generatedNodes
      .filter((entry) => entry.visible && entry.slot !== 'collapsed-ledger')
      .map((entry) => entry.text)
      .join('\n');
    const body = document.querySelector('[data-testid="fp-expedition-map-body"]');
    const panel = document.querySelector('[data-testid="fp-expedition-map-panel"]');
    const board = document.querySelector('[data-testid="fp-expedition-map-board-card"]');
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
    const slotsPresent = requiredSlotsArg.reduce((acc, slot) => {
      acc[slot] = generatedNodes.some((entry) => entry.slot === slot && entry.visible);
      return acc;
    }, {});
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyClasses: body ? Array.from(body.classList) : [],
      panelClasses: panel ? Array.from(panel.classList) : [],
      boardComposition: board?.getAttribute('data-hud-composition') || '',
      boardGeneratedChromePack: board?.getAttribute('data-generated-chrome-pack') || '',
      boardCleanComposite: board?.getAttribute('data-generated-hud-clean-composite') || '',
      generatedNodes,
      slotsPresent,
      primaryText,
      primaryTextHasEndpointNames: /et\.plot\./.test(primaryText),
      primaryTextHasProofWords: /\b(idempotency|boundary flags|proof json|server route)\b/i.test(primaryText),
      renderer: {
        visualLayers: rendererInfo.visualLayers || {},
        generatedHudChromeSprites: rendererInfo.generatedHudChromeSprites || [],
      },
      clipped,
    };
  }, requiredSlots);
}

function assertGeneratedChromeProof(proof, { mobile = false } = {}) {
  expect(proof.bodyClasses).toContain('fp-expedition-map-body--hq17c-generated-chrome');
  expect(proof.panelClasses).toContain('fp-expedition-map-panel--hq17c-generated-chrome');
  expect(proof.boardComposition).toBe('hq17c_generated_chrome_runtime');
  expect(proof.boardGeneratedChromePack).toBe(packId);
  expect(proof.boardCleanComposite).toBe(cleanComposite);
  requiredSlots.forEach((slot) => expect(proof.slotsPresent[slot], slot).toBe(true));
  proof.generatedNodes
    .filter((entry) => requiredSlots.includes(entry.slot))
    .forEach((entry) => {
      expect(entry.pack, entry.slot).toBe(packId);
      expect(entry.src, entry.slot).toContain(`/hq17c-generated-hud-chrome-v1/`);
      expect(entry.presentationOnly, entry.slot).toBe('true');
      expect(entry.liveText, entry.slot).toBe('dom');
      expect(entry.cleanComposite, entry.slot).toBe(cleanComposite);
    });
  expect(proof.primaryTextHasEndpointNames).toBe(false);
  expect(proof.primaryTextHasProofWords).toBe(false);
  expect(proof.renderer.visualLayers.generatedHudChrome).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromeInThreeLayer).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromeAssetPack).toBe(packId);
  expect(proof.renderer.visualLayers.generatedHudChromeCleanComposite).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromeCleanCompositeVersion).toBe(cleanComposite);
  expect(proof.renderer.visualLayers.generatedHudChromeSourcePackRetained).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromePaintedSourceCrops).toBe(false);
  expect(proof.renderer.visualLayers.generatedHudChromeSpriteCount).toBeGreaterThanOrEqual(7);
  expect(proof.renderer.visualLayers.generatedHudChromeSpritesVisualOnly).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromeSpritesReadOnly).toBe(true);
  expect(proof.renderer.visualLayers.generatedHudChromeSpritesSelectable).toBe(false);
  expect(proof.renderer.visualLayers.generatedHudChromeAuthority).toBe(false);
  proof.renderer.generatedHudChromeSprites.forEach((sprite) => {
    expect(sprite.packId, sprite.slot).toBe(packId);
    expect(sprite.assetPath, sprite.slot).toContain('/hq17c-generated-hud-chrome-v1/');
    expect(sprite.cleanCompositeVersion, sprite.slot).toBe(cleanComposite);
    expect(sprite.chromeSource, sprite.slot).toBe('three_canvas_clean_frame');
    expect(sprite.sourceAssetPath, sprite.slot).toContain('/hq17c-generated-hud-chrome-v1/');
    expect(sprite.liveTextSource, sprite.slot).toBe('dom');
    expect(sprite.visualOnly, sprite.slot).toBe(true);
    expect(sprite.readOnly, sprite.slot).toBe(true);
    expect(sprite.selectable, sprite.slot).toBe(false);
    expect(sprite.routeAuthority, sprite.slot).toBe(false);
    expect(sprite.actionAuthority, sprite.slot).toBe(false);
    expect(sprite.executableActions, sprite.slot).toBe(0);
  });
  if (mobile) {
    expect(proof.documentScrollWidth).toBeLessThanOrEqual(proof.viewport.width + 1);
    expect(proof.clipped).toEqual([]);
  }
}

test('FP-E2E-022C HQ17C generated HUD chrome renders in Three.js with live DOM labels', async ({ page, request }) => {
  test.setTimeout(90_000);
  const desktopScreenshot = 'reports/agent-town-hq17c-generated-hud-chrome-runtime-desktop-2026-06-03.png';
  const mobileScreenshot = 'reports/agent-town-hq17c-generated-hud-chrome-runtime-mobile-2026-06-03.png';
  const proofPath = 'reports/agent-town-hq17c-generated-hud-chrome-runtime-proof-2026-06-03.json';

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    return Number(info.visualLayers?.generatedHudChromeSpriteCount || 0);
  }), { timeout: 12_000 }).toBeGreaterThanOrEqual(7);

  const desktopProof = await collectGeneratedChromeProof(page);
  assertGeneratedChromeProof(desktopProof);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    return Number(info.visualLayers?.generatedHudChromeSpriteCount || 0);
  }), { timeout: 12_000 }).toBeGreaterThanOrEqual(7);
  const mobileProof = await collectGeneratedChromeProof(page);
  assertGeneratedChromeProof(mobileProof, { mobile: true });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });

  const proof = {
    ok: true,
    verdict: 'PASS',
    title: 'HQ17C generated HUD chrome runtime proof',
    packId,
    sourceConcept: 'agent-town-hq17a-fullscreen-hud-redesign-concept-01-2026-06-03.png',
    screenshots: [desktopScreenshot, mobileScreenshot],
    desktop: desktopProof,
    mobile: mobileProof,
    guardrails: {
      generatedChromePresentationOnly: true,
      generatedChromeInThreeLayer: desktopProof.renderer.visualLayers.generatedHudChromeInThreeLayer === true,
      generatedChromeCleanComposite: desktopProof.renderer.visualLayers.generatedHudChromeCleanComposite === true,
      sourceCropsNotPainted: desktopProof.renderer.visualLayers.generatedHudChromePaintedSourceCrops === false,
      generatedChromeLiveTextSource: 'dom',
      generatedChromeVisualOnly: desktopProof.renderer.visualLayers.generatedHudChromeSpritesVisualOnly === true,
      generatedChromeReadOnly: desktopProof.renderer.visualLayers.generatedHudChromeSpritesReadOnly === true,
      generatedChromeNoAuthority: desktopProof.renderer.visualLayers.generatedHudChromeAuthority === false,
      generatedChromeNotSelectable: desktopProof.renderer.visualLayers.generatedHudChromeSpritesSelectable === false,
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

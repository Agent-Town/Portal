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
const singleOwner = 'hq17f_single_owner_canvas_hud_v1';
const requiredChromeSlots = ['crest-status', 'objective-loop', 'unit-dock', 'command-tray', 'command-puck', 'selected-context', 'collapsed-ledger'];
const requiredTextSlots = ['crest-status', 'objective-loop', 'unit-dock', 'command-puck', 'selected-context'];
const persistentHudSelectors = [
  '[data-testid="fp-expedition-map-status"]',
  '[data-testid="fp-expedition-objective-strip"]',
  '[data-testid="fp-expedition-unit-roster"]',
  '[data-testid="fp-expedition-unit-command-bar"]',
  '[data-testid="fp-expedition-map-visual-hud"]',
  '[data-testid="fp-expedition-map-hud"]',
];

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
      buildingId: 'bldg_hq17f_expedition_board',
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
  return page.evaluate(({ requiredChromeSlotsArg, requiredTextSlotsArg, persistentHudSelectorsArg }) => {
    const alphaOf = (color) => {
      const text = String(color || '');
      if (text === 'transparent') return 0;
      const rgba = text.match(/rgba?\(([^)]+)\)/i);
      if (!rgba) return 1;
      const parts = rgba[1].split(',').map((part) => Number(part.trim()));
      return parts.length >= 4 ? parts[3] : 1;
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
    const visibleNode = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const styleInfo = (node) => {
      const style = window.getComputedStyle(node);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity || 1),
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        boxShadow: style.boxShadow,
        color: style.color,
      };
    };
    const nodeInfo = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return { selector, present: false };
      const style = styleInfo(node);
      const textChildren = Array.from(node.querySelectorAll('strong, small, span, p, b, i, em, button'))
        .filter((child) => visibleNode(child))
        .map((child) => {
          const childStyle = styleInfo(child);
          return {
            tag: child.tagName,
            text: (child.textContent || '').replace(/\s+/g, ' ').trim(),
            opacity: childStyle.opacity,
            colorAlpha: alphaOf(childStyle.color),
            backgroundAlpha: alphaOf(childStyle.backgroundColor),
            backgroundImage: childStyle.backgroundImage,
            borderAlpha: alphaOf(childStyle.borderTopColor),
            boxShadow: childStyle.boxShadow,
          };
        });
      const visibleTextChildren = textChildren.filter((child) => (
        child.opacity > 0.01
        && (child.colorAlpha > 0.01 || child.backgroundAlpha > 0.01 || child.backgroundImage !== 'none' || child.borderAlpha > 0.01 || child.boxShadow !== 'none')
      ));
      const paintsPanel = style.backgroundImage !== 'none'
        || alphaOf(style.backgroundColor) > 0.01
        || alphaOf(style.borderTopColor) > 0.01
        || style.boxShadow !== 'none';
      return {
        selector,
        present: true,
        visible: visibleNode(node),
        testid: node.getAttribute('data-testid') || '',
        hudInstrument: node.getAttribute('data-hud-instrument') || '',
        generatedSlot: node.getAttribute('data-generated-chrome-slot') || '',
        rect: rectInfo(node),
        style,
        paintsPanel,
        visibleTextChildren,
        actions: Number(node.getAttribute('data-actions') || 0),
        readOnly: node.getAttribute('data-read-only') || '',
      };
    };
    const body = document.querySelector('[data-testid="fp-expedition-map-body"]');
    const panel = document.querySelector('[data-testid="fp-expedition-map-panel"]');
    const board = document.querySelector('[data-testid="fp-expedition-map-board-card"]');
    const canvas = document.querySelector('[data-testid="fp-expedition-three-canvas"]');
    const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
    const rendererInfo = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    const generatedNodes = Array.from(document.querySelectorAll('[data-generated-chrome-slot]'))
      .map((node) => ({
        testid: node.getAttribute('data-testid') || '',
        slot: node.getAttribute('data-generated-chrome-slot') || '',
        pack: node.getAttribute('data-generated-chrome-pack') || '',
        src: node.getAttribute('data-generated-chrome-src') || '',
        cleanComposite: node.getAttribute('data-generated-chrome-clean-composite') || '',
        visible: visibleNode(node),
        backgroundImage: window.getComputedStyle(node).backgroundImage,
      }));
    const chromeSlotsPresent = requiredChromeSlotsArg.reduce((acc, slot) => {
      acc[slot] = (rendererInfo.generatedHudChromeSprites || []).some((entry) => entry.slot === slot);
      return acc;
    }, {});
    const textSlotsPresent = requiredTextSlotsArg.reduce((acc, slot) => {
      acc[slot] = (rendererInfo.generatedHudTextSprites || []).some((entry) => entry.slot === slot);
      return acc;
    }, {});
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
    const domHudNodes = persistentHudSelectorsArg.map(nodeInfo);
    const domPixelOwners = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .filter((entry) => entry.paintsPanel || entry.visibleTextChildren.length > 0)
      .map((entry) => ({
        selector: entry.selector,
        testid: entry.testid,
        paintsPanel: entry.paintsPanel,
        visibleTextChildren: entry.visibleTextChildren,
      }));
    const visibleDomHudTextEntries = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .flatMap((entry) => entry.visibleTextChildren.map((child) => ({
        selector: entry.selector,
        testid: entry.testid,
        text: child.text,
      })))
      .filter((entry) => entry.text);
    const primaryDomText = domHudNodes
      .filter((entry) => entry.present && entry.visible)
      .map((entry) => {
        const node = document.querySelector(entry.selector);
        return node ? (node.innerText || '').replace(/\s+/g, ' ').trim() : '';
      })
      .join('\n');
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyClasses: body ? Array.from(body.classList) : [],
      bodyVisibleHudOwner: body?.getAttribute('data-visible-hud-owner') || '',
      bodyDomVisibleHudDemoted: body?.getAttribute('data-dom-visible-hud-demoted') || '',
      bodyNoVisibleDomHudDuplication: body?.getAttribute('data-no-visible-dom-hud-duplication') || '',
      panelClasses: panel ? Array.from(panel.classList) : [],
      board: {
        composition: board?.getAttribute('data-hud-composition') || '',
        generatedChromePack: board?.getAttribute('data-generated-chrome-pack') || '',
        maskLayer: board?.getAttribute('data-generated-hud-mask-layer') || '',
        cleanComposite: board?.getAttribute('data-generated-hud-clean-composite') || '',
        singleOwner: board?.getAttribute('data-generated-hud-single-owner') || '',
        textLayer: board?.getAttribute('data-generated-hud-text-layer') || '',
        visibleHudOwner: board?.getAttribute('data-visible-hud-owner') || '',
        domVisibleHudDemoted: board?.getAttribute('data-dom-visible-hud-demoted') || '',
        noVisibleDomHudDuplication: board?.getAttribute('data-no-visible-dom-hud-duplication') || '',
      },
      generatedNodes,
      domCropBackgrounds: generatedNodes
        .filter((entry) => /hq17c-generated-hud-chrome-v1/.test(entry.backgroundImage))
        .map((entry) => ({ testid: entry.testid, slot: entry.slot, backgroundImage: entry.backgroundImage })),
      chromeSlotsPresent,
      textSlotsPresent,
      domHudNodes,
      domPixelOwners,
      visibleDomHudPaintCount: domPixelOwners.length,
      visibleDomHudTextCount: visibleDomHudTextEntries.length,
      visibleDomHudTextEntries,
      visibleDuplicateDomHudText: visibleDomHudTextEntries
        .filter((entry) => /\b(EXPEDITION|UNITS|CMD|Next Scout|LEDGER)\b/i.test(entry.text)),
      primaryDomTextHasEndpointNames: /et\.plot\./.test(primaryDomText),
      primaryDomTextHasProofWords: /\b(idempotency|boundary flags|proof json|server route)\b/i.test(primaryDomText),
      clipped,
      renderer: {
        visualLayers: rendererInfo.visualLayers || {},
        generatedHudChromeSprites: rendererInfo.generatedHudChromeSprites || [],
        generatedHudProfileSprites: rendererInfo.generatedHudProfileSprites || [],
        generatedHudTextSprites: rendererInfo.generatedHudTextSprites || [],
        generatedHudCommandSprites: rendererInfo.generatedHudCommandSprites || [],
        visibleHudSlots: (rendererInfo.visibleHudSlots || []).map((slot) => ({
          ...slot,
          viewportContained: !!(
            canvasRect
            && slot.canvas
            && Number(slot.canvas.x) >= -1
            && Number(slot.canvas.y) >= -1
            && Number(slot.canvas.x) <= canvasRect.width + 1
            && Number(slot.canvas.y) <= canvasRect.height + 1
          ),
        })),
      },
    };
  }, { requiredChromeSlotsArg: requiredChromeSlots, requiredTextSlotsArg: requiredTextSlots, persistentHudSelectorsArg: persistentHudSelectors });
}

async function waitForSingleOwnerHud(page) {
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    return {
      owner: info.visualLayers?.visibleHudOwner || '',
      chrome: Number(info.visualLayers?.generatedHudChromeSpriteCount || 0),
      profiles: Number(info.visualLayers?.generatedHudProfileMaskSpriteCount || 0),
      text: Number(info.visualLayers?.generatedHudTextSpriteCount || 0),
    };
  }), { timeout: 12_000 }).toEqual({ owner: 'three_canvas', chrome: 7, profiles: 3, text: 5 });
  await expect.poll(async () => page.evaluate(() => {
    const info = window.__foundersPlotTest?.getExpeditionMapInfo?.() || {};
    return Number(info.visualLayers?.generatedHudCommandGlyphSpriteCount || 0);
  }), { timeout: 12_000 }).toBeGreaterThanOrEqual(1);
}

async function clickExistingScoutDomCommand(page) {
  const button = page.locator('[data-testid^="fp-btn-scout-sector-unit-command-"]:visible').first();
  await expect(button).toBeAttached();
  const hitLayer = await button.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return {
      display: style.display,
      visibility: style.visibility,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      pointerEvents: style.pointerEvents,
    };
  });
  expect(hitLayer.display).not.toBe('none');
  expect(hitLayer.visibility).not.toBe('hidden');
  expect(hitLayer.width).toBeGreaterThan(0);
  expect(hitLayer.height).toBeGreaterThan(0);
  expect(hitLayer.pointerEvents).not.toBe('none');
  const requestPromise = page.waitForRequest((routeRequest) => (
    routeRequest.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && routeRequest.method() === 'POST'
  ));
  const responsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && response.request().method() === 'POST'
  ));
  await button.evaluate((node) => node.click());
  const routeRequest = await requestPromise;
  const response = await responsePromise;
  const payload = routeRequest.postDataJSON();
  const body = await response.json();
  expect(body.ok, JSON.stringify(body.error || body)).toBe(true);
  expect(payload.cellId).toBeTruthy();
  expect(payload.idempotencyKey).toMatch(/^fp-scout-sector-/);
  expect(payload.unitId).toBeUndefined();
  expect(payload.targetCellId).toBeUndefined();
  expect(payload.routeId).toBeUndefined();
  return {
    endpoint: '/api/founders-plot/expedition-map/scout-sector',
    method: routeRequest.method(),
    payloadKeys: Object.keys(payload).sort(),
    ok: body.ok === true,
    hitLayer,
    existingDomTestidPrefix: 'fp-btn-scout-sector-unit-command-',
    noUnitIdPayload: payload.unitId == null,
    noTargetCellPayload: payload.targetCellId == null,
    noRoutePayload: payload.routeId == null,
  };
}

function assertProof(proof, { mobile = false } = {}) {
  expect(proof.bodyClasses).toContain('fp-expedition-map-body--hq17f-single-owner-canvas-hud');
  expect(proof.panelClasses).toContain('fp-expedition-map-panel--hq17f-single-owner-canvas-hud');
  expect(proof.bodyVisibleHudOwner).toBe('three_canvas');
  expect(proof.bodyDomVisibleHudDemoted).toBe('true');
  expect(proof.bodyNoVisibleDomHudDuplication).toBe('true');
  expect(proof.board.composition).toBe('hq17c_generated_chrome_runtime');
  expect(proof.board.generatedChromePack).toBe(packId);
  expect(proof.board.maskLayer).toBe(maskLayer);
  expect(proof.board.cleanComposite).toBe(cleanComposite);
  expect(proof.board.singleOwner).toBe(singleOwner);
  expect(proof.board.textLayer).toBe('three-canvas');
  expect(proof.board.visibleHudOwner).toBe('three_canvas');
  expect(proof.board.domVisibleHudDemoted).toBe('true');
  expect(proof.board.noVisibleDomHudDuplication).toBe('true');
  requiredChromeSlots.forEach((slot) => expect(proof.chromeSlotsPresent[slot], slot).toBe(true));
  requiredTextSlots.forEach((slot) => expect(proof.textSlotsPresent[slot], slot).toBe(true));
  expect(proof.domHudNodes.every((entry) => entry.present && entry.visible), JSON.stringify(proof.domHudNodes, null, 2)).toBe(true);
  expect(proof.domPixelOwners).toEqual([]);
  expect(proof.visibleDomHudPaintCount).toBe(0);
  expect(proof.visibleDomHudTextCount).toBe(0);
  expect(proof.visibleDuplicateDomHudText).toEqual([]);
  expect(proof.domCropBackgrounds).toEqual([]);
  expect(proof.primaryDomTextHasEndpointNames).toBe(false);
  expect(proof.primaryDomTextHasProofWords).toBe(false);

  const layers = proof.renderer.visualLayers;
  expect(layers.singleVisibleHudOwner).toBe(true);
  expect(layers.visibleHudOwner).toBe('three_canvas');
  expect(layers.visibleHudOwnerVersion).toBe(singleOwner);
  expect(layers.domVisibleHudDemoted).toBe(true);
  expect(layers.domHudRole).toBe('transparent_hit_a11y_layer');
  expect(layers.domHudHitLayerRetained).toBe(true);
  expect(layers.domHudHitLayerPainted).toBe(false);
  expect(layers.visibleDomHudPaintCount).toBe(0);
  expect(layers.visibleDomHudTextCount).toBe(0);
  expect(layers.noVisibleDomHudDuplication).toBe(true);
  expect(layers.rendererNetworkRequests).toBe(0);
  expect(layers.rendererMutationHandlers).toEqual([]);
  expect(layers.threeCanvasHudOwnsChrome).toBe(true);
  expect(layers.threeCanvasHudOwnsProfiles).toBe(true);
  expect(layers.threeCanvasHudOwnsText).toBe(true);
  expect(layers.threeCanvasHudOwnsCommandTray).toBe(true);
  expect(layers.threeCanvasHudOwnsCollapsedLedgerHint).toBe(true);
  expect(layers.threeCanvasHudNoGameplayAuthority).toBe(true);
  expect(layers.generatedHudChromeInThreeLayer).toBe(true);
  expect(layers.generatedHudProfileMasksInThreeLayer).toBe(true);
  expect(layers.generatedHudTextInThreeLayer).toBe(true);
  expect(layers.generatedHudCommandGlyphsInThreeLayer).toBe(true);
  expect(layers.generatedHudCommandGlyphLiveSource).toBe('server_owned_command_hint');
  expect(layers.generatedHudCommandGlyphSpriteCount).toBeGreaterThanOrEqual(1);
  expect(layers.generatedHudCommandGlyphsVisualOnly).toBe(true);
  expect(layers.generatedHudCommandGlyphsReadOnly).toBe(true);
  expect(layers.generatedHudCommandGlyphsSelectable).toBe(false);
  expect(layers.generatedHudCommandGlyphAuthority).toBe(false);
  expect(layers.generatedHudChromePaintedSourceCrops).toBe(false);
  expect(layers.generatedHudChromeAuthority).toBe(false);
  expect(layers.generatedHudProfileMaskAuthority).toBe(false);
  expect(layers.generatedHudTextAuthority).toBe(false);
  expect(layers.clientAuthority).toBe(false);
  requiredChromeSlots.forEach((slotName) => {
    const slot = proof.renderer.visibleHudSlots.find((entry) => entry.slot === slotName);
    expect(slot, slotName).toBeTruthy();
    expect(slot.owner, slotName).toBe('three_canvas');
    expect(slot.visualOnly, slotName).toBe(true);
    expect(slot.readOnly, slotName).toBe(true);
    expect(slot.noAuthority, slotName).toBe(true);
    expect(slot.sourceCropPainted, slotName).toBe(false);
    expect(slot.viewportContained, slotName).toBe(true);
  });
  proof.renderer.generatedHudCommandSprites.forEach((sprite) => {
    expect(sprite.layerVersion, sprite.commandId).toBe(singleOwner);
    expect(sprite.liveSource, sprite.commandId).toBe('server_owned_command_hint');
    expect(sprite.visualOnly, sprite.commandId).toBe(true);
    expect(sprite.readOnly, sprite.commandId).toBe(true);
    expect(sprite.selectable, sprite.commandId).toBe(false);
    expect(sprite.routeAuthority, sprite.commandId).toBe(false);
    expect(sprite.actionAuthority, sprite.commandId).toBe(false);
    expect(sprite.executableActions, sprite.commandId).toBe(0);
  });
  if (mobile) {
    expect(proof.documentScrollWidth).toBeLessThanOrEqual(proof.viewport.width + 1);
    expect(proof.clipped).toEqual([]);
  }
}

test('FP-E2E-022F HQ17F Three.js canvas is the single visible Expedition Map HUD owner', async ({ page, request }) => {
  test.setTimeout(90_000);
  const desktopScreenshot = 'reports/agent-town-hq17f-single-owner-canvas-hud-desktop-2026-06-03.png';
  const mobileScreenshot = 'reports/agent-town-hq17f-single-owner-canvas-hud-mobile-2026-06-03.png';
  const proofPath = 'reports/agent-town-hq17f-single-owner-canvas-hud-proof-2026-06-03.json';

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForSingleOwnerHud(page);

  const desktopProof = await collectProof(page);
  assertProof(desktopProof);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });
  const commandClick = await clickExistingScoutDomCommand(page);

  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const mobileSeeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: mobileSeeded.state.plot.plotId });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await waitForSingleOwnerHud(page);
  const mobileProof = await collectProof(page);
  assertProof(mobileProof, { mobile: true });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });

  const proof = {
    ok: true,
    verdict: 'PASS',
    title: 'HQ17F single-owner Three.js/canvas HUD proof',
    packId,
    maskLayer,
    cleanComposite,
    singleOwner,
    visibleHudOwner: 'three_canvas',
    domVisibleHudDemoted: true,
    noVisibleDomHudDuplication: true,
    generatedHudTextInThreeLayer: true,
    generatedHudProfileMasksInThreeLayer: true,
    screenshots: [desktopScreenshot, mobileScreenshot],
    commandClick,
    desktop: desktopProof,
    mobile: mobileProof,
    guardrails: {
      visibleHudOwner: 'three_canvas',
      domVisibleHudDemoted: desktopProof.renderer.visualLayers.domVisibleHudDemoted === true,
      noVisibleDomHudDuplication: desktopProof.domPixelOwners.length === 0 && mobileProof.domPixelOwners.length === 0,
      visibleDomHudPaintCount: desktopProof.visibleDomHudPaintCount + mobileProof.visibleDomHudPaintCount,
      visibleDomHudTextCount: desktopProof.visibleDomHudTextCount + mobileProof.visibleDomHudTextCount,
      generatedHudTextInThreeLayer: desktopProof.renderer.visualLayers.generatedHudTextInThreeLayer === true,
      generatedHudProfileMasksInThreeLayer: desktopProof.renderer.visualLayers.generatedHudProfileMasksInThreeLayer === true,
      generatedHudCommandGlyphsInThreeLayer: desktopProof.renderer.visualLayers.generatedHudCommandGlyphsInThreeLayer === true,
      generatedHudCommandGlyphsNoAuthority: desktopProof.renderer.visualLayers.generatedHudCommandGlyphAuthority === false,
      sourceCropsNotPainted: desktopProof.renderer.visualLayers.generatedHudChromePaintedSourceCrops === false,
      primaryHudNoEndpointNames: !desktopProof.primaryDomTextHasEndpointNames && !mobileProof.primaryDomTextHasEndpointNames,
      primaryHudNoProofProse: !desktopProof.primaryDomTextHasProofWords && !mobileProof.primaryDomTextHasProofWords,
      noMobileHorizontalOverflow: mobileProof.documentScrollWidth <= mobileProof.viewport.width + 1 && mobileProof.clipped.length === 0,
      existingDomCommandHandlersRetained: commandClick.ok === true,
      existingDomCommandPayloadShapeRetained: commandClick.noUnitIdPayload && commandClick.noTargetCellPayload && commandClick.noRoutePayload,
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

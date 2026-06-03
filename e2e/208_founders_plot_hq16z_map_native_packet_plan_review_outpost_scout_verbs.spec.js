const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.STORE_PATH = path.join(process.cwd(), 'data', 'store.e2e.sqlite');

const engine = require('../server/founders_plot/engine');
const store = require('../server/founders_plot/store');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

function safeTestId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'item';
}

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
      buildingId: 'bldg_hq16z_expedition_board',
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

async function advanceConvoyArrival({ page, plotId, claimId }) {
  const body = await page.evaluate(async ({ plotId, advanceMs }) => {
    const response = await fetch('/__test__/founders-plot/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plotId, advanceMs }),
    });
    return response.json();
  }, {
    plotId,
    advanceMs: engine.SETTLER_CONVOY_DEF.durationMs + 1,
  });
  expect(body.ok, JSON.stringify(body.error || body)).toBe(true);
  expect(body.state.settlementClaims.find((entry) => entry.claimId === claimId)?.status).toBe('CONVOY_ARRIVED');
  return body;
}

async function waitForCommandTarget(page, predicateSource) {
  await expect.poll(async () => {
    return page.evaluate((source) => {
      const predicate = new Function('target', `return (${source})(target);`);
      return (window.__foundersPlotTest.getExpeditionMapInfo().commandTargets || []).some((target) => predicate(target));
    }, predicateSource);
  }, { timeout: 12_000 }).toBe(true);
  return page.evaluate((source) => {
    const predicate = new Function('target', `return (${source})(target);`);
    return (window.__foundersPlotTest.getExpeditionMapInfo().commandTargets || []).find((target) => predicate(target));
  }, predicateSource);
}

async function clickCommandRing(page, ring) {
  const canvas = page.getByTestId('fp-expedition-three-canvas');
  await page.getByTestId('fp-expedition-map-panel').scrollIntoViewIfNeeded();
  await canvas.click({ position: ring.canvas, force: true });
  await expect(page.getByTestId('fp-expedition-command-preview')).toHaveAttribute('data-command-id', ring.commandId);
  await page.getByTestId('fp-btn-expedition-command-preview-confirm').click();
}

async function selectUnitToken(page, unitId) {
  const token = page.getByTestId(`fp-expedition-unit-token-${unitId}`);
  await token.evaluate((node) => node.click());
  await expect(token).toHaveAttribute('aria-pressed', 'true');
}

test('FP-E2E-022Z packet Plan/Review and outpost Scout cues stay map-native and guarded', async ({ page, request }) => {
  test.setTimeout(120_000);
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  const seeded = await stateSnapshot(page);
  seedLoopReadyPlot({ plotId: seeded.state.plot.plotId });

  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  let live = await stateSnapshot(page);
  const plotId = live.state.plot.plotId;
  const scoutUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'scout');
  const firstScoutTarget = scoutUnit.commandHints.find((command) => command.commandId === 'scout_sector').targetCellIds[0];

  await selectUnitToken(page, scoutUnit.unitId);
  const scoutRing = await waitForCommandTarget(page, `(target) => target.commandId === 'scout_sector' && target.cellId === '${firstScoutTarget}'`);
  const firstScoutResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/scout-sector')
    && response.request().method() === 'POST'
  ));
  await clickCommandRing(page, scoutRing);
  const firstScoutBody = await (await firstScoutResponsePromise).json();
  expect(firstScoutBody.ok, JSON.stringify(firstScoutBody.error || firstScoutBody)).toBe(true);

  const packetSlug = safeTestId(firstScoutBody.eventPacket.packetId);
  const objectiveBridge = page.getByTestId('fp-expedition-survey-bridge');
  await expect(objectiveBridge).toHaveAttribute('data-command-id', 'draft_site_plan_from_packet');
  await expect(objectiveBridge).toHaveAttribute('data-map-native-verb', 'Plan');
  const planButton = objectiveBridge.getByTestId(`fp-btn-draft-site-plan-from-packet-${packetSlug}`);
  await expect(planButton).toHaveText('Plan');
  await expect(planButton).toHaveAttribute('data-action-name', 'et.plot.draft_site_plan_from_packet');
  await expect(planButton).toHaveAttribute('data-map-native-verb', 'Plan');
  const planBridgeProof = await page.evaluate(() => {
    const bridge = document.querySelector('[data-testid="fp-expedition-survey-bridge"]');
    const button = bridge?.querySelector('[data-testid^="fp-btn-draft-site-plan-from-packet-"]');
    return {
      commandId: bridge?.getAttribute('data-command-id') || '',
      mapNativeVerb: bridge?.getAttribute('data-map-native-verb') || '',
      actionName: bridge?.getAttribute('data-action-name') || '',
      buttonText: button?.textContent || '',
      buttonMapNativeVerb: button?.getAttribute('data-map-native-verb') || '',
      visibleText: bridge?.innerText || '',
    };
  });
  expect(planBridgeProof.visibleText).not.toMatch(/\bSurvey\b/);

  const packetPlanResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/expedition-map/draft-site-plan')
    && response.request().method() === 'POST'
  ));
  await planButton.click();
  const packetPlanBody = await (await packetPlanResponsePromise).json();
  expect(packetPlanBody.ok, JSON.stringify(packetPlanBody.error || packetPlanBody)).toBe(true);
  const planId = packetPlanBody.sitePlan.planId;
  expect(packetPlanBody.proof.actionName).toBe('et.plot.draft_site_plan_from_packet');
  expect(packetPlanBody.proof.boundaryFlags.routeCreation).toBe(false);
  expect(packetPlanBody.proof.boundaryFlags.atlasExecution).toBe(false);

  await expect(objectiveBridge).toHaveAttribute('data-command-id', 'review_site_plan');
  await expect(objectiveBridge).toHaveAttribute('data-map-native-verb', 'Review');
  const reviewButton = objectiveBridge.getByTestId(`fp-expedition-survey-bridge-btn-review-site-plan-${safeTestId(planId)}`);
  await expect(reviewButton).toHaveText('Review');
  await expect(reviewButton).toHaveAttribute('data-action-name', 'et.plot.review_site_plan');
  await expect(reviewButton).toHaveAttribute('data-map-native-verb', 'Review');
  const reviewBridgeProof = await page.evaluate(() => {
    const bridge = document.querySelector('[data-testid="fp-expedition-survey-bridge"]');
    const button = bridge?.querySelector('[data-testid*="btn-review-site-plan"]');
    const visibleText = bridge?.innerText || '';
    return {
      commandId: bridge?.getAttribute('data-command-id') || '',
      mapNativeVerb: bridge?.getAttribute('data-map-native-verb') || '',
      actionName: bridge?.getAttribute('data-action-name') || '',
      buttonText: button?.textContent || '',
      buttonMapNativeVerb: button?.getAttribute('data-map-native-verb') || '',
      visibleText,
      paperworkHeavyPrimaryCopy: /Draft Site Plan|Review Site Plan|Settlement Charter review available/.test(visibleText),
    };
  });

  const reviewResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/review-site-plan')
    && response.request().method() === 'POST'
  ));
  await reviewButton.click();
  const reviewBody = await (await reviewResponsePromise).json();
  expect(reviewBody.ok, JSON.stringify(reviewBody.error || reviewBody)).toBe(true);
  expect(reviewBody.sitePlan.reviewStatus).toBe('reviewed');

  live = await stateSnapshot(page);
  const surveyorUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'surveyor' && unit.sourcePlanId === planId);
  expect(surveyorUnit?.unitId).toBeTruthy();
  await selectUnitToken(page, surveyorUnit.unitId);
  const prepareRing = await waitForCommandTarget(page, `(target) => target.commandId === 'prepare_settler_convoy' && target.cellId === '${firstScoutTarget}'`);
  expect(prepareRing).toMatchObject({
    previewOnly: true,
    visualOnly: true,
    readOnly: true,
    routeAuthority: false,
    actionAuthority: false,
    executableActions: 0,
  });
  const prepareResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/prepare-settler-convoy')
    && response.request().method() === 'POST'
  ));
  await page.getByTestId(`fp-btn-prepare-settler-convoy-unit-command-${safeTestId(planId)}`).click();
  const prepareBody = await (await prepareResponsePromise).json();
  expect(prepareBody.ok, JSON.stringify(prepareBody.error || prepareBody)).toBe(true);
  const claimId = prepareBody.settlementClaim.claimId;

  await advanceConvoyArrival({ page, plotId, claimId });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  live = await stateSnapshot(page);
  const convoyUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'settler_convoy' && unit.sourceClaimId === claimId);
  await selectUnitToken(page, convoyUnit.unitId);
  const foundResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/founders-plot/found-settlement')
    && response.request().method() === 'POST'
  ));
  await page.getByTestId(`fp-btn-found-settlement-unit-command-${safeTestId(claimId)}`).click();
  const foundBody = await (await foundResponsePromise).json();
  expect(foundBody.ok, JSON.stringify(foundBody.error || foundBody)).toBe(true);

  live = await stateSnapshot(page);
  const outpostUnit = live.state.expeditionMap.units.items.find((unit) => unit.unitType === 'outpost_crew' && unit.sourceClaimId === claimId);
  expect(outpostUnit?.unitId).toBeTruthy();
  await selectUnitToken(page, outpostUnit.unitId);
  await expect(page.getByTestId('fp-expedition-outpost-next-scout-cue')).toHaveText(/Next Scout/);
  await expect(page.getByTestId('fp-expedition-outpost-next-scout-cue')).toHaveAttribute('data-command-id', 'scout_sector');
  await expect(page.getByTestId('fp-expedition-outpost-next-scout-cue')).toHaveAttribute('data-visual-only', 'true');
  await expect(page.getByTestId('fp-expedition-outpost-next-scout-cue')).toHaveAttribute('data-actions', '0');

  const desktopScreenshot = 'reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-desktop-2026-06-03.png';
  const mobileScreenshot = 'reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-mobile-2026-06-03.png';
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: desktopScreenshot });

  const rendererBeforeNextScout = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  const outpostBeacon = rendererBeforeNextScout.outpostNextFrontierBeacons[0];
  expect(outpostBeacon).toMatchObject({
    commandId: 'scout_sector',
    cueLabel: 'Next Scout',
    visualOnly: true,
    readOnly: true,
    routeAuthority: false,
    actionAuthority: false,
    executableActions: 0,
  });
  expect(rendererBeforeNextScout.commandTargets.every((target) => (
    target.previewOnly === true
    && target.visualOnly === true
    && target.readOnly === true
    && target.executableActions === 0
  ))).toBe(true);

  const domProof = await page.evaluate(() => {
    const outpostCue = document.querySelector('[data-testid="fp-expedition-outpost-next-scout-cue"]');
    const objectiveStrip = document.querySelector('[data-testid="fp-expedition-objective-strip"]');
    return {
      outpostCue: {
        present: !!outpostCue,
        text: outpostCue?.innerText || '',
        commandId: outpostCue?.getAttribute('data-command-id') || '',
        cellId: outpostCue?.getAttribute('data-cell-id') || '',
        visualOnly: outpostCue?.getAttribute('data-visual-only') || '',
        actions: Number(outpostCue?.getAttribute('data-actions') || 0),
      },
      objectiveStrip: {
        readOnly: objectiveStrip?.getAttribute('data-read-only') || '',
        actions: Number(objectiveStrip?.getAttribute('data-actions') || 0),
      },
    };
  });
  expect(domProof.outpostCue.text).toContain('Next Scout');
  expect(domProof.outpostCue.actions).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: mobileScreenshot });
  const mobileFit = await page.evaluate(() => ({
    viewport: { width: window.innerWidth, height: window.innerHeight },
    documentScrollWidth: document.documentElement.scrollWidth,
    clipped: Array.from(document.querySelectorAll('[data-testid="fp-expedition-map-panel"], [data-testid="fp-expedition-objective-strip"], [data-testid="fp-expedition-unit-roster"], [data-testid="fp-expedition-unit-command-bar"], [data-testid="fp-expedition-outpost-status"], [data-testid="fp-expedition-outpost-next-scout-cue"]'))
      .filter((node) => node.scrollWidth > node.clientWidth + 1)
      .map((node) => node.getAttribute('data-testid') || node.tagName),
  }));
  expect(mobileFit.clipped).toEqual([]);

  const proof = {
    ok: true,
    generatedAt: new Date().toISOString(),
    title: 'HQ16Z Map-native packet Plan/Review plus outpost Scout verbs',
    source: 'FP-E2E-022Z live guarded endpoint replay. Only convoy arrival used the existing test-only time advance after Prepare Convoy.',
    branch: 'neo/progression-atlas-editor-next-2026-05-29',
    screenshots: [desktopScreenshot, mobileScreenshot],
    requests: {
      firstScout: {
        actionName: firstScoutBody.proof.actionName,
        revealedCellId: firstScoutBody.revealedCellId,
        packetId: firstScoutBody.eventPacket.packetId,
        boundaryFlags: firstScoutBody.proof.boundaryFlags,
      },
      packetPlan: {
        actionName: packetPlanBody.proof.actionName,
        packetId: packetPlanBody.packetId,
        planId,
        cellId: packetPlanBody.cellId,
        boundaryFlags: packetPlanBody.proof.boundaryFlags,
      },
      review: {
        endpointUsed: 'et.plot.review_site_plan',
        planId,
        reviewStatus: reviewBody.sitePlan.reviewStatus,
        nextCommandId: reviewBody.state.expeditionMap.surveyBridge.activeCandidate.commandState.commandId,
      },
      prepareConvoy: {
        endpointUsed: 'et.plot.prepare_settler_convoy',
        claimId,
        status: prepareBody.settlementClaim.status,
      },
      foundOutpost: {
        endpointUsed: 'et.plot.found_settlement',
        claimId,
        foundedPlotId: foundBody.foundedPlot.plotId,
      },
    },
    domProof: {
      planBridge: planBridgeProof,
      reviewBridge: reviewBridgeProof,
      outpost: domProof,
    },
    rendererProof: {
      commandTargets: rendererBeforeNextScout.commandTargets,
      outpostNextFrontierBeacons: rendererBeforeNextScout.outpostNextFrontierBeacons,
      visualLayers: rendererBeforeNextScout.visualLayers,
    },
    mobileFit,
    guardrails: {
      packetPlanMapNativeVerb: planBridgeProof.mapNativeVerb === 'Plan'
        && planBridgeProof.buttonText === 'Plan'
        && planBridgeProof.buttonMapNativeVerb === 'Plan',
      packetPlanPrimaryCopyNotSurvey: !/\bSurvey\b/.test(planBridgeProof.visibleText),
      packetReviewMapNativeVerb: reviewBridgeProof.mapNativeVerb === 'Review'
        && reviewBridgeProof.buttonText === 'Review'
        && reviewBridgeProof.buttonMapNativeVerb === 'Review',
      packetReviewPrimaryCopyNotPaperworkHeavy: reviewBridgeProof.paperworkHeavyPrimaryCopy === false,
      outpostScoutCueShort: domProof.outpostCue.text.includes('Next Scout') && domProof.outpostCue.commandId === 'scout_sector',
      outpostCueVisualOnly: domProof.outpostCue.visualOnly === 'true' && domProof.outpostCue.actions === 0,
      outpostBeaconVisualOnly: outpostBeacon.visualOnly === true && outpostBeacon.readOnly === true && outpostBeacon.executableActions === 0,
      commandTargetRingsPreviewOnly: rendererBeforeNextScout.commandTargets.every((target) => target.previewOnly === true && target.visualOnly === true && target.readOnly === true),
      scoutSectorOnlyFogRevealPath: firstScoutBody.proof.boundaryFlags.revealsExactlyOneSector === true,
      existingGuardedEndpointsOnly: [
        firstScoutBody.proof.actionName,
        packetPlanBody.proof.actionName,
        'et.plot.review_site_plan',
        'et.plot.prepare_settler_convoy',
        'et.plot.found_settlement',
      ].every((name) => [
        'et.plot.scout_sector',
        'et.plot.draft_site_plan_from_packet',
        'et.plot.review_site_plan',
        'et.plot.prepare_settler_convoy',
        'et.plot.found_settlement',
      ].includes(name)),
      routeAuthority: false,
      tradeRouteCreation: false,
      economyMutation: false,
      resourceHarvesting: false,
      rewardCreation: false,
      combat: false,
      backgroundScheduling: false,
      hiddenTruthLeakage: false,
      atlasExecution: false,
      generatedUniverseRuntimeExpansion: false,
      publicShareDeployMergePushExternalMessage: false,
      mobileHorizontalOverflow: mobileFit.clipped.length,
    },
  };
  fs.writeFileSync('reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-proof-2026-06-03.json', JSON.stringify(proof, null, 2));
});

const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  bootstrapToHq2,
  getPlotState,
  openFoundersPlotFrame,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const REQUIRED_COVERAGE_DOMAINS = [
  'plot-resources',
  'hq-progress',
  'pads-buildings-jobs',
  'current-goal',
  'contracts',
  'town-signals-landmarks',
  'rewards',
  'journal-recap',
  'world-props',
  'approvals',
  'foreman-runtime',
  'policy-permissions',
  'scheduler',
  'standing-order',
  'unlocks-blocked',
  'selected-object'
];

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function getThreeInfo(frame) {
  return frame.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
}

async function getSceneCoverage(frame) {
  return frame.evaluate(() => window.__foundersPlotTest.getScene()?.stateCoverage || null);
}

async function getReadableSurfaceMetrics(frame) {
  return frame.evaluate(() => {
    const measure = (selector) => {
      const node = document.querySelector(selector);
      if (!(node instanceof HTMLElement)) return null;
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        fontSize: Number.parseFloat(style.fontSize || '0') || 0,
        lineHeight: Number.parseFloat(style.lineHeight || '0') || 0,
        overflowX: style.overflowX,
        visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      };
    };
    return {
      htmlFullscreen: document.documentElement.classList.contains('founders-plot-fullscreen'),
      bodyFullscreen: document.body.classList.contains('founders-plot-fullscreen-body'),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      documentSize: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight
      },
      root: measure('[data-testid="founders-game-shell"]'),
      stage: measure('[data-testid="founders-plot-stage"]'),
      canvas: measure('[data-testid="founders-three-canvas"]'),
      questTitle: measure('#questTitle'),
      cta: measure('[data-testid="founders-quest-cta"]'),
      inventoryValue: measure('[data-testid="inventory-wood"] strong'),
      trayLabel: measure('.foundersTrayLabel'),
      surface: window.__foundersPlotTest.collectSurfaceMetrics(),
      info: window.__foundersPlotTest.getThreeSceneInfo()
    };
  });
}

async function clickThreeTarget(page, frame, targetId) {
  const target = await frame.waitForFunction((id) => {
    const info = window.__foundersPlotTest.getThreeSceneInfo();
    const targets = Array.isArray(info?.pickTargets) ? info.pickTargets : [];
    if (String(id).startsWith('GRID:')) {
      return targets.find((entry) => entry.gridCellId === id) || null;
    }
    const objectTargets = targets.filter((entry) => entry.objectId === id);
    return objectTargets.find((entry) => entry.worldObjectId !== 'grid_cell') || objectTargets[0] || null;
  }, targetId, { timeout: 5000 });
  const value = await target.jsonValue();
  if (!value?.canvas) throw new Error(`NO_THREE_TARGET:${targetId}`);
  const iframeBox = await page.locator('#districtModalBody iframe.districtFrame').boundingBox();
  if (!iframeBox) throw new Error('NO_FOUNDERS_IFRAME_BOX');
  const canvasBox = await frame.getByTestId('founders-three-canvas').evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
  const x = Math.max(1, Math.min(Number(value.canvas.x || 0), canvasBox.width - 1));
  const y = Math.max(1, Math.min(Number(value.canvas.y || 0), canvasBox.height - 1));
  await page.mouse.click(iframeBox.x + canvasBox.left + x, iframeBox.y + canvasBox.top + y);
}

async function readCanvasPixelStats(frame) {
  return frame.getByTestId('founders-three-canvas').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { ok: false, reason: 'NO_WEBGL_CONTEXT' };
    const points = [
      [0.20, 0.20],
      [0.50, 0.32],
      [0.50, 0.50],
      [0.72, 0.58],
      [0.36, 0.78]
    ];
    const samples = [];
    for (const [px, py] of points) {
      const pixel = new Uint8Array(4);
      const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(canvas.width * px)));
      const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(canvas.height * py)));
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      samples.push(Array.from(pixel));
    }
    const unique = new Set(samples.map((sample) => sample.join(',')));
    const visibleSamples = samples.filter((sample) => sample[3] > 0 && (sample[0] + sample[1] + sample[2]) > 0);
    return {
      ok: true,
      width: canvas.width,
      height: canvas.height,
      samples,
      uniqueColors: unique.size,
      visibleSamples: visibleSamples.length
    };
  });
}

test('Founders Plot opens as a fullscreen readable Three.js game surface', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const frame = await openFoundersPlotFrame(page);

  await expect(page.locator('#districtModalBackdrop')).toHaveClass(/is-fullscreen-frame/);
  await expect(page.locator('#districtModalBackdrop .districtModal')).toHaveClass(/is-fullscreen-frame/);
  await expect(page.locator('#districtModalBody iframe.districtFrame')).toHaveAttribute('data-presentation', 'fullscreen');

  const frameBox = await page.locator('#districtModalBody iframe.districtFrame').boundingBox();
  expect(frameBox.width).toBeGreaterThan(1360);
  expect(frameBox.height).toBeGreaterThan(840);

  const metrics = await getReadableSurfaceMetrics(frame);
  expect(metrics.htmlFullscreen).toBe(true);
  expect(metrics.bodyFullscreen).toBe(true);
  expect(metrics.documentSize.scrollWidth).toBeLessThanOrEqual(metrics.documentSize.clientWidth + 1);
  expect(metrics.root.height).toBeGreaterThan(860);
  expect(metrics.stage.width).toBeGreaterThan(1260);
  expect(metrics.stage.height).toBeGreaterThan(540);
  expect(metrics.canvas.width).toBeGreaterThan(1260);
  expect(metrics.canvas.height).toBeGreaterThan(540);
  expect(metrics.questTitle.fontSize).toBeGreaterThanOrEqual(24);
  expect(metrics.cta.fontSize).toBeGreaterThanOrEqual(15);
  expect(metrics.inventoryValue.fontSize).toBeGreaterThanOrEqual(14);
  expect(metrics.trayLabel.fontSize).toBeGreaterThanOrEqual(13);
  expect(metrics.surface.horizontalOverflow).toBe(false);
  expect(metrics.surface.stageVisibleAreaRatio).toBeGreaterThan(0.55);
  expect(metrics.info.readability.fullscreen).toBe(true);
  expect(metrics.info.readability.hudCollapsed).toBe(true);
  expect(metrics.info.coverage.hud.every((entry) => entry.collapsed === true && entry.canvas === null)).toBe(true);
});

test('Founders Plot keeps fullscreen text readable on mobile viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const frame = await openFoundersPlotFrame(page);

  const frameBox = await page.locator('#districtModalBody iframe.districtFrame').boundingBox();
  expect(frameBox.width).toBeGreaterThan(380);
  expect(frameBox.height).toBeGreaterThan(820);

  const metrics = await getReadableSurfaceMetrics(frame);
  expect(metrics.htmlFullscreen).toBe(true);
  expect(metrics.documentSize.scrollWidth).toBeLessThanOrEqual(metrics.documentSize.clientWidth + 1);
  expect(metrics.stage.height).toBeGreaterThan(430);
  expect(metrics.canvas.height).toBeGreaterThan(430);
  expect(metrics.questTitle.fontSize).toBeGreaterThanOrEqual(18);
  expect(metrics.cta.fontSize).toBeGreaterThanOrEqual(14);
  expect(metrics.inventoryValue.fontSize).toBeGreaterThanOrEqual(13);
  expect(metrics.trayLabel.fontSize).toBeGreaterThanOrEqual(13);
  expect(metrics.surface.horizontalOverflow).toBe(false);
  expect(metrics.surface.stageVisibleAreaRatio).toBeGreaterThan(0.48);
  expect(metrics.info.readability.fullscreen).toBe(true);
  expect(metrics.info.readability.textProfile.anchorScale).toBeGreaterThanOrEqual(1.08);
});

test('Three.js Founders Plot scene renders in the modal with inspectable canvas pixels and object identity', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.locator('#districtModalTitle')).toHaveText('Founders Plot');
  expect(new URL(page.url()).pathname).toBe('/app');

  await expect(frame.getByTestId('founders-three-scene')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('founders-three-canvas')).toBeVisible({ timeout: 5000 });

  await frame.waitForFunction(() => {
    const info = window.__foundersPlotTest.getThreeSceneInfo();
    return info?.renderer === 'three.js' && info.objectCount >= 8 && info.canvasWidth > 0 && info.canvasHeight > 0;
  }, null, { timeout: 5000 });

  const info = await getThreeInfo(frame);
  expect(info.renderer).toBe('three.js');
  expect(info.grid.version).toBe('founders-plot-grid-v1');
  expect(info.grid.cols).toBe(8);
  expect(info.grid.rows).toBe(5);
  expect(info.grid.cellCount).toBe(40);
  expect(info.gridCellIds).toContain('GRID:0,0');
  expect(info.objectIds).toContain('HQ');
  expect(info.objectIds).toContain('CLOVER');
  expect(info.objectIds).toContain('PAD:0,0');
  expect(info.objectIds).toContain('PROP:SUPPLY_CRATES');
  expect(info.pickTargets.some((entry) => entry.objectId === 'PROP:SUPPLY_CRATES' && entry.worldObjectId === 'supply_crates')).toBe(true);
  expect(info.pickTargets.some((entry) => entry.objectId === 'PAD:0,0' && entry.validPlacement === true)).toBe(true);
  expect(info.parity.labels.some((entry) => entry.objectId === 'PAD:0,0')).toBe(true);
  expect(info.parity.badges.some((entry) => entry.objectId === 'PAD:0,0' && entry.type === 'build')).toBe(true);
  expect(info.parity.cloverBubbles.some((entry) => entry.objectId === 'CLOVER')).toBe(true);
  expect(info.parity.targetLinks.some((entry) => entry.objectId === 'CLOVER' && entry.targetObjectId === 'PAD:0,0')).toBe(true);
  expect(info.coverage.domainIds).toEqual(expect.arrayContaining(REQUIRED_COVERAGE_DOMAINS));
  expect(info.coverage.hud.map((entry) => entry.id)).toEqual(expect.arrayContaining([
    'HUD:resources',
    'HUD:hq-progress',
    'HUD:objective'
  ]));
  expect(info.coverage.anchors.map((entry) => entry.id)).toEqual(expect.arrayContaining([
    'STATE:contracts',
    'STATE:rewards',
    'STATE:signals',
    'STATE:journal',
    'STATE:world-props',
    'STATE:approvals',
    'STATE:foreman',
    'STATE:policy',
    'STATE:scheduler',
    'STATE:standing-order',
    'STATE:unlocks'
  ]));
  expect(info.pickTargets.some((entry) => entry.objectId === 'STATE:contracts' && entry.drawerKey === 'contracts')).toBe(true);
  expect(info.coverage.anchors.some((entry) => entry.id === 'STATE:world-props' && entry.canvas)).toBe(true);
  const sceneCoverage = await getSceneCoverage(frame);
  expect(sceneCoverage.anchors.find((entry) => entry.id === 'STATE:world-props')?.value).toContain('Supply Crates');

  const domLayer = await frame.evaluate(() => {
    const layer = document.querySelector('[data-three-semantic-layer="true"]');
    const spriteOpacities = Array.from(document.querySelectorAll('.at-fp-stage--threejs .at-fp-objectSprite'))
      .map((node) => Number(window.getComputedStyle(node).opacity || '0'));
    const overlayOpacities = Array.from(document.querySelectorAll('.at-fp-stage--threejs .at-fp-objectLabel, .at-fp-stage--threejs .at-fp-objectBadges, .at-fp-stage--threejs .at-fp-timer-ring, .at-fp-stage--threejs .at-fp-cloverBubble'))
      .map((node) => Number(window.getComputedStyle(node).opacity || '0'));
    return {
      semanticLayer: layer?.getAttribute('data-layer-role') || '',
      maxSpriteOpacity: Math.max(...spriteOpacities, 0),
      maxOverlayOpacity: Math.max(...overlayOpacities, 0)
    };
  });
  expect(domLayer.semanticLayer).toBe('semantic-object-hooks');
  expect(domLayer.maxSpriteOpacity).toBe(0);
  expect(domLayer.maxOverlayOpacity).toBe(0);

  const pixels = await readCanvasPixelStats(frame);
  expect(pixels.ok).toBe(true);
  expect(pixels.width).toBeGreaterThan(100);
  expect(pixels.height).toBeGreaterThan(100);
  expect(pixels.visibleSamples).toBeGreaterThan(0);
  expect(pixels.uniqueColors).toBeGreaterThan(1);
});

test('Three.js coverage represents contracts, rewards, approvals, policy, scheduler, standing order, and selected detail', async ({ page }) => {
  test.setTimeout(45_000);
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);

  const approval = await runPlotTool(frame, 'et.plot.request_user_approval', {
    tool: 'et.plot.upgrade_building',
    title: 'Approve the next HQ upgrade',
    body: 'Three.js coverage should show this pending approval.',
    payload: { buildingId: 'hq' },
    idempotencyKey: 'threejs-full-state-approval'
  });
  expect(approval?.ok).toBe(true);

  await frame.waitForFunction(() => {
    const coverage = window.__foundersPlotTest.getScene()?.stateCoverage;
    const anchors = Array.isArray(coverage?.anchors) ? coverage.anchors : [];
    return anchors.some((entry) => entry.id === 'STATE:contracts' && Number(entry.count || 0) > 0)
      && anchors.some((entry) => entry.id === 'STATE:rewards' && Number(entry.count || 0) > 0)
      && anchors.some((entry) => entry.id === 'STATE:approvals' && Number(entry.count || 0) > 0)
      && anchors.some((entry) => entry.id === 'STATE:policy' && /permissions/i.test(String(entry.value || '')))
      && anchors.some((entry) => entry.id === 'STATE:scheduler' && /collect ready/i.test(String(entry.value || '')))
      && anchors.some((entry) => entry.id === 'STATE:standing-order' && /Careful|Bold/i.test(String(entry.value || '')));
  }, null, { timeout: 5000 });

  const coverage = await getSceneCoverage(frame);
  expect(coverage.version).toBe('founders-plot-state-coverage-v1');
  expect(coverage.domains.map((entry) => entry.id)).toEqual(expect.arrayContaining(REQUIRED_COVERAGE_DOMAINS));
  expect(coverage.hud.find((entry) => entry.id === 'HUD:resources')?.items?.some((entry) => entry.key === 'wood' && entry.cap > 0)).toBe(true);
  expect(coverage.hud.find((entry) => entry.id === 'HUD:hq-progress')?.label).toBe('Headquarters');
  expect(coverage.anchors.find((entry) => entry.id === 'STATE:approvals')?.value).toContain('Approve the next HQ upgrade');
  expect(coverage.anchors.find((entry) => entry.id === 'STATE:contracts')?.detailRows?.length).toBeGreaterThan(0);
  expect(coverage.retainedDomControls).toEqual(expect.arrayContaining(['drawer bodies', 'selection action buttons']));

  const info = await getThreeInfo(frame);
  expect(info.coverage.domainIds).toEqual(expect.arrayContaining(REQUIRED_COVERAGE_DOMAINS));
  expect(info.coverage.anchors.some((entry) => entry.id === 'STATE:approvals' && entry.count === 1 && entry.canvas)).toBe(true);
  expect(info.pickTargets.some((entry) => entry.objectId === 'STATE:rewards' && entry.drawerKey === 'rewards' && entry.worldObjectId === 'state_anchor')).toBe(true);

  await clickThreeTarget(page, frame, 'STATE:contracts');
  await expect(frame.getByTestId('founders-contract-board')).toBeVisible({ timeout: 5000 });
  await expect(frame.getByTestId('founders-contract-board')).toContainText(/offers|Active|Town requests|request/i);
  await frame.evaluate(() => window.__foundersPlotTest.closeDrawer());

  await clickThreeTarget(page, frame, 'LUMBER_CAMP');
  await frame.waitForFunction(() => {
    const detail = window.__foundersPlotTest.getScene()?.stateCoverage?.selectedDetail;
    return detail?.objectId === 'LUMBER_CAMP'
      && detail?.mode === 'selected'
      && Array.isArray(detail.rows)
      && detail.rows.some((row) => String(row.label || '') === 'Priority');
  }, null, { timeout: 5000 });
  const selectedCoverage = await getSceneCoverage(frame);
  expect(selectedCoverage.selectedDetail.objectId).toBe('LUMBER_CAMP');
  expect(selectedCoverage.selectedDetail.rows.map((row) => row.label)).toEqual(expect.arrayContaining(['Level', 'State', 'Priority']));

  const selectedInfo = await getThreeInfo(frame);
  expect(selectedInfo.coverage.selectedDetail.objectId).toBe('LUMBER_CAMP');
  expect(selectedInfo.coverage.selectedDetail.text).toMatch(/Selected: Lumber Camp/);
});

test('Three.js raycast selection drives the first playable build, queue, and collect loop through existing game actions', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  await clickThreeTarget(page, frame, 'PAD:0,0');
  await frame.waitForFunction(() => {
    const lastPick = window.__foundersPlotTest.getThreeSceneInfo()?.lastPick;
    return lastPick?.objectId === 'PAD:0,0' && lastPick?.source === 'three-raycast';
  }, null, { timeout: 5000 });
  await expect.poll(async () => {
    const info = await getThreeInfo(frame);
    return info.parity.highlights.some((entry) => entry.objectId === 'PAD:0,0' && ['selected', 'goal'].includes(entry.role));
  }).toBe(true);

  await expect(frame.getByTestId('place-lumber_camp')).toBeVisible({ timeout: 5000 });
  await frame.getByTestId('place-lumber_camp').click();

  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getState()?.state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP');
  }, null, { timeout: 5000 });

  await frame.waitForFunction(() => {
    return window.__foundersPlotTest.getThreeSceneInfo()?.objectIds?.includes('LUMBER_CAMP');
  }, null, { timeout: 5000 });
  await expect.poll(async () => {
    const info = await getThreeInfo(frame);
    return info.pickTargets.some((entry) => entry.objectId === 'LUMBER_CAMP' && entry.occupied === true);
  }).toBe(true);

  const built = await advancePlot(frame, 31_000);
  expect(built.ok).toBe(true);
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return window.__foundersPlotTest.getThreeSceneInfo()?.objectIds?.includes('LUMBER_CAMP')
      && state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP');
  }, null, { timeout: 5000 });
  await clickThreeTarget(page, frame, 'LUMBER_CAMP');
  await frame.waitForFunction(() => {
    const lastPick = window.__foundersPlotTest.getThreeSceneInfo()?.lastPick;
    return lastPick?.objectId === 'LUMBER_CAMP' && lastPick?.source === 'three-raycast';
  }, null, { timeout: 5000 });

  await expect(frame.getByTestId('selection-queue')).toBeVisible({ timeout: 5000 });
  await frame.getByTestId('selection-queue').click();

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const lumber = Array.isArray(state?.buildings)
      ? state.buildings.find((building) => building?.type === 'LUMBER_CAMP')
      : null;
    return lumber?.runningJob?.status === 'RUNNING';
  }, null, { timeout: 5000 });
  await expect.poll(async () => {
    const info = await getThreeInfo(frame);
    return info.parity.timers.some((entry) => entry.objectId === 'LUMBER_CAMP')
      && info.parity.badges.some((entry) => entry.objectId === 'LUMBER_CAMP' && entry.type === 'timer');
  }).toBe(true);

  const completed = await advancePlot(frame, 61_000);
  expect(completed.ok).toBe(true);
  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return window.__foundersPlotTest.getThreeSceneInfo()?.objectIds?.includes('LUMBER_CAMP')
      && state?.buildings?.some((building) => building?.type === 'LUMBER_CAMP' && building?.state === 'OUTPUT_READY');
  }, null, { timeout: 5000 });
  await expect.poll(async () => {
    const info = await getThreeInfo(frame);
    return info.parity.badges.some((entry) => entry.objectId === 'LUMBER_CAMP' && entry.type === 'ready');
  }).toBe(true);
  await clickThreeTarget(page, frame, 'LUMBER_CAMP');
  await expect(frame.getByTestId('selection-collect')).toBeVisible({ timeout: 5000 });
  await frame.getByTestId('selection-collect').click();

  await frame.waitForFunction(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    return state?.plot?.inventory?.wood === 6 && state?.plot?.townXp === 25;
  }, null, { timeout: 5000 });

  const state = await getPlotState(frame);
  expect(state.plot.inventory.wood).toBe(6);
  expect(state.plot.townXp).toBe(25);
});

test('Clover is represented in the Three.js scene without exposing worker or tool jargon', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  const info = await getThreeInfo(frame);
  expect(info.objectIds).toContain('CLOVER');

  const clover = frame.getByTestId('founders-clover-avatar');
  await expect(clover).toBeVisible({ timeout: 5000 });
  await expect(clover).toHaveAttribute('aria-label', /Clover/i);
  await expect(clover).toHaveAttribute('data-asset-id', 'clover_idle_v1_4_4');
  const label = await clover.getAttribute('aria-label');
  expect(String(label || '')).not.toMatch(/\b(worker|tool|provider|runtime|oauth|debug|schema)\b/i);

  await clickThreeTarget(page, frame, 'CLOVER');
  await frame.waitForFunction(() => {
    const lastPick = window.__foundersPlotTest.getThreeSceneInfo()?.lastPick;
    return lastPick?.objectId === 'CLOVER' && lastPick?.source === 'three-raycast';
  }, null, { timeout: 5000 });
  await expect(frame.getByTestId('founders-foreman-panel')).toBeVisible({ timeout: 5000 });

  const recommendation = frame.locator('#foremanRecommendation');
  await expect(recommendation).toBeVisible({ timeout: 5000 });
  const recommendationText = await recommendation.innerText();
  expect(recommendationText).toMatch(/\b(Clover|Brain|Foreman|manual|guide|ready|connected)\b/i);
  expect(recommendationText).not.toMatch(/\b(worker|tool|provider|runtime|oauth|debug|schema)\b/i);
});

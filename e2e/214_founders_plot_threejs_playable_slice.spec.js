const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function eventCount(request) {
  const response = await request.get('/api/founders-plot/state');
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return Number(body.state?.audit?.eventCount || 0);
}

async function plotIds(page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/founders-plot/state');
    const body = await response.json();
    return {
      pairId: body.state.plot.pairId,
      plotId: body.state.plot.plotId
    };
  });
}

async function advancePlot(page, advanceMs) {
  const ids = await plotIds(page);
  await page.evaluate(async ({ pairId, plotId, ms }) => {
    await fetch('/__test__/founders-plot/advance', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-reset': 'test-reset' },
      body: JSON.stringify({ pairId, plotId, advanceMs: ms })
    });
  }, { ...ids, ms: advanceMs });
}

async function waitForRole(page, role) {
  await page.waitForFunction((expectedRole) => {
    const actors = window.__foundersPlotTest?.getVisualActors?.() || [];
    return actors.some((actor) => actor.canonicalRoleId === expectedRole);
  }, role);
}

async function clickActorOnCanvas(page, role) {
  const target = await page.waitForFunction((expectedRole) => {
    const info = window.__foundersPlotTest?.getThreeSceneInfo?.() || {};
    return (info.pickTargets || []).find((entry) => entry.canonicalRoleId === expectedRole && entry.canvas) || null;
  }, role);
  const value = await target.jsonValue();
  const box = await page.getByTestId('founders-three-canvas').boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.click(
    box.x + Math.max(1, Math.min(value.canvas.x, box.width - 1)),
    box.y + Math.max(1, Math.min(value.canvas.y, box.height - 1))
  );
}

async function canvasStats(page) {
  return page.getByTestId('founders-three-canvas').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { ok: false };
    const pixel = new Uint8Array(4);
    const samples = [];
    for (const [x, y] of [[0.25, 0.30], [0.50, 0.50], [0.72, 0.70]]) {
      gl.readPixels(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      samples.push(Array.from(pixel));
    }
    return {
      ok: true,
      width: canvas.width,
      height: canvas.height,
      unique: new Set(samples.map((sample) => sample.join(','))).size,
      visible: samples.filter((sample) => sample[3] > 0 && sample[0] + sample[1] + sample[2] > 0).length
    };
  });
}

test('Three.js Founders Plot renders Clover plus builder, worker, and hauler from server visualActors', async ({ page, request }, testInfo) => {
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  await expect(page.getByTestId('founders-three-scene')).toBeVisible();
  await expect(page.getByTestId('founders-three-canvas')).toBeVisible();

  await waitForRole(page, 'clover');
  await expect(page.getByTestId('fp-visual-actor-clover')).toHaveAttribute('data-visual-only', 'true');
  await waitForRole(page, 'messenger');
  await expect(page.getByTestId('fp-visual-actor-messenger')).toHaveAttribute('data-action-cue', 'attention_marker');

  const pixels = await canvasStats(page);
  expect(pixels.ok).toBe(true);
  expect(pixels.width).toBeGreaterThan(100);
  expect(pixels.height).toBeGreaterThan(100);
  expect(pixels.visible).toBeGreaterThan(0);
  expect(pixels.unique).toBeGreaterThan(1);

  await page.getByTestId('fp-tile-0-1').click();
  await page.getByTestId('fp-palette-LUMBER_CAMP').click();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Building');
  await waitForRole(page, 'builder');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-source-domain', 'job');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-action-kind', 'CONSTRUCT');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-action-cue', 'construction_progress');
  await expect(page.getByTestId('fp-visual-actor-builder')).toHaveAttribute('data-accessory', 'hammer');
  const builderInfo = await page.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(builderInfo.actors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'builder',
      actionAnimation: expect.objectContaining({ mode: 'work_swing', hasWalkOffset: true })
    })
  ]));
  expect(builderInfo.actionCues).toEqual(expect.arrayContaining([
    expect.objectContaining({ canonicalRoleId: 'builder', cueType: 'construction_progress', accessory: 'hammer' })
  ]));

  const beforePickEvents = await eventCount(request);
  await clickActorOnCanvas(page, 'builder');
  await expect(page.locator('#fp-bld-title')).toContainText('Lumber Camp');
  expect(await eventCount(request)).toBe(beforePickEvents);

  await advancePlot(page, 2 * 60 * 1000);
  await page.reload();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Idle');
  await page.getByTestId('fp-tile-0-1').click();
  await page.getByTestId('fp-btn-queue').click();
  await waitForRole(page, 'worker');
  await expect(page.getByTestId('fp-visual-actor-worker')).toHaveAttribute('data-source-domain', 'job');
  await expect(page.getByTestId('fp-visual-actor-worker')).toHaveAttribute('data-action-kind', 'PRODUCE');
  await expect(page.getByTestId('fp-visual-actor-worker')).toHaveAttribute('data-action-cue', 'production_work');
  await expect(page.getByTestId('fp-visual-actor-worker')).toHaveAttribute('data-accessory', 'tools');
  const workerInfo = await page.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(workerInfo.actors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'worker',
      actionAnimation: expect.objectContaining({ mode: 'busy_work' })
    })
  ]));
  expect(workerInfo.actionCues).toEqual(expect.arrayContaining([
    expect.objectContaining({ canonicalRoleId: 'worker', cueType: 'production_work', accessory: 'tools' })
  ]));

  await advancePlot(page, 2 * 60 * 1000);
  await page.reload();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Ready to collect');
  await waitForRole(page, 'hauler');
  await expect(page.getByTestId('fp-visual-actor-hauler')).toHaveAttribute('data-source-domain', 'building');
  await expect(page.getByTestId('fp-visual-actor-hauler')).toHaveAttribute('data-action-kind', 'OUTPUT_READY');
  await expect(page.getByTestId('fp-visual-actor-hauler')).toHaveAttribute('data-action-cue', 'carry_bundle');
  await expect(page.getByTestId('fp-visual-actor-hauler')).toHaveAttribute('data-accessory', 'bundle');

  const beforeMessengerPickEvents = await eventCount(request);
  await clickActorOnCanvas(page, 'messenger');
  await expect(page.getByTestId('fp-quest-step')).toBeVisible();
  expect(await eventCount(request)).toBe(beforeMessengerPickEvents);

  const info = await page.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(info.renderer).toBe('three.js');
  expect(info.roles).toEqual(expect.arrayContaining(['clover', 'hauler']));
  expect(info.actors.every((actor) => actor.visualOnly === true)).toBe(true);
  expect(info.actionCues).toEqual(expect.arrayContaining([
    expect.objectContaining({ canonicalRoleId: 'hauler', cueType: 'carry_bundle', accessory: 'bundle' }),
    expect.objectContaining({ canonicalRoleId: 'messenger', cueType: 'attention_marker' })
  ]));
  expect(info.actors).toEqual(expect.arrayContaining([
    expect.objectContaining({
      canonicalRoleId: 'hauler',
      actionAnimation: expect.objectContaining({ mode: 'carry_wobble', stepStyle: 'waddle' })
    }),
    expect.objectContaining({
      canonicalRoleId: 'messenger',
      actionAnimation: expect.objectContaining({ mode: 'attention_wave', stepStyle: 'skip' })
    })
  ]));

  const screenshotPath = testInfo.outputPath('founders-plot-animated-inhabitant-characters.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach('founders-plot-animated-inhabitant-characters', {
    path: screenshotPath,
    contentType: 'image/png'
  });
});

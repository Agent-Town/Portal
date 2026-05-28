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

test('Three.js Founders Plot renders Clover plus builder, worker, and hauler from server visualActors', async ({ page, request }) => {
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  await expect(page.getByTestId('founders-three-scene')).toBeVisible();
  await expect(page.getByTestId('founders-three-canvas')).toBeVisible();

  await waitForRole(page, 'clover');
  await expect(page.getByTestId('fp-visual-actor-clover')).toHaveAttribute('data-visual-only', 'true');

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

  await advancePlot(page, 2 * 60 * 1000);
  await page.reload();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Ready to collect');
  await waitForRole(page, 'hauler');
  await expect(page.getByTestId('fp-visual-actor-hauler')).toHaveAttribute('data-source-domain', 'building');

  const info = await page.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(info.renderer).toBe('three.js');
  expect(info.roles).toEqual(expect.arrayContaining(['clover', 'hauler']));
  expect(info.actors.every((actor) => actor.visualOnly === true)).toBe(true);
});

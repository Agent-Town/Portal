/**
 * Founders Plot — end-to-end smoke tests (FP-E2E-*).
 *
 * These tests exercise the public HTTP surface of /api/founders-plot and the
 * /founders-plot page via Playwright. They focus on the human-first loop:
 * load the page → seed a plot → place a building → collect outputs.
 *
 * Per-spec reset guarantees an isolated plot.
 */

const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function resetAll(request) {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
}

async function getState(request) {
  const resp = await request.get('/api/founders-plot/state');
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

test.beforeEach(async ({ request }) => {
  await resetAll(request);
});

test('FP-E2E-001 /founders-plot page loads with grid and resource strip', async ({ page }) => {
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  await expect(page.getByTestId('fp-grid')).toBeVisible();
  await expect(page.getByTestId('fp-inventory-strip')).toBeVisible();
  await expect(page.getByTestId('fp-res-coin')).toBeVisible();
});

test('FP-E2E-002 GET /api/founders-plot/tools returns 8 et.plot.* tools', async ({ request }) => {
  const resp = await request.get('/api/founders-plot/tools');
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.ok).toBe(true);
  expect(Array.isArray(body.tools)).toBe(true);
  const names = body.tools.map((t) => t.name).sort();
  for (const n of ['et.plot.get_state', 'et.plot.place_building', 'et.plot.queue_job',
    'et.plot.collect_outputs', 'et.plot.upgrade_building', 'et.plot.set_priority',
    'et.plot.claim_reward', 'et.plot.request_user_approval']) {
    expect(names).toContain(n);
  }
});

test('FP-E2E-003 state endpoint seeds plot with HQ + starter coin', async ({ request }) => {
  const env = await getState(request);
  expect(env.ok).toBe(true);
  expect(env.state.plot.plotId).toBeTruthy();
  const hq = env.state.buildings.find((b) => b.type === 'HQ');
  expect(hq).toBeTruthy();
  expect(hq.level).toBe(1);
  const coin = env.state.plot.inventory?.coin ?? env.state.plot.resources?.coin ?? 0;
  expect(coin).toBeGreaterThanOrEqual(20);
});

test('FP-E2E-004 place LUMBER_CAMP via API then verify in state', async ({ request }) => {
  const env = await getState(request);
  const plotId = env.state.plot.plotId;
  const place = await request.post('/api/founders-plot/place-building', {
    data: { plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN', idempotencyKey: 'e2e-004' },
  });
  expect(place.ok()).toBeTruthy();
  const body = await place.json();
  expect(body.ok).toBe(true);
  const env2 = await getState(request);
  expect(env2.state.buildings.find((b) => b.type === 'LUMBER_CAMP')).toBeTruthy();
});

test('FP-E2E-005 idempotency: same key returns same response', async ({ request }) => {
  const env = await getState(request);
  const plotId = env.state.plot.plotId;
  const args = { plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN', idempotencyKey: 'e2e-005' };
  const r1 = await request.post('/api/founders-plot/place-building', { data: args });
  const r2 = await request.post('/api/founders-plot/place-building', { data: args });
  expect(r1.ok()).toBeTruthy();
  expect(r2.ok()).toBeTruthy();
  const env2 = await getState(request);
  expect(env2.state.buildings.filter((b) => b.type === 'LUMBER_CAMP').length).toBe(1);
});

test('FP-E2E-006 idempotency conflict returns 409', async ({ request }) => {
  const env = await getState(request);
  const plotId = env.state.plot.plotId;
  const key = 'e2e-006-conflict';
  const r1 = await request.post('/api/founders-plot/place-building', {
    data: { plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN', idempotencyKey: key },
  });
  expect(r1.ok()).toBeTruthy();
  const r2 = await request.post('/api/founders-plot/place-building', {
    data: { plotId, type: 'FARM_PLOT', x: 2, y: 1, actor: 'HUMAN', idempotencyKey: key },
  });
  expect(r2.status()).toBe(409);
  const body = await r2.json();
  expect(body.error.code).toBe('IDEMPOTENCY_CONFLICT');
});

test('FP-E2E-007 agent placement blocked with FORBIDDEN_POLICY (403)', async ({ request }) => {
  const env = await getState(request);
  const plotId = env.state.plot.plotId;
  const r = await request.post('/api/founders-plot/place-building', {
    data: { plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'AGENT', idempotencyKey: 'e2e-007' },
  });
  expect(r.status()).toBe(403);
  const body = await r.json();
  expect(body.error.code).toBe('FORBIDDEN_POLICY');
});

test('FP-E2E-008 full loop: construct → produce → collect adds wood to inventory', async ({ request }) => {
  const env = await getState(request);
  const plotId = env.state.plot.plotId;
  const pairId = env.state.plot.pairId;
  const place = await request.post('/api/founders-plot/place-building', {
    data: { plotId, type: 'LUMBER_CAMP', x: 0, y: 1, actor: 'HUMAN', idempotencyKey: 'e2e-008a' },
  });
  expect(place.ok()).toBeTruthy();

  // Advance time by 5 minutes to complete construction
  const adv1 = await request.post('/__test__/founders-plot/advance', {
    data: { pairId, plotId, advanceMs: 5 * 60_000 },
    headers: { 'x-test-reset': resetToken },
  });
  expect(adv1.ok()).toBeTruthy();

  const s1 = await getState(request);
  const lc = s1.state.buildings.find((b) => b.type === 'LUMBER_CAMP');
  expect(lc).toBeTruthy();
  expect(lc.state).toBe('READY');

  const queue = await request.post('/api/founders-plot/queue-job', {
    data: { plotId, buildingId: lc.buildingId, kind: 'PRODUCE', actor: 'HUMAN', idempotencyKey: 'e2e-008b' },
  });
  expect(queue.ok()).toBeTruthy();

  // Advance time by 10 minutes to complete production
  const adv2 = await request.post('/__test__/founders-plot/advance', {
    data: { pairId, plotId, advanceMs: 10 * 60_000 },
    headers: { 'x-test-reset': resetToken },
  });
  expect(adv2.ok()).toBeTruthy();

  const collect = await request.post('/api/founders-plot/collect-outputs', {
    data: { plotId, buildingId: lc.buildingId, actor: 'HUMAN', idempotencyKey: 'e2e-008c' },
  });
  expect(collect.ok()).toBeTruthy();
  const body = await collect.json();
  expect(body.ok).toBe(true);

  const sFinal = await getState(request);
  const wood = sFinal.state.plot.inventory?.wood ?? sFinal.state.plot.resources?.wood ?? 0;
  expect(wood).toBeGreaterThan(0);
});

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
const fs = require('fs');

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

test('FP-E2E-002 GET /api/founders-plot/tools returns current et.plot.* tools', async ({ request }) => {
  const resp = await request.get('/api/founders-plot/tools');
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.ok).toBe(true);
  expect(Array.isArray(body.tools)).toBe(true);
  const names = body.tools.map((t) => t.name).sort();
  for (const n of ['et.plot.get_state', 'et.plot.place_building', 'et.plot.queue_job',
    'et.plot.collect_outputs', 'et.plot.draft_site_plan', 'et.plot.review_site_plan', 'et.plot.list_plots',
    'et.plot.prepare_settler_convoy', 'et.plot.found_settlement', 'et.plot.select_doctrine',
    'et.plot.create_work_order_draft', 'et.plot.execute_work_order', 'et.plot.get_world_grid_status',
    'et.plot.get_expedition_map',
    'et.plot.list_civic_proposals', 'et.plot.create_civic_proposal',
    'et.plot.list_overlay_packs', 'et.plot.create_overlay_pack', 'et.plot.list_civic_projects',
    'et.plot.activate_civic_project', 'et.plot.upgrade_building', 'et.plot.set_priority',
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

test('FP-E2E-009 UI loop: player can queue production and collect through the page', async ({ page }) => {
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();

  await page.getByTestId('fp-tile-0-1').click();
  await expect(page.getByTestId('fp-palette-LUMBER_CAMP')).toContainText('coin: 20/8');
  await expect(page.getByTestId('fp-palette-FARM_PLOT')).toBeDisabled();
  await expect(page.getByTestId('fp-build-requirements-FARM_PLOT')).toContainText('wood: 0/12 need 12');
  await expect(page.getByTestId('fp-build-requirements-FARM_PLOT')).toContainText('coin: 20/4');
  await expect(page.getByTestId('fp-palette-QUARRY')).toBeDisabled();
  await expect(page.getByTestId('fp-palette-QUARRY')).toContainText('Locked until HQ Lv 2');
  await page.getByTestId('fp-palette-LUMBER_CAMP').click();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Building');
  await expect(page.getByTestId('fp-close-palette')).toBeHidden();

  const ids = await page.evaluate(async () => {
    const resp = await fetch('/api/founders-plot/state');
    const body = await resp.json();
    return {
      pairId: body.state.plot.pairId,
      plotId: body.state.plot.plotId,
    };
  });

  await page.evaluate(async ({ pairId, plotId }) => {
    await fetch('/__test__/founders-plot/advance', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-reset': 'test-reset' },
      body: JSON.stringify({ pairId, plotId, advanceMs: 5 * 60_000 }),
    });
  }, ids);

  await page.reload();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Idle');
  await page.getByTestId('fp-tile-0-1').click();
  await expect(page.getByTestId('fp-btn-queue')).toBeVisible();
  await page.getByTestId('fp-btn-queue').click();
  await expect(page.getByTestId('fp-tile-0-1')).toContainText(/Producing|Ready to collect/);

  if (!(await page.getByTestId('fp-tile-0-1').textContent()).includes('Ready to collect')) {
    await page.evaluate(async ({ pairId, plotId }) => {
      await fetch('/__test__/founders-plot/advance', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-test-reset': 'test-reset' },
        body: JSON.stringify({ pairId, plotId, advanceMs: 10 * 60_000 }),
      });
    }, ids);

    await page.reload();
  }
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Ready to collect');
  await page.getByTestId('fp-tile-0-1').click();
  await expect(page.getByTestId('fp-btn-collect')).toBeVisible();
  await page.getByTestId('fp-btn-collect').click();
  await expect(page.getByTestId('fp-res-wood')).not.toHaveText('0');
  await expect(page.getByTestId('fp-tile-0-1')).toContainText('Idle');
  await expect(page.getByTestId('fp-btn-collect')).toHaveCount(0);
  await page.getByTestId('fp-tile-1-0').click();
  await expect(page.getByTestId('fp-upgrade-requirements-HQ')).toContainText('wood: 10/20 need 10');
  await expect(page.getByTestId('fp-upgrade-requirements-HQ')).toContainText('food: 0/10 need 10');
  await expect(page.getByTestId('fp-upgrade-requirements-HQ')).toContainText('XP: 15/25 need 10');
  await expect(page.getByTestId('fp-btn-upgrade')).toBeDisabled();
  await expect(page.getByTestId('fp-close-palette')).toBeHidden();
});

test('FP-E2E-009a UI surfaces claimable rewards and claims through the server endpoint', async ({ page }) => {
  const plotId = 'plot_reward_claim_ui';
  const pairId = 'pair:reward-claim-ui';
  let claimed = false;
  let capturedClaim = null;

  function makeState() {
    const state = {
      plot: {
        plotId,
        pairId,
        hqLevel: 4,
        townXp: 135,
        inventory: claimed
          ? { wood: 4, stone: 6, food: 2, coin: 10 }
          : { wood: 4, stone: 6, food: 2, coin: 2 },
        storageCaps: { wood: 160, stone: 160, food: 160 },
        scoutReports: [],
        sitePlans: [],
      },
      buildings: [{ buildingId: 'bldg_hq_reward_ui', type: 'HQ', x: 1, y: 0, level: 4, state: 'READY' }],
      jobs: [],
      policy: {},
      permissions: [],
      pendingApprovals: [],
      rewards: claimed ? [] : [{
        rewardId: 'hq.level-4',
        title: 'Workshop charter',
        body: 'Your builders can now compress future timelines.',
        grant: { coin: 8 },
      }],
      quest: { id: 'reach-hq-5', title: 'Reach HQ Level 5', body: 'Claim milestone rewards, then keep the loop moving.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      visualActors: [],
      audit: { stateHash: claimed ? 'claimed' : 'claimable' },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/claim-reward', async (route) => {
    capturedClaim = route.request().postDataJSON();
    expect(capturedClaim.plotId).toBe(plotId);
    expect(capturedClaim.rewardId).toBe('hq.level-4');
    expect(capturedClaim.actor).toBe('HUMAN');
    expect(capturedClaim.idempotencyKey).toMatch(/^fp-claim-reward-hq_level-4-/);
    claimed = true;
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, reward: { rewardId: 'hq.level-4' } }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-rewards-panel')).toContainText('Workshop charter');
  await expect(page.getByTestId('fp-reward-grant-hq_level-4')).toContainText('coin +8');
  await expect(page.getByTestId('fp-btn-claim-reward-hq_level-4')).toBeVisible();
  await page.getByTestId('fp-btn-claim-reward-hq_level-4').click();
  await expect(page.getByTestId('fp-res-coin')).toHaveText('10');
  await expect(page.getByTestId('fp-rewards-body')).toContainText('No claimable rewards right now');
  expect(capturedClaim).toBeTruthy();
});

test('FP-E2E-009b Foreman panel explains first delegated action XP', async ({ page }) => {
  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-foreman-status')).toContainText('first delegated action');
  await expect(page.getByTestId('fp-foreman-status')).toContainText('+10 XP');
});

test('FP-E2E-010 UI reviews an HQ6 Site Plan into claim-ready planning only', async ({ page }) => {
  const plotId = 'plot_hq6_review_ui';
  const pairId = 'pair:hq6-review-ui';
  const planId = 'site_plan_scout_report_1_forest_ridge';
  const reportId = 'scout_report_1_forest-ridge';
  const planSlug = 'site_plan_scout_report_1_forest_ridge';
  let reviewed = false;
  let capturedReview = null;
  let releaseReview = () => {};
  const reviewGate = new Promise((resolve) => { releaseReview = resolve; });

  function makeState() {
    const sitePlan = {
      planId,
      reportId,
      originPlotId: plotId,
      title: 'Forest Ridge First Outpost',
      summary: 'Canonical planning draft recorded from a Scout Report.',
      focus: 'resource',
      siteType: 'forest_edge',
      status: reviewed ? 'REVIEWED' : 'DRAFT',
      promotionStatus: reviewed ? 'reviewed_claim_ready' : 'draft',
      reviewStatus: reviewed ? 'reviewed' : 'unreviewed',
      authorityBoundary: reviewed ? 'claim_ready_planning_only_no_territory' : 'requires_engine_promotion_for_settlement',
      reviewedAt: reviewed ? 1700_000_900_000 : undefined,
      reviewNote: reviewed ? 'HQ6 Settlement Charter review: claim-ready planning only; no territory claimed.' : undefined,
      recommendedNext: reviewed
        ? 'Hold for HQ7 Settler Convoy claim rules before creating territory, routes, convoys, or a second plot.'
        : 'No claim or second plot exists until a future engine promotion implements it.',
      createdAt: 1700_000_000_000,
    };
    const scoutReport = {
      reportId,
      originPlotId: plotId,
      title: 'Forest Ridge Survey',
      summary: 'Nearby forest edge looks suitable for a later outpost.',
      siteType: 'forest_edge',
      risk: 'low',
      traits: ['wooded', 'sheltered'],
      sequence: 1,
      createdAt: 1700_000_000_000,
    };
    const state = {
      plot: {
        plotId,
        pairId,
        hqLevel: 6,
        townXp: 220,
        inventory: { wood: 90, stone: 80, food: 50, coin: 20 },
        storageCaps: { wood: 220, stone: 220, food: 220 },
        scoutReports: [scoutReport],
        sitePlans: [sitePlan],
      },
      buildings: [{ buildingId: 'bldg_hq_review_ui', type: 'HQ', x: 1, y: 0, level: 6, state: 'READY' }],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'review-site-plan', title: 'Review the first Site Plan', body: 'HQ6 Settlement Charter can mark claim-ready planning state.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [scoutReport],
      sitePlans: [sitePlan],
      visualActors: [],
      audit: { stateHash: reviewed ? 'reviewed-hash' : 'draft-hash' },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/review-site-plan', async (route) => {
    capturedReview = route.request().postDataJSON();
    expect(capturedReview.planId).toBe(planId);
    expect(capturedReview.plotId).toBe(plotId);
    expect(capturedReview.actor).toBe('HUMAN');
    expect(capturedReview.idempotencyKey).toMatch(/^fp-review-site-plan-site_plan_scout_report_1_forest_ridge-/);
    expect(capturedReview.reviewNote).toContain('claim-ready planning only');
    expect(capturedReview.reviewNote).toContain('no territory claimed');
    await reviewGate;
    reviewed = true;
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, sitePlan: body.state.sitePlans[0], existing: false }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId(`fp-site-plan-${planSlug}`)).toContainText('Settlement Charter review available');
  await expect(page.getByTestId(`fp-btn-review-site-plan-${planSlug}`)).toBeVisible();

  await page.getByTestId(`fp-btn-review-site-plan-${planSlug}`).click();
  await expect(page.getByTestId(`fp-btn-review-site-plan-${planSlug}`)).toHaveText('Reviewing...');
  releaseReview();

  await expect(page.getByTestId(`fp-site-plan-review-status-${planSlug}`)).toContainText('Claim-ready planning only');
  await expect(page.getByTestId(`fp-site-plan-${planSlug}`)).toContainText('No territory claimed');
  await expect(page.getByTestId(`fp-btn-review-site-plan-${planSlug}`)).toHaveCount(0);
  expect(capturedReview).toBeTruthy();
});

test('FP-E2E-011 UI prepares a Settler Convoy claim and explicitly founds an outpost', async ({ page }) => {
  const plotId = 'plot_hq7_convoy_ui';
  const pairId = 'pair:hq7-convoy-ui';
  const planId = 'site_plan_scout_report_1_forest_ridge';
  const claimId = 'claim_forest_ridge_001';
  const outpostPlotId = 'plot_forest_ridge_outpost';
  const planSlug = 'site_plan_scout_report_1_forest_ridge';
  const claimSlug = 'claim_forest_ridge_001';
  let claim = null;
  let outpostFounded = false;
  let capturedPrepare = null;
  let capturedFound = null;
  let releasePrepare = () => {};
  let releaseFound = () => {};
  const prepareGate = new Promise((resolve) => { releasePrepare = resolve; });
  const foundGate = new Promise((resolve) => { releaseFound = resolve; });

  function sitePlan() {
    return {
      planId,
      reportId: 'scout_report_1_forest-ridge',
      originPlotId: plotId,
      title: 'Forest Ridge First Outpost',
      summary: 'Reviewed claim-ready planning for a nearby forest edge.',
      focus: 'resource',
      siteType: 'forest_edge',
      risk: 'low',
      traits: ['wooded', 'sheltered'],
      status: claim ? claim.status : 'REVIEWED',
      promotionStatus: claim ? 'convoy_preparing' : 'reviewed_claim_ready',
      reviewStatus: 'reviewed',
      authorityBoundary: 'claim_ready_planning_only_no_territory',
      claimId: claim?.claimId,
      foundedPlotId: claim?.foundedPlotId,
      reviewedAt: 1700_000_900_000,
      createdAt: 1700_000_000_000,
    };
  }

  function ownedPlots() {
    return [
      {
        plotId,
        role: 'HOME',
        title: 'Founders Plot',
        hqLevel: 6,
        townXp: 220,
        status: 'ACTIVE',
        active: true,
        updatedAt: 1700_000_900_000,
      },
      ...(outpostFounded ? [{
        plotId: outpostPlotId,
        role: 'OUTPOST',
        title: 'Forest Ridge First Outpost',
        hqLevel: 1,
        townXp: 0,
        status: 'ACTIVE',
        originClaimId: claimId,
        siteType: 'forest_edge',
        risk: 'low',
        active: false,
        updatedAt: 1700_001_300_000,
      }] : []),
    ];
  }

  function makeState() {
    const plan = sitePlan();
    const claims = claim ? [claim] : [];
    const state = {
      plot: {
        plotId,
        pairId,
        hqLevel: 6,
        townXp: 220,
        inventory: { wood: 90, stone: 80, food: 50, coin: 20 },
        storageCaps: { wood: 220, stone: 220, food: 220 },
        scoutReports: [],
        sitePlans: [plan],
      },
      buildings: [
        { buildingId: 'bldg_hq_convoy_ui', type: 'HQ', x: 1, y: 0, level: 6, state: 'READY' },
        { buildingId: 'bldg_expedition_board_convoy_ui', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: claim?.status === 'CONVOY_PREPARING' ? 'PRODUCING' : 'READY' },
      ],
      jobs: claim?.status === 'CONVOY_PREPARING'
        ? [{
          jobId: 'job_settler_convoy_ui',
          buildingId: 'bldg_expedition_board_convoy_ui',
          kind: 'SETTLER_CONVOY',
          status: 'RUNNING',
          startedAt: Date.now() - 30_000,
          endsAt: Date.now() + 150_000,
        }]
        : [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'prepare-settler-convoy', title: 'Prepare a Settler Convoy', body: 'A reviewed Site Plan can become one bounded claim.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [plan],
      settlementClaims: claims,
      ownedPlots: ownedPlots(),
      activePlotId: plotId,
      homePlotId: plotId,
      visualActors: [],
      audit: { stateHash: claim?.status || 'ready' },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        homePlotId: plotId,
        activePlotId: plotId,
        plots: ownedPlots(),
        settlementClaims: claim ? [claim] : [],
      }),
    });
  });

  await page.route('**/api/founders-plot/prepare-settler-convoy', async (route) => {
    capturedPrepare = route.request().postDataJSON();
    expect(capturedPrepare.plotId).toBe(plotId);
    expect(capturedPrepare.sitePlanId).toBe(planId);
    expect(capturedPrepare.actor).toBe('HUMAN');
    expect(capturedPrepare.idempotencyKey).toMatch(/^fp-prepare-settler-convoy-site_plan_scout_report_1_forest_ridge-/);
    await prepareGate;
    claim = {
      claimId,
      ownerPairId: pairId,
      originPlotId: plotId,
      sitePlanId: planId,
      reportId: 'scout_report_1_forest-ridge',
      foundedPlotId: null,
      convoyJobId: 'job_settler_convoy_ui',
      status: 'CONVOY_PREPARING',
      title: 'Forest Ridge First Outpost',
      focus: 'resource',
      siteType: 'forest_edge',
      risk: 'low',
      traits: ['wooded', 'sheltered'],
      resourceHints: { wood: 1 },
      route: { visualOnlyProjection: true, progress: 0.25 },
      cost: { wood: 32, food: 20, stone: 12, coin: 8 },
      receipt: { durationMs: 180_000, kind: 'settler_convoy_prepared' },
      createdBy: 'HUMAN',
      createdAt: 1700_001_000_000,
      updatedAt: 1700_001_000_000,
      convoyStartedAt: Date.now() - 30_000,
      convoyEndsAt: Date.now() + 150_000,
      foundedAt: null,
    };
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, settlementClaim: claim, job: body.state.jobs[0], existing: false }),
    });
  });

  await page.route('**/api/founders-plot/found-settlement', async (route) => {
    capturedFound = route.request().postDataJSON();
    expect(capturedFound.plotId).toBe(plotId);
    expect(capturedFound.claimId).toBe(claimId);
    expect(capturedFound.actor).toBe('HUMAN');
    expect(capturedFound.idempotencyKey).toMatch(/^fp-found-settlement-claim_forest_ridge_001-/);
    await foundGate;
    outpostFounded = true;
    claim = {
      ...claim,
      status: 'FOUNDED',
      foundedPlotId: outpostPlotId,
      foundedAt: 1700_001_300_000,
      updatedAt: 1700_001_300_000,
      receipt: {
        ...(claim.receipt || {}),
        kind: 'settlement_founded',
        foundedPlotId: outpostPlotId,
      },
    };
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...body,
        settlementClaim: claim,
        foundedPlot: ownedPlots()[1],
        ownedPlots: ownedPlots(),
        existing: false,
      }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId(`fp-site-plan-${planSlug}`)).toContainText('Claim-ready planning only');
  await expect(page.getByTestId(`fp-btn-prepare-settler-convoy-${planSlug}`)).toBeVisible();
  await expect(page.getByTestId('fp-owned-plots-body')).toContainText('Founders Plot');

  await page.getByTestId(`fp-btn-prepare-settler-convoy-${planSlug}`).click();
  await expect(page.getByTestId(`fp-btn-prepare-settler-convoy-${planSlug}`)).toHaveText('Preparing...');
  releasePrepare();

  await expect(page.getByTestId(`fp-settlement-claim-${claimSlug}`)).toContainText('CONVOY PREPARING');
  await expect(page.getByTestId(`fp-settlement-claim-${claimSlug}`)).toContainText('Source plan: Forest Ridge First Outpost');
  await expect(page.getByTestId(`fp-settlement-claim-cost-${claimSlug}`)).toContainText('wood: 90/32');
  await expect(page.getByTestId(`fp-btn-prepare-settler-convoy-${planSlug}`)).toHaveCount(0);
  expect(capturedPrepare).toBeTruthy();

  claim = {
    ...claim,
    status: 'CONVOY_ARRIVED',
    updatedAt: 1700_001_200_000,
    convoyEndsAt: Date.now() - 1,
  };
  await page.reload();
  await expect(page.getByTestId(`fp-btn-found-settlement-${claimSlug}`)).toBeVisible();
  await page.getByTestId(`fp-btn-found-settlement-${claimSlug}`).click();
  await expect(page.getByTestId(`fp-btn-found-settlement-${claimSlug}`)).toHaveText('Founding...');
  releaseFound();

  await expect(page.getByTestId(`fp-settlement-claim-status-${claimSlug}`)).toContainText('FOUNDED');
  await expect(page.getByTestId(`fp-settlement-claim-founded-${claimSlug}`)).toContainText('Second plot founded explicitly');
  await expect(page.getByTestId(`fp-owned-plot-${outpostPlotId}`)).toContainText('Outpost');
  expect(capturedFound).toBeTruthy();
});

test('FP-E2E-012 UI shows Research Lodge doctrine locked, available, and selected states', async ({ page }) => {
  const plotId = 'plot_hq8_doctrine_ui';
  const doctrineId = 'survey_discipline';
  let mode = 'locked';
  let capturedSelect = null;
  let releaseSelect = () => {};
  const selectGate = new Promise((resolve) => { releaseSelect = resolve; });

  function doctrineCatalog() {
    const unlocked = mode !== 'locked';
    const selected = mode === 'selected';
    return [{
      doctrineId,
      title: 'Survey Discipline',
      unlockHqLevel: 6,
      requiresFoundedOutpost: true,
      cost: {},
      effectKind: 'scout_duration_modifier',
      effectValue: {
        buildingType: 'EXPEDITION_BOARD',
        jobKind: 'SCOUT',
        durationMultiplier: 0.95,
        reductionPct: 5,
      },
      gameplayBuff: true,
      engineOwnedEffect: true,
      summary: 'Research Lodge doctrine that trims Expedition Board SCOUT job duration by 5% while preserving costs, outputs, and settlement rules.',
      selected,
      availability: {
        unlocked,
        hqLevel: unlocked ? 6 : 5,
        hqLevelRequired: 6,
        outpostCount: unlocked ? 1 : 0,
        requiresFoundedOutpost: true,
        blockedBy: unlocked ? [] : ['hq.level.6', 'settlement.outpost.founded'],
      },
    }];
  }

  function makeState() {
    const catalog = doctrineCatalog();
    const selected = mode === 'selected';
    const doctrineState = selected
      ? { status: 'SELECTED', selectedDoctrineId: doctrineId, selectedAt: 1700_002_000_000, selectedBy: 'HUMAN' }
      : { status: 'NONE' };
    const research = {
      lodge: {
        status: mode === 'locked' ? 'LOCKED' : 'OPERATIONAL_READY',
        title: 'Research Lodge',
        buildingRequired: false,
        engineOwnedEffect: true,
      },
      doctrineState,
      selectedDoctrine: selected ? catalog[0] : null,
      activeEffects: selected ? [{
        doctrineId,
        effectKind: 'scout_duration_modifier',
        buildingType: 'EXPEDITION_BOARD',
        jobKind: 'SCOUT',
        durationMultiplier: 0.95,
        reductionPct: 5,
      }] : [],
      doctrineCatalog: catalog,
    };
    const state = {
      plot: {
        plotId,
        pairId: 'pair:hq8-doctrine-ui',
        hqLevel: mode === 'locked' ? 5 : 6,
        townXp: 240,
        inventory: { wood: 90, stone: 80, food: 50, coin: 20 },
        storageCaps: { wood: 220, stone: 220, food: 220 },
        doctrineState,
      },
      buildings: [{ buildingId: 'bldg_hq_doctrine_ui', type: 'HQ', x: 1, y: 0, level: mode === 'locked' ? 5 : 6, state: 'READY' }],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'select-doctrine', title: 'Set a doctrine stance', body: 'Research Lodge doctrine is server-owned.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      settlementClaims: [],
      ownedPlots: [],
      research,
      doctrineCatalog: catalog,
      doctrineState,
      visualActors: [],
      audit: { stateHash: mode },
    };
    return { ok: true, plotId, state, stateHash: mode, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, plotId, plots: [], settlementClaims: [] }),
    });
  });

  await page.route('**/api/founders-plot/select-doctrine', async (route) => {
    capturedSelect = route.request().postDataJSON();
    expect(capturedSelect.plotId).toBe(plotId);
    expect(capturedSelect.doctrineId).toBe(doctrineId);
    expect(capturedSelect.actor).toBe('HUMAN');
    expect(capturedSelect.idempotencyKey).toMatch(/^fp-select-doctrine-survey_discipline-/);
    await selectGate;
    mode = 'selected';
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, doctrine: body.state.doctrineCatalog[0], doctrineState: body.state.doctrineState, existing: false }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-doctrine-survey_discipline')).toContainText('Locked');
  await expect(page.getByTestId('fp-doctrine-survey_discipline')).toContainText('hq level 6');
  await expect(page.getByTestId('fp-btn-select-doctrine-survey_discipline')).toHaveCount(0);

  mode = 'available';
  await page.reload();
  await expect(page.getByTestId('fp-doctrine-status-survey_discipline')).toContainText('Available');
  await expect(page.getByTestId('fp-doctrine-survey_discipline')).toContainText('only Expedition Board SCOUT duration gets 5% shorter');
  await expect(page.getByTestId('fp-btn-select-doctrine-survey_discipline')).toBeVisible();

  await page.getByTestId('fp-btn-select-doctrine-survey_discipline').click();
  await expect(page.getByTestId('fp-btn-select-doctrine-survey_discipline')).toHaveText('Selecting...');
  releaseSelect();

  await expect(page.getByTestId('fp-doctrine-status-survey_discipline')).toContainText('Selected');
  await expect(page.getByTestId('fp-doctrine-effect-survey_discipline')).toContainText('Expedition Board SCOUT duration reduced by 5%');
  await expect(page.getByTestId('fp-doctrine-effect-survey_discipline')).toContainText('Costs, outputs, inventory, settlement, and cross-plot rules are unchanged');
  await expect(page.getByTestId('fp-btn-select-doctrine-survey_discipline')).toHaveCount(0);
  expect(capturedSelect).toBeTruthy();
});

test('FP-E2E-013 UI creates and executes an HQ9 Work Order explicitly', async ({ page }) => {
  const plotId = 'plot_hq9_work_order_ui';
  const templateId = 'collect_ready_outputs_once';
  const workOrderId = 'work_order_ui_001';
  const failedWorkOrderId = 'work_order_ui_failed';
  const expiredWorkOrderId = 'work_order_ui_expired';
  const templateSlug = 'collect_ready_outputs_once';
  const workOrderSlug = 'work_order_ui_001';
  const failedSlug = 'work_order_ui_failed';
  const expiredSlug = 'work_order_ui_expired';
  const baseNow = Date.now();
  let mode = 'locked';
  let workOrders = [];
  let capturedDraft = null;
  let capturedExecute = null;
  let releaseDraft = () => {};
  let releaseExecute = () => {};
  const draftGate = new Promise((resolve) => { releaseDraft = resolve; });
  const executeGate = new Promise((resolve) => { releaseExecute = resolve; });

  function template() {
    const unlocked = mode !== 'locked';
    return {
      templateId,
      title: 'Collect Ready Outputs Once',
      status: 'EXECUTOR_AVAILABLE',
      summary: 'Drafts and explicitly executes a bounded cohort work order for collecting up to two ready outputs once.',
      allowedActions: ['et.plot.collect_outputs'],
      caps: {
        maxChildActions: 2,
        maxResourceSpend: { wood: 0, stone: 0, food: 0, coin: 0 },
        maxRuntimeMs: 120000,
        allowedPlotScope: 'current_plot_only',
      },
      authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1',
      availability: {
        unlocked,
        hqLevelRequired: 6,
        outpostCount: unlocked ? 1 : 0,
        selectedDoctrineId: unlocked ? 'survey_discipline' : null,
        requiresFoundedOutpost: true,
        requiresSelectedDoctrine: 'survey_discipline',
        blockedBy: unlocked ? [] : ['hq.level.6', 'settlement.outpost.founded', 'doctrine.survey_discipline.selected'],
      },
    };
  }

  function draftOrder(overrides = {}) {
    return {
      workOrderId,
      plotId,
      templateId,
      status: 'DRAFT',
      title: 'Collect Ready Outputs Once',
      scope: {
        mode: 'all_ready_outputs',
        plotId,
        buildingIds: [],
        targetState: 'OUTPUT_READY',
        maxBuildings: 2,
      },
      allowedActions: ['et.plot.collect_outputs'],
      caps: template().caps,
      policySnapshot: { collectOutputs: false, emergencyPause: false },
      childReceipts: [],
      createdBy: 'HUMAN',
      approvedBy: null,
      failureReason: null,
      createdAt: baseNow,
      updatedAt: baseNow,
      expiresAt: baseNow + 24 * 60 * 60 * 1000,
      ...overrides,
    };
  }

  function failedOrder() {
    return draftOrder({
      workOrderId: failedWorkOrderId,
      status: 'FAILED',
      title: 'Failed Receipt Run',
      failureReason: 'server rejected stale ready-output scope',
      updatedAt: baseNow - 1000,
    });
  }

  function expiredOrder() {
    return draftOrder({
      workOrderId: expiredWorkOrderId,
      title: 'Expired Receipt Run',
      updatedAt: baseNow - 2000,
      expiresAt: baseNow - 1000,
    });
  }

  function completedOrder() {
    return draftOrder({
      status: 'COMPLETED',
      updatedAt: baseNow + 1000,
      expiresAt: baseNow - 5000,
      childReceipts: [
        { parentWorkOrderId: workOrderId, childAction: 'et.plot.collect_outputs', buildingId: 'bldg_lumber_ready' },
        { parentWorkOrderId: workOrderId, childAction: 'et.plot.collect_outputs', buildingId: 'bldg_farm_ready' },
      ],
    });
  }

  function makeState() {
    const workOrderTemplates = [template()];
    const cohortPlanner = {
      status: mode === 'locked' ? 'LOCKED' : 'DRAFTING_READY',
      title: 'Cohort Work Orders',
      implementation: 'hq9b_server_owned_single_executor_collect_ready_outputs_once',
      executionAvailable: mode !== 'locked',
      authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1',
      templates: workOrderTemplates,
      workOrders,
    };
    const state = {
      plot: {
        plotId,
        pairId: 'pair:hq9-work-order-ui',
        hqLevel: mode === 'locked' ? 5 : 6,
        townXp: 260,
        inventory: { wood: 64, stone: 32, food: 40, coin: 12 },
        storageCaps: { wood: 220, stone: 220, food: 220 },
        doctrineState: mode === 'locked'
          ? { status: 'NONE' }
          : { status: 'SELECTED', selectedDoctrineId: 'survey_discipline', selectedAt: baseNow, selectedBy: 'HUMAN' },
      },
      buildings: [
        { buildingId: 'bldg_hq_work_order_ui', type: 'HQ', x: 1, y: 0, level: mode === 'locked' ? 5 : 6, state: 'READY' },
        { buildingId: 'bldg_lumber_ready', type: 'LUMBER_CAMP', x: 0, y: 1, level: 1, state: mode === 'completed' ? 'READY' : 'OUTPUT_READY', outputBuffer: { wood: 12 } },
        { buildingId: 'bldg_farm_ready', type: 'FARM_PLOT', x: 1, y: 1, level: 1, state: mode === 'completed' ? 'READY' : 'OUTPUT_READY', outputBuffer: { food: 9 } },
      ],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'work-orders', title: 'Bounded delegation', body: 'Draft and execute a collect-ready-output Work Order explicitly.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      settlementClaims: mode === 'locked' ? [] : [{ claimId: 'claim_work_order_outpost', status: 'FOUNDED', foundedPlotId: 'plot_work_order_outpost' }],
      ownedPlots: [],
      research: {},
      cohortPlanner,
      workOrderTemplates,
      workOrders,
      visualActors: [],
      audit: { stateHash: `${mode}-${workOrders.map((order) => `${order.workOrderId}:${order.status}`).join('|')}` },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, plotId, plots: [], settlementClaims: mode === 'locked' ? [] : [{ claimId: 'claim_work_order_outpost', status: 'FOUNDED', foundedPlotId: 'plot_work_order_outpost' }] }),
    });
  });

  await page.route('**/api/founders-plot/work-orders/draft', async (route) => {
    capturedDraft = route.request().postDataJSON();
    expect(capturedDraft.plotId).toBe(plotId);
    expect(capturedDraft.templateId).toBe(templateId);
    expect(capturedDraft.scope.plotId).toBe(plotId);
    expect(capturedDraft.actor).toBe('HUMAN');
    expect(capturedDraft.idempotencyKey).toMatch(/^fp-work-order-draft-collect_ready_outputs_once-/);
    await draftGate;
    mode = 'drafted';
    workOrders = [draftOrder(), failedOrder(), expiredOrder()];
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, workOrder: workOrders[0], executionAvailable: true }),
    });
  });

  await page.route('**/api/founders-plot/work-orders/execute', async (route) => {
    capturedExecute = route.request().postDataJSON();
    expect(capturedExecute.plotId).toBe(plotId);
    expect(capturedExecute.workOrderId).toBe(workOrderId);
    expect(capturedExecute.actor).toBe('HUMAN');
    expect(capturedExecute.idempotencyKey).toMatch(/^fp-work-order-execute-work_order_ui_001-/);
    await executeGate;
    mode = 'completed';
    workOrders = [completedOrder(), failedOrder(), expiredOrder()];
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, workOrder: workOrders[0], executedChildCount: 2, childReceipts: workOrders[0].childReceipts }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId(`fp-work-order-template-${templateSlug}`)).toContainText('Locked');
  await expect(page.getByTestId(`fp-work-order-template-${templateSlug}`)).toContainText('Server prerequisites');
  await expect(page.getByTestId(`fp-btn-create-work-order-${templateSlug}`)).toHaveCount(0);

  mode = 'available';
  await page.reload();
  await expect(page.getByTestId(`fp-work-order-template-status-${templateSlug}`)).toContainText('Draft ready');
  await expect(page.getByTestId(`fp-work-order-template-${templateSlug}`)).toContainText('collect outputs');
  await expect(page.getByTestId(`fp-work-order-template-${templateSlug}`)).toContainText('spend cap 0');
  await expect(page.getByTestId(`fp-work-order-template-${templateSlug}`)).toContainText('No scheduler');

  await page.getByTestId(`fp-btn-create-work-order-${templateSlug}`).click();
  await expect(page.getByTestId(`fp-btn-create-work-order-${templateSlug}`)).toHaveText('Drafting...');
  releaseDraft();

  await expect(page.getByTestId(`fp-work-order-status-${workOrderSlug}`)).toContainText('DRAFT');
  await expect(page.getByTestId(`fp-work-order-${failedSlug}`)).toContainText('FAILED');
  await expect(page.getByTestId(`fp-work-order-${expiredSlug}`)).toContainText('EXPIRED');
  await expect(page.getByTestId(`fp-work-order-expiry-${expiredSlug}`)).toContainText('Expired draft. Recreate it before execution.');
  await expect(page.getByTestId(`fp-btn-execute-work-order-${workOrderSlug}`)).toBeVisible();
  expect(capturedDraft).toBeTruthy();

  await page.getByTestId(`fp-btn-execute-work-order-${workOrderSlug}`).click();
  await expect(page.getByTestId(`fp-btn-execute-work-order-${workOrderSlug}`)).toHaveText('Executing...');
  releaseExecute();

  await expect(page.getByTestId(`fp-work-order-status-${workOrderSlug}`)).toContainText('COMPLETED');
  await expect(page.getByTestId(`fp-work-order-${workOrderSlug}`)).toContainText('2 child receipts');
  await expect(page.getByTestId(`fp-work-order-expiry-${workOrderSlug}`)).toContainText('Completed receipt. Child receipts are preserved for audit.');
  await expect(page.getByTestId(`fp-work-order-expiry-${workOrderSlug}`)).not.toContainText('Expired draft');
  await expect(page.getByTestId(`fp-work-order-expiry-${workOrderSlug}`)).not.toContainText('Recreate it before execution');
  await expect(page.getByTestId(`fp-work-order-expiry-${expiredSlug}`)).toContainText('Expired draft. Recreate it before execution.');
  await expect(page.getByTestId(`fp-btn-execute-work-order-${workOrderSlug}`)).toHaveCount(0);
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await page.locator('#fp-work-orders-body').screenshot({ path: 'reports/agent-town-hq9-work-order-completed-copy-polish-proof-2026-05-31.png' });
  expect(capturedExecute).toBeTruthy();
});

test('FP-E2E-014 UI shows HQ10 World Grid readiness as read-only advisory status', async ({ page }) => {
  const plotId = 'plot_hq10_world_grid_ui';
  const worldGrid = {
    status: 'READ_MODEL_READY',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_read_only_world_grid_projection_no_civic_mutation_v1',
    requirements: {
      items: [
        { key: 'hq.level.6', label: 'HQ6 Settlement Charter', satisfied: true, current: 6, required: 6 },
        { key: 'settlement.outpost.founded', label: 'Founded outpost', satisfied: true, current: 1, required: 1 },
        { key: 'doctrine.survey_discipline.selected', label: 'Survey Discipline selected', satisfied: true, current: 'survey_discipline', required: 'survey_discipline' },
        { key: 'work_order.collect_ready_outputs_once.available', label: 'Collect-ready work-order executor available', satisfied: true, current: true, required: true },
      ],
      blockedBy: [],
      satisfiedCount: 4,
      totalCount: 4,
    },
    scope: {
      homePlotId: plotId,
      activePlotId: plotId,
      knownPlotCount: 2,
      outpostCount: 1,
      knownClaimCount: 1,
    },
    claims: {
      total: 1,
      byStatus: { FOUNDED: 1 },
      foundedOutpostCount: 1,
      foundedPlotIds: ['plot_hq10_outpost_ui'],
    },
    doctrine: {
      selectedDoctrineId: 'survey_discipline',
      status: 'SELECTED',
      activeEffects: [{ effectKind: 'scout_duration_modifier', reductionPct: 5 }],
    },
    workOrders: {
      draftCount: 1,
      completedCount: 0,
      executionAvailable: true,
      templateIds: ['collect_ready_outputs_once'],
    },
    civicReadiness: {
      ready: true,
      nextPromotableSlice: 'HQ10B_CIVIC_PROPOSAL_RECORDS',
      blockedBy: [],
      signals: [
        { key: 'multi_plot_visibility', ready: true, value: 2 },
        { key: 'claim_receipts', ready: true, value: 1 },
        { key: 'doctrine_context', ready: true, value: 'survey_discipline' },
        { key: 'bounded_work_orders', ready: true, value: true },
      ],
      prohibitedCapabilities: [
        'civic_mutation',
        'trade_routes',
        'background_scheduling',
        'arbitrary_tool_execution',
        'resource_spending',
        'atlas_owned_execution',
        'external_or_public_effects',
      ],
    },
    projectionHash: 'world-grid-ui-proof',
  };

  function makeState() {
    const state = {
      plot: {
        plotId,
        pairId: 'pair:hq10-world-grid-ui',
        hqLevel: 10,
        townXp: 420,
        inventory: { wood: 150, stone: 120, food: 95, coin: 30 },
      },
      buildings: [{ buildingId: 'bldg_hq_world_grid_ui', type: 'HQ', x: 1, y: 0, level: 10, state: 'READY' }],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'world-grid', title: 'Read the World Grid', body: 'Current civic readiness is advisory.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      settlementClaims: [{ claimId: 'claim_hq10_outpost_ui', status: 'FOUNDED', foundedPlotId: 'plot_hq10_outpost_ui' }],
      ownedPlots: [],
      research: {},
      cohortPlanner: {},
      workOrderTemplates: [],
      workOrders: [],
      worldGrid,
      publicSummary: {
        worldGridReady: true,
        worldGridStatus: 'READ_MODEL_READY',
        worldGridProjectionHash: 'world-grid-ui-proof',
      },
      visualActors: [],
      audit: { stateHash: 'world-grid-ui' },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        homePlotId: plotId,
        activePlotId: plotId,
        plots: [
          { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 10, active: true },
          { plotId: 'plot_hq10_outpost_ui', role: 'OUTPOST', title: 'First Outpost', hqLevel: 1, active: false },
        ],
        settlementClaims: [{ claimId: 'claim_hq10_outpost_ui', status: 'FOUNDED', foundedPlotId: 'plot_hq10_outpost_ui' }],
      }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-world-grid-panel')).toBeVisible();
  await expect(page.getByTestId('fp-world-grid-status')).toContainText('READ MODEL READY - read-only');
  await expect(page.getByTestId('fp-world-grid-status')).toContainText('4/4 requirements ready');
  await expect(page.getByTestId('fp-world-grid-boundary')).toContainText('No civic mutation');
  await expect(page.getByTestId('fp-world-grid-boundary')).toContainText('Atlas execution');
  await expect(page.getByTestId('fp-world-grid-requirements')).toContainText('HQ6 Settlement Charter');
  await expect(page.getByTestId('fp-world-grid-requirements')).toContainText('Collect-ready work-order executor available');
  await expect(page.getByTestId('fp-world-grid-scope')).toContainText('2 known plots');
  await expect(page.getByTestId('fp-world-grid-scope')).toContainText('1 founded outpost');
  await expect(page.getByTestId('fp-world-grid-civic-readiness')).toContainText('Ready: multi plot visibility');
  await expect(page.getByTestId('fp-world-grid-prohibited-capabilities')).toContainText('civic mutation');
  await expect(page.getByTestId('fp-world-grid-prohibited-capabilities')).toContainText('atlas owned execution');
});

test('FP-E2E-022 UI shows HQ12B Expedition Map from the server read model only', async ({ page }) => {
  test.setTimeout(90000);
  const plotId = 'plot_hq12b_expedition_map_ui';
  const outpostPlotId = 'plot_hq12b_forest_outpost';
  const hq12lExpeditionParty = {
    partyId: 'expedition_party_current_plot_v1',
    kind: 'expedition_party_manifest',
    version: 'hq12g.v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_read_only_expedition_party_manifest_v1',
    members: [
      { memberId: 'pathfinder-scout-v1', displayName: 'Mira Trailmark', role: 'scout' },
      { memberId: 'rook-signalpost-messenger-v1', displayName: 'Rook Signalpost', role: 'messenger' },
      { memberId: 'hq-civic-operator-vale-desk-7-v1', displayName: 'Vale-Desk 7', role: 'hq_civic_operator' },
    ],
    boundaryFlags: {
      autonomousMovement: false,
      operatorAssignment: false,
      resourceHarvesting: false,
      resourceDelta: {},
      routeCreation: false,
      tradeRouteCreation: false,
      backgroundScheduling: false,
      combat: false,
      publicSharing: false,
      generatedUniverseRendering: false,
      crossPlotMutation: false,
      atlasExecution: false,
      externalEffects: false,
    },
  };
  const expeditionMap = {
    status: 'FOG_READ_MODEL_READY',
    title: 'Expedition Map',
    implementation: 'hq12a_server_owned_expedition_map_read_model_v1',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_read_only_expedition_map_fog_of_war_projection_v1',
    fog: {
      states: ['discovered', 'known', 'hinted', 'locked_unknown'],
      counts: { discovered: 2, known: 1, hinted: 1, locked_unknown: 1 },
    },
    scope: {
      homePlotId: plotId,
      activePlotId: plotId,
      ownedPlotCount: 2,
      scoutReportCount: 1,
      sitePlanCount: 1,
      settlementClaimCount: 1,
    },
    sourceSummary: {
      originPlotId: plotId,
      worldGridStatus: 'READ_MODEL_READY',
      reviewedSitePlanIds: ['site_plan_hq12b_forest'],
      foundedPlotIds: [outpostPlotId],
    },
    cells: [
      {
        cellId: 'cell_origin',
        q: 0,
        r: 0,
        fogState: 'discovered',
        kind: 'origin_plot',
        title: 'Founders Plot',
        status: 'OWNED_HOME',
        sourceTruth: 'founder_plot',
        sourceIds: { plotId },
        receipts: [{ kind: 'origin_plot_discovered', sourceIds: { plotId }, readOnly: true }],
        traits: ['home'],
        resourceHints: {},
        siteType: 'home_plot',
        risk: 'owned',
        readOnly: true,
      },
      {
        cellId: 'cell_q1_r0',
        q: 1,
        r: 0,
        fogState: 'known',
        kind: 'planned_site',
        title: 'Forest Ridge Survey Site Plan',
        status: 'SITE_PLAN_REVIEWED',
        sourceTruth: 'site_plan',
        sourceIds: { plotId, reportId: 'scout_report_hq12b_forest', planId: 'site_plan_hq12b_forest' },
        receipts: [{
          kind: 'reviewed_site_plan_known_cell',
          sourceIds: { reportId: 'scout_report_hq12b_forest', planId: 'site_plan_hq12b_forest' },
          readOnly: true,
        }],
        traits: ['wooded', 'sheltered'],
        resourceHints: { wood: 2, food: 1 },
        siteType: 'forest_edge',
        risk: 'low',
        summary: 'Reviewed frontier planning truth from the HQ12A server read model.',
        recommendedNext: 'Use existing Site Plan and Settlement Claim panels for safe follow-up actions.',
        readOnly: true,
      },
      {
        cellId: 'cell_q1_r-1',
        q: 1,
        r: -1,
        fogState: 'discovered',
        kind: 'owned_outpost',
        title: 'Forest Ridge Outpost',
        status: 'OWNED_OUTPOST',
        sourceTruth: 'plot_membership',
        sourceIds: { plotId: outpostPlotId, originClaimId: 'claim_hq12b_forest', claimId: 'claim_hq12b_forest' },
        receipts: [{
          kind: 'owned_outpost_discovered_cell',
          sourceIds: { plotId: outpostPlotId, originClaimId: 'claim_hq12b_forest' },
          readOnly: true,
        }],
        traits: ['owned-outpost'],
        resourceHints: {},
        siteType: 'outpost',
        risk: 'owned',
        summary: 'Founded outpost marker tied to an owned plot record.',
        readOnly: true,
      },
      {
        cellId: 'cell_q0_r1',
        q: 0,
        r: 1,
        fogState: 'hinted',
        kind: 'frontier_hint',
        title: 'Unresolved Frontier Hint',
        status: 'HINTED_BY_KNOWN_FRONTIER',
        sourceTruth: 'derived_hint',
        sourceIds: { adjacentCellId: 'cell_q1_r0' },
        receipts: [{ kind: 'derived_frontier_hint_cell', sourceIds: { adjacentCellId: 'cell_q1_r0' }, readOnly: true }],
        traits: [],
        resourceHints: {},
        siteType: 'unresolved_frontier',
        risk: 'unknown',
        readOnly: true,
      },
      {
        cellId: 'cell_q3_r0',
        q: 3,
        r: 0,
        fogState: 'locked_unknown',
        kind: 'fog_placeholder',
        title: 'Locked Unknown',
        status: 'LOCKED_UNKNOWN',
        sourceTruth: 'fog_placeholder',
        sourceIds: { ring: 3, index: 0 },
        receipts: [{ kind: 'locked_unknown_placeholder_cell', sourceIds: { ring: 3, index: 0 }, readOnly: true }],
        traits: [],
        resourceHints: {},
        siteType: 'unknown',
        risk: 'unknown',
        readOnly: true,
      },
    ],
    expeditionParty: hq12lExpeditionParty,
    units: {
      unitRosterId: 'expedition_unit_roster_current_plot_v1',
      kind: 'expedition_unit_roster',
      version: 'hq15a_server_owned_expedition_unit_roster_v1',
      readOnly: true,
      executableActions: [],
      authorityBoundary: 'server_owned_read_only_expedition_unit_roster_v1',
      interactionModel: {
        selectable: true,
        mapTokens: true,
        commandBarReady: true,
        movementPreviewOnly: false,
        movementCommandReady: true,
        serverAuthoritativeMovementRequiredForMutation: true,
      },
      items: [
        {
          unitId: 'expedition_unit_pathfinder_scout_v1',
          kind: 'expedition_map_unit',
          unitType: 'scout',
          displayName: 'Mira Trailmark',
          role: 'scout',
          state: 'AT_ORIGIN',
          readOnly: true,
          selectable: true,
          executableActions: [],
          location: { cellId: 'cell_origin', q: 0, r: 0, fogState: 'discovered' },
          movement: { canMove: true, movementMutationImplemented: true, allowedTargetCellIds: ['cell_q1_r0'], authority: 'server_owned_scout_unit_revealed_cell_move_receipt_v1', allowedFogStates: ['discovered', 'known'], revealsFog: false, routeCreation: false, resourceDelta: {} },
          commandHints: [{
            commandId: 'move_unit',
            label: 'Move',
            actionName: 'et.plot.move_expedition_unit',
            enabled: true,
            targetCellIds: ['cell_q1_r0'],
            serverMutationImplemented: true,
            requiresHumanApprovalForAgent: true,
            revealsFog: false,
            routeCreation: false,
          }, {
            commandId: 'scout_sector',
            label: 'Scout Sector',
            actionName: 'et.plot.scout_sector',
            enabled: true,
            targetCellIds: ['cell_q0_r1'],
            serverMutationImplemented: true,
            requiresHumanApprovalForAgent: true,
          }],
          boundaryFlags: { movementMutation: true, movementRevealsFog: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
        },
        {
          unitId: 'expedition_unit_rook_signalpost_messenger_v1',
          kind: 'expedition_map_unit',
          unitType: 'courier',
          displayName: 'Rook Signalpost',
          role: 'messenger',
          state: 'AT_ORIGIN',
          readOnly: true,
          selectable: true,
          executableActions: [],
          location: { cellId: 'cell_origin', q: 0, r: 0, fogState: 'discovered' },
          movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
          commandHints: [{ commandId: 'inspect_event_packet', label: 'Inspect packet', enabled: false, serverMutationImplemented: false }],
          boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
        },
        {
          unitId: 'expedition_unit_surveyor_site_plan_hq12b_forest',
          kind: 'expedition_map_unit',
          unitType: 'surveyor',
          displayName: 'Surveyor Crew',
          role: 'surveyor',
          state: 'SURVEY_READY',
          readOnly: true,
          selectable: true,
          executableActions: [],
          location: { cellId: 'cell_q1_r0', q: 1, r: 0, fogState: 'known' },
          movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
          sourcePlanId: 'site_plan_hq12b_forest',
          commandHints: [{
            commandId: 'inspect_survey',
            label: 'Inspect survey',
            enabled: true,
            serverMutationImplemented: false,
          }, {
            commandId: 'prepare_settler_convoy',
            label: 'Prepare Convoy',
            actionName: 'et.plot.prepare_settler_convoy',
            enabled: true,
            sourcePlanId: 'site_plan_hq12b_forest',
            targetCellIds: ['cell_q1_r0'],
            serverMutationImplemented: true,
            requiresHumanApprovalForAgent: true,
            routeCreation: false,
          }],
          boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
        },
        {
          unitId: 'expedition_unit_outpost_crew_claim_hq12b_forest',
          kind: 'expedition_map_unit',
          unitType: 'outpost_crew',
          displayName: 'Outpost Crew',
          role: 'outpost_crew',
          state: 'STATIONED',
          readOnly: true,
          selectable: true,
          executableActions: [],
          location: { cellId: 'cell_q1_r-1', q: 1, r: -1, fogState: 'discovered' },
          movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
          commandHints: [{ commandId: 'inspect_outpost', label: 'Inspect outpost', enabled: true, serverMutationImplemented: false }],
          boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
        },
        {
          unitId: 'expedition_unit_settler_convoy_claim_hq12b_arrived',
          kind: 'expedition_map_unit',
          unitType: 'settler_convoy',
          displayName: 'Settler Convoy',
          role: 'settler',
          state: 'CONVOY_ARRIVED',
          readOnly: true,
          selectable: true,
          executableActions: [],
          location: { cellId: 'cell_q1_r0', q: 1, r: 0, fogState: 'known' },
          movement: { canMove: false, movementMutationImplemented: false, allowedTargetCellIds: [] },
          sourceClaimId: 'claim_hq12b_arrived',
          sourcePlanId: 'site_plan_hq12b_forest',
          commandHints: [{
            commandId: 'found_settlement',
            label: 'Found Outpost',
            actionName: 'et.plot.found_settlement',
            enabled: true,
            claimId: 'claim_hq12b_arrived',
            targetCellIds: ['cell_q1_r0'],
            serverMutationImplemented: true,
            requiresHumanApprovalForAgent: true,
            routeCreation: false,
          }],
          boundaryFlags: { movementMutation: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
        },
      ],
      byCellId: {
        cell_origin: ['expedition_unit_pathfinder_scout_v1', 'expedition_unit_rook_signalpost_messenger_v1'],
        cell_q1_r0: ['expedition_unit_surveyor_site_plan_hq12b_forest', 'expedition_unit_settler_convoy_claim_hq12b_arrived'],
        'cell_q1_r-1': ['expedition_unit_outpost_crew_claim_hq12b_forest'],
      },
      boundaryFlags: { movementMutation: true, movementRevealsFog: false, autonomousMovement: false, routeCreation: false, combat: false, atlasExecution: false, externalEffects: false },
    },
    receipt: {
      kind: 'expedition_map_read_model_projection',
      sourceIds: { plotId, worldGridProjectionHash: 'hq12b-world-grid' },
      readOnly: true,
      routeCreation: false,
      atlasExecution: false,
      projectionHash: 'hq12b-expedition-map-proof',
    },
    projectionHash: 'hq12b-expedition-map-proof',
  };
  let capturedMoveUnit = null;
  let capturedPrepareFromUnit = null;
  let capturedFoundFromUnit = null;
  let moveUnitReceipt = null;
  let capturedScoutSector = null;
  let scoutSectorReceipt = null;
  let hq12fEventPacket = null;

  function makeState() {
    const state = {
      plot: {
        plotId,
        pairId: 'pair:hq12b-expedition-map-ui',
        hqLevel: 11,
        townXp: 520,
        inventory: { wood: 160, stone: 130, food: 115, coin: 44 },
        scoutReports: [{ reportId: 'scout_report_hq12b_forest', title: 'Forest Ridge Survey' }],
        sitePlans: [{ planId: 'site_plan_hq12b_forest', reportId: 'scout_report_hq12b_forest', title: 'Forest Ridge Survey Site Plan', reviewStatus: 'reviewed' }],
      },
      buildings: [
        { buildingId: 'bldg_hq_hq12b_ui', type: 'HQ', x: 1, y: 0, level: 11, state: 'READY' },
        { buildingId: 'bldg_expedition_hq12b_ui', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: 'READY' },
      ],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'expedition-map', title: 'Read the Expedition Map', body: 'Fog of war is server-owned and read-only.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [{ reportId: 'scout_report_hq12b_forest', title: 'Forest Ridge Survey' }],
      sitePlans: [{ planId: 'site_plan_hq12b_forest', reportId: 'scout_report_hq12b_forest', title: 'Forest Ridge Survey Site Plan', reviewStatus: 'reviewed' }],
      settlementClaims: [{ claimId: 'claim_hq12b_forest', status: 'FOUNDED', foundedPlotId: outpostPlotId }],
      ownedPlots: [
        { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 11, active: true },
        { plotId: outpostPlotId, role: 'OUTPOST', title: 'Forest Ridge Outpost', hqLevel: 1, active: false, originClaimId: 'claim_hq12b_forest' },
      ],
      activePlotId: plotId,
      homePlotId: plotId,
      worldGrid: { status: 'READ_MODEL_READY', readOnly: true, civicReadiness: { ready: true }, requirements: { items: [], satisfiedCount: 0, totalCount: 0 } },
      expeditionMap,
      publicSummary: {
        expeditionMapStatus: 'FOG_READ_MODEL_READY',
        expeditionMapDiscoveredCount: 2,
        expeditionMapKnownCount: 1,
        expeditionMapHintedCount: 1,
        expeditionMapLockedUnknownCount: 1,
      },
      visualActors: [],
      audit: { stateHash: 'hq12b-expedition-map-ui' },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        homePlotId: plotId,
        activePlotId: plotId,
        plots: makeState().state.ownedPlots,
        settlementClaims: makeState().state.settlementClaims,
      }),
    });
  });

  await page.route('**/api/founders-plot/prepare-settler-convoy', async (route) => {
    capturedPrepareFromUnit = route.request().postDataJSON();
    expect(capturedPrepareFromUnit.plotId).toBe(plotId);
    expect(capturedPrepareFromUnit.sitePlanId).toBe('site_plan_hq12b_forest');
    expect(capturedPrepareFromUnit.actor).toBe('HUMAN');
    expect(capturedPrepareFromUnit.unitId).toBeUndefined();
    expect(capturedPrepareFromUnit.routeCreation).toBeUndefined();
    expect(capturedPrepareFromUnit.idempotencyKey).toMatch(/^fp-prepare-settler-convoy-site_plan_hq12b_forest-/);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        worldDelta: [{ type: 'SETTLER_CONVOY_PREPARED', sitePlanId: 'site_plan_hq12b_forest' }],
        error: null,
        state: makeState().state,
        stateHash: 'hq15i-prepare-convoy-unit-command',
        settlementClaim: {
          claimId: 'claim_hq15i_unit_command',
          sitePlanId: 'site_plan_hq12b_forest',
          status: 'CONVOY_PREPARING',
        },
        job: {
          jobId: 'job_hq15i_unit_command',
          kind: 'SETTLER_CONVOY',
          status: 'RUNNING',
        },
        existing: false,
      }),
    });
  });

  await page.route('**/api/founders-plot/found-settlement', async (route) => {
    capturedFoundFromUnit = route.request().postDataJSON();
    expect(capturedFoundFromUnit.plotId).toBe(plotId);
    expect(capturedFoundFromUnit.claimId).toBe('claim_hq12b_arrived');
    expect(capturedFoundFromUnit.actor).toBe('HUMAN');
    expect(capturedFoundFromUnit.unitId).toBeUndefined();
    expect(capturedFoundFromUnit.routeCreation).toBeUndefined();
    expect(capturedFoundFromUnit.idempotencyKey).toMatch(/^fp-found-settlement-claim_hq12b_arrived-/);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        claimId: 'claim_hq12b_arrived',
        worldDelta: [{ type: 'SETTLEMENT_FOUNDED', claimId: 'claim_hq12b_arrived' }],
        error: null,
        state: makeState().state,
        stateHash: 'hq15k-found-outpost-unit-command',
        existing: false,
      }),
    });
  });

  await page.route('**/api/founders-plot/expedition-map/move-unit', async (route) => {
    capturedMoveUnit = route.request().postDataJSON();
    expect(capturedMoveUnit.plotId).toBe(plotId);
    expect(capturedMoveUnit.unitId).toBe('expedition_unit_pathfinder_scout_v1');
    expect(capturedMoveUnit.targetCellId).toBe('cell_q1_r0');
    expect(capturedMoveUnit.actor).toBe('HUMAN');
    expect(capturedMoveUnit.idempotencyKey).toMatch(/^fp-expedition-unit-move-plot_hq12b_expedition_map_ui-expedition_unit_pathfinder_scout_v1-cell_origin-cell_q1_r0-/);
    const scoutUnit = expeditionMap.units.items.find((unit) => unit.unitId === capturedMoveUnit.unitId);
    const target = expeditionMap.cells.find((cell) => cell.cellId === capturedMoveUnit.targetCellId);
    expect(scoutUnit.location.cellId).toBe('cell_origin');
    expect(target.fogState).toBe('known');
    moveUnitReceipt = {
      moveId: 'expedition_unit_move_ui_001',
      plotId,
      unitId: scoutUnit.unitId,
      unitType: scoutUnit.unitType,
      sourceCellId: scoutUnit.location.cellId,
      targetCellId: target.cellId,
      receipt: {
        kind: 'expedition_unit_move_receipt',
        actionName: 'et.plot.move_expedition_unit',
        movementRevealsFog: false,
        resourceHarvesting: false,
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        backgroundScheduling: false,
        combat: false,
        publicSharing: false,
        generatedUniverseRendering: false,
        crossPlotMutation: false,
        atlasExecution: false,
        externalEffects: false,
      },
    };
    expeditionMap.units.byCellId.cell_origin = ['expedition_unit_rook_signalpost_messenger_v1'];
    expeditionMap.units.byCellId.cell_q1_r0 = [
      'expedition_unit_pathfinder_scout_v1',
      'expedition_unit_surveyor_site_plan_hq12b_forest',
      'expedition_unit_settler_convoy_claim_hq12b_arrived',
    ];
    scoutUnit.state = 'MOVED';
    scoutUnit.location = { cellId: target.cellId, q: target.q, r: target.r, fogState: target.fogState, source: 'expedition_unit_move_receipt' };
    scoutUnit.lastMove = {
      moveId: moveUnitReceipt.moveId,
      sourceCellId: 'cell_origin',
      targetCellId: target.cellId,
      readOnly: true,
    };
    scoutUnit.movement = { canMove: true, movementMutationImplemented: true, allowedTargetCellIds: ['cell_origin', 'cell_q1_r-1'], authority: 'server_owned_scout_unit_revealed_cell_move_receipt_v1', allowedFogStates: ['discovered', 'known'], revealsFog: false, routeCreation: false, resourceDelta: {} };
    scoutUnit.commandHints[0].targetCellIds = scoutUnit.movement.allowedTargetCellIds;
    expeditionMap.projectionHash = 'hq15f-move-unit-ui-proof';
    expeditionMap.receipt.projectionHash = 'hq15f-move-unit-ui-proof';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        worldDelta: [{ type: 'EXPEDITION_UNIT_MOVED', data: { move: moveUnitReceipt } }],
        error: null,
        state: makeState().state,
        stateHash: 'hq15f-move-unit-ui',
        move: moveUnitReceipt,
        movement: moveUnitReceipt,
        movedUnitId: scoutUnit.unitId,
        sourceCellId: 'cell_origin',
        targetCellId: target.cellId,
        alreadyMoved: false,
        proof: {
          actionName: 'et.plot.move_expedition_unit',
          unitId: scoutUnit.unitId,
          sourceCellId: 'cell_origin',
          targetCellId: target.cellId,
          fogCountsUnchanged: true,
          boundaryFlags: moveUnitReceipt.receipt,
        },
        expeditionMap,
      }),
    });
  });

  await page.route('**/api/founders-plot/expedition-map/scout-sector', async (route) => {
    capturedScoutSector = route.request().postDataJSON();
    expect(capturedScoutSector.plotId).toBe(plotId);
    expect(capturedScoutSector.cellId).toBe('cell_q0_r1');
    expect(capturedScoutSector.actor).toBe('HUMAN');
    expect(capturedScoutSector.idempotencyKey).toMatch(/^fp-scout-sector-plot_hq12b_expedition_map_ui-cell_q0_r1-/);
    expect(capturedScoutSector.unitId).toBeUndefined();
    expect(capturedScoutSector.movement).toBeUndefined();
    expect(capturedScoutSector.targetCellId).toBeUndefined();

    const target = expeditionMap.cells.find((cell) => cell.cellId === capturedScoutSector.cellId);
    expect(target.fogState).toBe('hinted');
    const beforeFogCounts = { ...expeditionMap.fog.counts };
    target.fogState = 'known';
    target.kind = 'scouted_sector';
    target.title = 'Scouted Frontier Sector';
    target.status = 'SCOUTED_SECTOR_KNOWN';
    target.sourceTruth = 'scout_sector_receipt';
    target.summary = 'Scout Sector receipt made this map-edge cell known without movement or harvesting.';
    target.recommendedNext = 'Use future bounded expedition packets for any follow-up; this panel only reveals map truth.';
    target.receipts = [
      ...(Array.isArray(target.receipts) ? target.receipts : []),
      {
        kind: 'scout_sector_known_cell',
        sourceIds: { scoutId: 'scout_sector_ui_001', adjacentCellId: 'cell_q1_r0' },
        readOnly: true,
      },
    ];
    expeditionMap.fog.counts = {
      ...expeditionMap.fog.counts,
      known: beforeFogCounts.known + 1,
      hinted: Math.max(0, beforeFogCounts.hinted - 1),
    };
    expeditionMap.projectionHash = 'hq12c-scout-sector-ui-proof';
    expeditionMap.receipt.projectionHash = 'hq12c-scout-sector-ui-proof';
    scoutSectorReceipt = {
      scoutId: 'scout_sector_ui_001',
      plotId,
      cellId: target.cellId,
      sourceCellId: 'cell_q1_r0',
      status: 'SCOUTED',
      actor: 'HUMAN',
      authorityBoundary: 'server_owned_scout_sector_current_plot_fog_receipt_v1',
      receipt: {
        samePlotOnly: true,
        serverOwnedDiscoveryReceipt: true,
        revealsExactlyOneSector: true,
        autonomousMovement: false,
        resourceHarvesting: false,
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        backgroundScheduling: false,
        combat: false,
        publicSharing: false,
        generatedUniverseRendering: false,
        crossPlotMutation: false,
        atlasExecution: false,
        externalEffects: false,
      },
    };
    hq12fEventPacket = {
      packetId: 'expedition_event_packet_hq12f_cell_q0_r1',
      kind: 'expedition_event_packet',
      templateId: 'ridge_lantern_packet_v1',
      scoutId: scoutSectorReceipt.scoutId,
      cellId: target.cellId,
      discoveryFlavor: 'Ridge Lantern packet',
      terrainExplanation: 'Lantern survey notes mark a sheltered ridge line, two wind breaks, and no harvestable claim in this packet.',
      riskExplanation: 'The risk stays observational: loose shale and fog pockets are noted for future planning, not acted on here.',
      operatorNote: 'Mira Trailmark files this as receipt-bound field color for later review.',
      readOnly: true,
      executableActions: [],
      authorityBoundary: 'server_owned_expedition_event_packet_read_model_v1',
      partyId: hq12lExpeditionParty.partyId,
      partySnapshot: {
        partyId: hq12lExpeditionParty.partyId,
        kind: 'expedition_party_snapshot',
        version: hq12lExpeditionParty.version,
        readOnly: true,
        executableActions: [],
        authorityBoundary: hq12lExpeditionParty.authorityBoundary,
        members: hq12lExpeditionParty.members,
        boundaryFlags: hq12lExpeditionParty.boundaryFlags,
      },
      receiptLink: {
        actionName: 'et.plot.scout_sector',
        scoutId: scoutSectorReceipt.scoutId,
        cellId: target.cellId,
        via: 'scout_sector_receipt',
      },
      boundaryFlags: {
        readModelOnly: true,
        receiptMetadataOnly: true,
        routeCreation: false,
        tradeRouteCreation: false,
        resourceHarvesting: false,
        resourceDelta: {},
        combat: false,
        backgroundScheduling: false,
        publicSharing: false,
        generatedUniverseRendering: false,
        atlasExecution: false,
        crossPlotMutation: false,
        externalEffects: false,
      },
      packetHash: 'hq12f-event-packet-ui-proof',
    };
    scoutSectorReceipt.receipt.eventPacketId = hq12fEventPacket.packetId;
    scoutSectorReceipt.eventPacket = hq12fEventPacket;
    target.eventPacket = hq12fEventPacket;
    target.receipts[target.receipts.length - 1].eventPacketId = hq12fEventPacket.packetId;
    target.receipts[target.receipts.length - 1].sourceIds.eventPacketId = hq12fEventPacket.packetId;
    expeditionMap.eventPackets = [hq12fEventPacket];
    expeditionMap.sourceSummary = {
      ...expeditionMap.sourceSummary,
      eventPacketIds: [hq12fEventPacket.packetId],
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        scoutSector: scoutSectorReceipt,
        sector: scoutSectorReceipt,
        eventPacket: hq12fEventPacket,
        revealedCellId: target.cellId,
        alreadyScouted: false,
        proof: {
          cellId: target.cellId,
          targetBeforeFogState: 'hinted',
          targetAfterFogState: 'known',
          beforeFogCounts,
          afterFogCounts: expeditionMap.fog.counts,
          boundaryFlags: scoutSectorReceipt.receipt,
        },
        expeditionMap,
      }),
    });
  });

  await page.goto('/founders-plot');
  const panel = page.getByTestId('fp-expedition-map-panel');
  await expect(panel).toBeVisible();
  await expect(page.getByTestId('fp-expedition-map-status')).toHaveAttribute('data-status', 'FOG_READ_MODEL_READY');
  await expect(page.getByTestId('fp-expedition-map-status')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-map-status-symbols')).toContainText('SRV');
  await expect(page.getByTestId('fp-expedition-map-metrics')).toContainText('2');
  await expect(page.getByTestId('fp-expedition-map-boundary')).toContainText('No autonomous movement');
  await expect(page.getByTestId('fp-expedition-map-boundary')).toContainText('Atlas execution');
  await expect(page.getByTestId('fp-expedition-cell-cell_q0_r1')).toHaveAttribute('data-fog-state', 'hinted');
  await expect(page.getByTestId('fp-expedition-cell-cell_q3_r0')).toHaveAttribute('data-fog-state', 'locked_unknown');
  await expect(page.getByTestId('fp-expedition-sector-cell_q1_r0')).toContainText('Forest Ridge Survey Site Plan');
  await expect(page.getByTestId('fp-expedition-sector-cell_q1_r0')).toContainText('terrain forest edge');
  await expect(page.getByTestId('fp-expedition-sector-cell_q1_r0')).toContainText('risk low');
  await expect(page.getByTestId('fp-expedition-sector-cell_q1_r0')).toContainText('resources wood +2, food +1');
  await expect(page.getByTestId('fp-expedition-receipts-cell_q1_r0')).toContainText('reviewed site plan known cell');
  await expect(page.getByTestId('fp-expedition-sector-cell_q1_r-1')).toContainText('Owned outpost: plot_hq12b_forest_outpost');
  await expect(page.getByTestId('fp-expedition-inspector-scout-aliases')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q0_r1')).toHaveCount(1);
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q0_r1')).not.toBeVisible();
  await expect(page.getByTestId('fp-expedition-map-visual-hud')).toHaveAttribute('data-fog-state', 'hinted');
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('data-scoutable', 'true');
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toHaveAttribute('aria-label', /Scout Sector eligible/);
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).toContainText('HINT');
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).not.toContainText('Scout unit command ready');
  await expect(page.getByTestId('fp-expedition-map-selected-summary')).not.toContainText('cell_q0_r1');
  await expect(page.getByTestId('fp-expedition-fog-pips').locator('.fp-expedition-fog-pip')).toHaveCount(4);
  await expect(page.getByTestId('fp-expedition-receipt-trace-map-selected')).toHaveAttribute('aria-label', /Provenance sealed/);
  await expect(page.getByTestId('fp-expedition-receipt-trace-map-selected')).not.toContainText('Provenance sealed');
  await expect(page.getByTestId('fp-expedition-party-badges-map-selected')).toContainText('MT');
  await expect(page.getByTestId('fp-expedition-party-badges-map-selected')).toHaveAttribute('aria-label', /party member/);
  await expect(page.getByTestId('fp-expedition-party-badges-map-selected')).not.toContainText('HQ civic operator');
  await expect(page.getByTestId('fp-expedition-unit-roster')).toContainText('Map units');
  await expect(page.getByTestId('fp-expedition-unit-roster')).toHaveAttribute('data-movement-mutation', 'true');
  await expect(page.getByTestId('fp-expedition-unit-token-expedition_unit_pathfinder_scout_v1')).toHaveAttribute('data-movement-mutation', 'true');
  await expect(page.getByTestId('fp-expedition-unit-token-expedition_unit_surveyor_site_plan_hq12b_forest')).toHaveAttribute('aria-label', /Surveyor Crew/);
  await expect(page.getByTestId('fp-expedition-unit-token-expedition_unit_surveyor_site_plan_hq12b_forest')).toHaveAttribute('data-movement-mutation', 'false');
  await expect(page.getByTestId('fp-btn-move-expedition-unit-expedition_unit_pathfinder_scout_v1-cell_q1_r0')).toBeVisible();
  await expect(page.getByTestId('fp-btn-move-expedition-unit-expedition_unit_pathfinder_scout_v1-cell_q1_r0')).toHaveAttribute('data-command-id', 'move_unit');
  await expect(page.getByTestId('fp-btn-move-expedition-unit-expedition_unit_pathfinder_scout_v1-cell_q1_r0')).toHaveAttribute('data-cell-id', 'cell_q1_r0');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toContainText('Scout');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', 'expedition_unit_pathfinder_scout_v1');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-actions', '2');
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toBeVisible();
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toHaveAttribute('data-unit-id', 'expedition_unit_pathfinder_scout_v1');
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toHaveAttribute('data-cell-id', 'cell_q0_r1');
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toHaveAttribute('data-command-id', 'scout_sector');
  await expect(page.getByTestId('fp-expedition-unit-command-target')).toHaveAttribute('data-cell-id', 'cell_q0_r1');
  await expect(page.getByTestId('fp-expedition-unit-command-target')).toContainText('HINT');
  await expect(page.getByTestId('fp-expedition-unit-command-target')).not.toContainText('cell_q0_r1');
  await expect(page.getByTestId('fp-expedition-unit-command-move-preview')).toHaveAttribute('data-count', '1');
  await expect(page.getByTestId('fp-expedition-unit-command-move-preview')).toContainText('1 ↦');
  await expect(page.getByTestId('fp-expedition-unit-movement-boundary')).toContainText('SRV');
  await expect(page.getByTestId('fp-expedition-unit-movement-boundary')).toHaveAttribute('aria-label', 'Server movement active');
  await page.getByTestId('fp-btn-move-expedition-unit-expedition_unit_pathfinder_scout_v1-cell_q1_r0').click();
  await expect.poll(() => capturedMoveUnit?.targetCellId || '').toBe('cell_q1_r0');
  await expect(page.getByTestId('fp-expedition-unit-token-expedition_unit_pathfinder_scout_v1')).toHaveAttribute('data-cell-id', 'cell_q1_r0');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).not.toContainText('Move cell_origin');
  await expect(page.getByTestId('fp-expedition-unit-movement-boundary')).toContainText('SRV');
  await page.getByTestId('fp-expedition-unit-token-expedition_unit_rook_signalpost_messenger_v1').click();
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', 'expedition_unit_rook_signalpost_messenger_v1');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-actions', '0');
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toHaveCount(0);
  await page.getByTestId('fp-expedition-unit-token-expedition_unit_surveyor_site_plan_hq12b_forest').click();
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', 'expedition_unit_surveyor_site_plan_hq12b_forest');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toContainText('Inspect');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toContainText('Convoy');
  await expect(page.getByTestId('fp-btn-prepare-settler-convoy-unit-command-site_plan_hq12b_forest')).toHaveAttribute('data-plan-id', 'site_plan_hq12b_forest');
  await expect(page.getByTestId('fp-btn-prepare-settler-convoy-unit-command-site_plan_hq12b_forest')).toHaveAttribute('data-unit-id', 'expedition_unit_surveyor_site_plan_hq12b_forest');
  await expect(page.getByTestId('fp-btn-prepare-settler-convoy-unit-command-site_plan_hq12b_forest')).toHaveAttribute('data-command-id', 'prepare_settler_convoy');
  await page.getByTestId('fp-btn-prepare-settler-convoy-unit-command-site_plan_hq12b_forest').click();
  await expect.poll(() => capturedPrepareFromUnit?.sitePlanId || '').toBe('site_plan_hq12b_forest');
  await expect(page.getByTestId('fp-expedition-unit-command-move-preview')).toHaveAttribute('aria-label', 'Move locked');
  await page.getByTestId('fp-expedition-unit-token-expedition_unit_settler_convoy_claim_hq12b_arrived').click();
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toHaveAttribute('data-unit-id', 'expedition_unit_settler_convoy_claim_hq12b_arrived');
  await expect(page.getByTestId('fp-expedition-unit-command-bar')).toContainText('Found');
  await expect(page.getByTestId('fp-btn-found-settlement-unit-command-claim_hq12b_arrived')).toHaveAttribute('data-claim-id', 'claim_hq12b_arrived');
  await expect(page.getByTestId('fp-btn-found-settlement-unit-command-claim_hq12b_arrived')).toHaveAttribute('data-unit-id', 'expedition_unit_settler_convoy_claim_hq12b_arrived');
  await expect(page.getByTestId('fp-btn-found-settlement-unit-command-claim_hq12b_arrived')).toHaveAttribute('data-command-id', 'found_settlement');
  await page.getByTestId('fp-btn-found-settlement-unit-command-claim_hq12b_arrived').click();
  await expect.poll(() => capturedFoundFromUnit?.claimId || '').toBe('claim_hq12b_arrived');
  await expect(page.getByTestId('fp-expedition-unit-command-move-preview')).toHaveAttribute('aria-label', 'Move locked');
  await page.getByTestId('fp-expedition-unit-token-expedition_unit_pathfinder_scout_v1').click();
  await expect(page.getByTestId('fp-expedition-map-visual-hud')).toHaveAttribute('data-selected-cell-id', 'cell_q0_r1');
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-map-hud')).toHaveAttribute('data-drawer', 'visual-inspector');
  await expect(page.getByTestId('fp-expedition-inspector-chrome')).toHaveAttribute('aria-label', /Visual inspector/);
  await expect(page.getByTestId('fp-expedition-inspector-chips')).toContainText('SRV');
  await expect(page.getByTestId('fp-expedition-inspector-fog-ledger')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('fp-expedition-inspector-scout-aliases')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('fp-expedition-inspector-ledger')).not.toHaveAttribute('open', '');
  await expect(page.getByTestId('fp-expedition-sector-cell_q1_r0').locator('button')).toHaveCount(0);
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q1_r0')).toHaveCount(0);
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q3_r0')).toHaveCount(0);

  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await panel.screenshot({ path: 'reports/agent-town-hq12b-expedition-map-ui-desktop-2026-05-31.png' });
  await panel.screenshot({ path: 'reports/agent-town-hq12o-expedition-sector-art-readability-desktop-2026-06-01.png' });
  await panel.screenshot({ path: 'reports/agent-town-hq14d-map-first-ui-playability-slice-desktop-2026-06-01.png' });
  await panel.screenshot({ path: 'reports/agent-town-hq15c-scout-unit-command-flow-desktop-2026-06-02.png' });
  await panel.screenshot({ path: 'reports/agent-town-hq15l-command-target-playtest-desktop-2026-06-02.png' });
  await panel.screenshot({ path: 'reports/agent-town-hq15m-inspector-ledger-text-compaction-desktop-2026-06-02.png' });
  await panel.screenshot({ path: 'reports/agent-town-hq15s-fog-selected-inspector-symbol-compaction-desktop-2026-06-02.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-cell-cell_q3_r0')).toHaveAttribute('data-fog-state', 'locked_unknown');
  const mobileLayout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    commandBarVisibility: (() => {
      const roster = document.querySelector('[data-testid="fp-expedition-unit-roster"]');
      const commandBar = document.querySelector('[data-testid="fp-expedition-unit-command-bar"]');
      const rosterRect = roster?.getBoundingClientRect();
      const commandRect = commandBar?.getBoundingClientRect();
      const commandItems = Array.from(commandBar?.querySelectorAll('button, small, span') || []).map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          text: node.textContent || '',
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
      const clippedItems = commandItems.filter((entry) => (
        rosterRect
          && entry.height > 0
          && (entry.top < rosterRect.top - 1 || entry.bottom > rosterRect.bottom + 1)
      ));
      return {
        roster: rosterRect ? {
          top: Math.round(rosterRect.top),
          bottom: Math.round(rosterRect.bottom),
          height: Math.round(rosterRect.height),
        } : null,
        commandBar: commandRect ? {
          top: Math.round(commandRect.top),
          bottom: Math.round(commandRect.bottom),
          height: Math.round(commandRect.height),
        } : null,
        commandItems,
        clippedItems,
      };
    })(),
    clipped: Array.from(document.querySelectorAll([
      '.fp-expedition-map-card',
      '.fp-expedition-sector-card',
      '.fp-expedition-map-board',
      '.fp-expedition-map-metrics',
      '.fp-expedition-sector-receipts',
      '.fp-expedition-map-visual-hud',
      '.fp-expedition-map-selected-summary',
      '.fp-expedition-fog-pips',
      '.fp-expedition-receipt-trace',
      '.fp-expedition-party-badges',
      '.fp-expedition-unit-roster',
      '.fp-expedition-unit-rail',
      '.fp-expedition-unit-command-bar',
    ].join(','))).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        testid: node.getAttribute('data-testid') || node.className,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      };
    }).filter((entry) => entry.width > 0 && (entry.left < -1 || entry.right > document.documentElement.clientWidth + 1)),
  }));
  expect(mobileLayout.documentScrollWidth).toBeLessThanOrEqual(mobileLayout.viewport + 1);
  expect(mobileLayout.bodyScrollWidth).toBeLessThanOrEqual(mobileLayout.viewport + 1);
  expect(mobileLayout.clipped).toEqual([]);
  expect(mobileLayout.commandBarVisibility.commandBar.height).toBeGreaterThan(0);
  expect(mobileLayout.commandBarVisibility.commandItems.map((entry) => entry.text).join(' ')).toContain('Scout');
  expect(mobileLayout.commandBarVisibility.commandItems.map((entry) => entry.text).join(' ')).toContain('HINT');
  expect(mobileLayout.commandBarVisibility.commandItems.map((entry) => entry.text).join(' ')).not.toContain('cell_q0_r1');
  expect(mobileLayout.commandBarVisibility.clippedItems).toEqual([]);
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12b-expedition-map-ui-mobile-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12o-expedition-sector-art-readability-mobile-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq14d-map-first-ui-playability-slice-mobile-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq15c-scout-unit-command-flow-mobile-2026-06-02.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq15l-command-target-playtest-mobile-2026-06-02.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq15m-inspector-ledger-text-compaction-mobile-2026-06-02.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq15s-fog-selected-inspector-symbol-compaction-mobile-2026-06-02.png' });

  const domProof = await page.evaluate(() => ({
    panelVisible: !!document.querySelector('[data-testid="fp-expedition-map-panel"]'),
    mapFirstHud: {
      visible: !!document.querySelector('[data-testid="fp-expedition-map-visual-hud"]'),
      selectedCellId: document.querySelector('[data-testid="fp-expedition-map-visual-hud"]')?.getAttribute('data-selected-cell-id') || '',
      fogState: document.querySelector('[data-testid="fp-expedition-map-visual-hud"]')?.getAttribute('data-fog-state') || '',
      scoutable: document.querySelector('[data-testid="fp-expedition-map-visual-hud"]')?.getAttribute('data-scoutable') || '',
      selectedSummaryText: document.querySelector('[data-testid="fp-expedition-map-selected-summary"]')?.textContent || '',
      selectedSummaryLabel: document.querySelector('[data-testid="fp-expedition-map-selected-summary"]')?.getAttribute('aria-label') || '',
      receiptTraceText: document.querySelector('[data-testid="fp-expedition-receipt-trace-map-selected"]')?.textContent || '',
      receiptTraceLabel: document.querySelector('[data-testid="fp-expedition-receipt-trace-map-selected"]')?.getAttribute('aria-label') || '',
      partyBadgesText: document.querySelector('[data-testid="fp-expedition-party-badges-map-selected"]')?.textContent || '',
      partyBadgesLabel: document.querySelector('[data-testid="fp-expedition-party-badges-map-selected"]')?.getAttribute('aria-label') || '',
      fogPipCount: document.querySelectorAll('[data-testid="fp-expedition-fog-pips"] .fp-expedition-fog-pip').length,
      fogPipTexts: Array.from(document.querySelectorAll('[data-testid="fp-expedition-fog-pips"] .fp-expedition-fog-pip')).map((node) => node.textContent || ''),
      fogPipLabels: Array.from(document.querySelectorAll('[data-testid="fp-expedition-fog-pips"] .fp-expedition-fog-pip')).map((node) => node.getAttribute('aria-label') || ''),
    },
    cells: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-cell-"]')).map((node) => ({
      testid: node.getAttribute('data-testid'),
      fogState: node.getAttribute('data-fog-state'),
      status: node.getAttribute('data-status'),
      text: node.textContent || '',
    })),
    legendStates: Array.from(document.querySelectorAll('.fp-expedition-fog-legend__item')).map((node) => ({
      className: node.className,
      selected: node.getAttribute('data-selected'),
      text: node.textContent || '',
    })),
    selectedSector: {
      fogState: document.querySelector('[data-testid="fp-expedition-selected-sector"]')?.getAttribute('data-fog-state') || '',
      cellId: document.querySelector('[data-testid="fp-expedition-selected-sector"]')?.getAttribute('data-cell-id') || '',
      buttons: document.querySelectorAll('[data-testid="fp-expedition-selected-sector"] button').length,
      text: document.querySelector('[data-testid="fp-expedition-selected-sector"]')?.textContent || '',
    },
    hiddenSummaryText: document.querySelector('[data-testid="fp-expedition-map-hidden-summary"]')?.textContent || '',
    inspectorCompaction: {
      fogLedgerCollapsed: !document.querySelector('[data-testid="fp-expedition-inspector-fog-ledger"]')?.hasAttribute('open'),
      fogLedgerActions: Number(document.querySelector('[data-testid="fp-expedition-inspector-fog-ledger"]')?.getAttribute('data-actions') || 0),
      scoutAliasesCollapsed: !document.querySelector('[data-testid="fp-expedition-inspector-scout-aliases"]')?.hasAttribute('open'),
      scoutAliasButtonCount: document.querySelectorAll('[data-testid="fp-expedition-inspector-scout-aliases"] [data-testid^="fp-btn-scout-sector-"]').length,
      visibleScoutAliasButtonCount: Array.from(document.querySelectorAll('[data-testid="fp-expedition-inspector-scout-aliases"] [data-testid^="fp-btn-scout-sector-"]'))
        .filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
        }).length,
    },
    sectorCards: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-sector-"]')).map((node) => ({
      testid: node.getAttribute('data-testid'),
      fogState: node.getAttribute('data-fog-state') || '',
      cellId: node.getAttribute('data-cell-id') || '',
      buttons: node.querySelectorAll('button').length,
      text: node.textContent || '',
      borderLeftColor: getComputedStyle(node).borderLeftColor,
    })),
    visualStateStyles: Array.from(document.querySelectorAll([
      '.fp-expedition-cell--discovered',
      '.fp-expedition-cell--known',
      '.fp-expedition-cell--hinted',
      '.fp-expedition-cell--locked_unknown',
    ].join(','))).map((node) => ({
      fogState: node.getAttribute('data-fog-state'),
      backgroundImage: getComputedStyle(node).backgroundImage,
      borderStyle: getComputedStyle(node).borderStyle,
    })),
    mapControlButtons: Array.from(document.querySelectorAll('[data-testid="fp-expedition-map-controls"] button')).map((node) => ({
      label: node.getAttribute('aria-label'),
      text: node.textContent,
    })),
    units: {
      rosterText: document.querySelector('[data-testid="fp-expedition-unit-roster"]')?.textContent || '',
      tokenCount: document.querySelectorAll('[data-testid^="fp-expedition-unit-token-"]').length,
      tokenTypes: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-unit-token-"]')).map((node) => node.getAttribute('data-unit-type')),
      tokenLabels: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-unit-token-"]')).map((node) => node.getAttribute('aria-label') || ''),
      selectedToken: document.querySelector('[data-testid^="fp-expedition-unit-token-"][aria-pressed="true"]')?.getAttribute('data-unit-type') || '',
      movementMutationValues: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-unit-token-"]')).map((node) => node.getAttribute('data-movement-mutation')),
      commandText: document.querySelector('[data-testid="fp-expedition-unit-command-bar"]')?.textContent || '',
      commandMutationValues: Array.from(document.querySelectorAll('[data-testid="fp-expedition-unit-command-bar"] [data-command-id]')).map((node) => node.getAttribute('data-server-mutation-implemented')),
      moveButtonText: document.querySelector('[data-testid^="fp-btn-move-expedition-unit-expedition_unit_pathfinder_scout_v1-"]')?.textContent || '',
      moveButtonTargetCellId: document.querySelector('[data-testid^="fp-btn-move-expedition-unit-expedition_unit_pathfinder_scout_v1-"]')?.getAttribute('data-cell-id') || '',
      moveTargetText: document.querySelector('[data-testid="fp-expedition-unit-move-target"]')?.textContent || '',
      movePreviewCount: document.querySelector('[data-testid="fp-expedition-unit-command-move-preview"]')?.getAttribute('data-count') || '',
      movementBoundaryText: document.querySelector('[data-testid="fp-expedition-unit-movement-boundary"]')?.textContent || '',
      movementBoundaryLabel: document.querySelector('[data-testid="fp-expedition-unit-movement-boundary"]')?.getAttribute('aria-label') || '',
      primaryScoutButtonText: document.querySelector('[data-testid="fp-btn-scout-sector-unit-command-cell_q0_r1"]')?.textContent || '',
      primaryScoutButtonUnitId: document.querySelector('[data-testid="fp-btn-scout-sector-unit-command-cell_q0_r1"]')?.getAttribute('data-unit-id') || '',
      primaryScoutButtonTargetCellId: document.querySelector('[data-testid="fp-btn-scout-sector-unit-command-cell_q0_r1"]')?.getAttribute('data-cell-id') || '',
      commandTargetText: document.querySelector('[data-testid="fp-expedition-unit-command-target"]')?.textContent || '',
      commandTargetCellId: document.querySelector('[data-testid="fp-expedition-unit-command-target"]')?.getAttribute('data-cell-id') || '',
    },
    mutationButtons: Array.from(document.querySelectorAll('[data-testid="fp-expedition-map-panel"] button'))
      .filter((node) => String(node.getAttribute('data-testid') || '').startsWith('fp-btn-scout-sector-'))
      .map((node) => ({
      testid: node.getAttribute('data-testid'),
      cellId: node.getAttribute('data-cell-id'),
    })),
  }));
  expect(domProof.cells.map((entry) => entry.fogState).sort()).toEqual(['discovered', 'discovered', 'hinted', 'known', 'locked_unknown']);
  expect(domProof.legendStates).toHaveLength(4);
  expect(domProof.selectedSector.fogState).toBe('hinted');
  expect(domProof.selectedSector.buttons).toBe(0);
  expect(domProof.selectedSector.text).toContain('Resources and hidden gameplay truth remain unrevealed');
  expect(domProof.selectedSector.text).not.toMatch(/resources wood|wood \+2|food \+1|receipt scout_sector_ui_001|owned outpost: plot_hq12b_forest_outpost/i);
  expect(domProof.hiddenSummaryText).not.toMatch(/wood \+2|food \+1|route|receipt scout_sector_ui_001/i);
  expect(domProof.inspectorCompaction.fogLedgerCollapsed).toBe(true);
  expect(domProof.inspectorCompaction.fogLedgerActions).toBe(0);
  expect(domProof.inspectorCompaction.scoutAliasesCollapsed).toBe(true);
  expect(domProof.inspectorCompaction.scoutAliasButtonCount).toBe(1);
  expect(domProof.inspectorCompaction.visibleScoutAliasButtonCount).toBe(0);
  expect(domProof.visualStateStyles).toHaveLength(5);
  expect(domProof.mapFirstHud.visible).toBe(true);
  expect(domProof.mapFirstHud.selectedCellId).toBe('cell_q0_r1');
  expect(domProof.mapFirstHud.fogState).toBe('hinted');
  expect(domProof.mapFirstHud.scoutable).toBe('true');
  expect(domProof.mapFirstHud.selectedSummaryLabel).toContain('Scout Sector eligible');
  expect(domProof.mapFirstHud.selectedSummaryText).toContain('HINT');
  expect(domProof.mapFirstHud.selectedSummaryText).not.toMatch(/Scout unit command ready|Scout Sector eligible|fog hinted|cell_q0_r1|Provenance sealed/i);
  expect(domProof.mapFirstHud.selectedSummaryText).not.toMatch(/wood \+2|food \+1|owned outpost: plot_hq12b_forest_outpost/i);
  expect(domProof.mapFirstHud.receiptTraceLabel).toContain('Provenance sealed');
  expect(domProof.mapFirstHud.receiptTraceText).not.toContain('Provenance sealed');
  expect(domProof.mapFirstHud.partyBadgesText).toContain('MT');
  expect(domProof.mapFirstHud.partyBadgesText).not.toContain('HQ civic operator');
  expect(domProof.mapFirstHud.fogPipTexts.join(' ')).not.toMatch(/DISCOVERED|HINTED|LOCKED/);
  expect(domProof.mapFirstHud.fogPipLabels.join(' ')).toContain('Discovered');
  expect(domProof.mapFirstHud.fogPipCount).toBe(4);
  expect(domProof.mapControlButtons).toHaveLength(3);
  expect(domProof.units.tokenCount).toBe(5);
  expect(domProof.units.tokenTypes).toContain('surveyor');
  expect(domProof.units.tokenTypes).toContain('settler_convoy');
  expect(domProof.units.rosterText).not.toContain('cell_q0_r1');
  expect(domProof.units.tokenLabels.join(' ')).toContain('Surveyor Crew');
  expect(domProof.units.tokenLabels.join(' ')).toContain('Settler Convoy');
  expect(domProof.units.selectedToken).toBe('scout');
  expect(domProof.units.movementMutationValues).toContain('true');
  expect(domProof.units.commandText).toContain('Scout');
  expect(domProof.units.commandText).toMatch(/\d+ ↦/);
  expect(domProof.units.commandText).toContain('SRV');
  expect(domProof.units.commandText).not.toMatch(/Target cell_|Move cell_|server movement active|move targets?/i);
  expect(domProof.units.moveButtonText).toContain('Move');
  expect(['cell_origin', 'cell_q1_r-1']).toContain(domProof.units.moveButtonTargetCellId);
  expect(domProof.units.moveTargetText).toMatch(/↦/);
  expect(Number(domProof.units.movePreviewCount)).toBeGreaterThan(0);
  expect(domProof.units.movementBoundaryText).toContain('SRV');
  expect(domProof.units.movementBoundaryLabel).toBe('Server movement active');
  expect(domProof.units.primaryScoutButtonText).toContain('Scout');
  expect(domProof.units.primaryScoutButtonUnitId).toBe('expedition_unit_pathfinder_scout_v1');
  expect(domProof.units.primaryScoutButtonTargetCellId).toBe('cell_q0_r1');
  expect(domProof.units.commandTargetText).toContain('HINT');
  expect(domProof.units.commandTargetText).not.toContain('cell_q0_r1');
  expect(domProof.units.commandTargetCellId).toBe('cell_q0_r1');
  expect(domProof.units.commandMutationValues).toContain('true');
  fs.writeFileSync('reports/agent-town-hq12b-expedition-map-ui-proof-2026-05-31.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'mocked Playwright state carrying the HQ12A server read-model shape; UI renders only expeditionMap fields',
    projectionHash: expeditionMap.projectionHash,
    status: expeditionMap.status,
    counts: expeditionMap.fog.counts,
    mobileLayout,
    domProof,
    screenshots: [
      'reports/agent-town-hq12b-expedition-map-ui-desktop-2026-05-31.png',
      'reports/agent-town-hq12b-expedition-map-ui-mobile-2026-05-31.png',
    ],
    guardrails: {
      mutationButtons: domProof.mutationButtons.length,
      scoutSectorButtons: domProof.mutationButtons.filter((entry) => String(entry.testid || '').startsWith('fp-btn-scout-sector-')),
      knownLockedScoutButtons: domProof.mutationButtons.filter((entry) => ['cell_q1_r0', 'cell_q3_r0'].includes(entry.cellId)),
      executableActions: expeditionMap.executableActions,
      readOnly: expeditionMap.readOnly,
      routeCreation: expeditionMap.receipt.routeCreation,
      atlasExecution: expeditionMap.receipt.atlasExecution,
    },
  }, null, 2));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1').click();
  await expect(page.getByTestId('fp-scout-sector-result')).toContainText('cell_q0_r1 moved from hinted to known');
  await expect(page.getByTestId('fp-expedition-cell-cell_q0_r1')).toHaveAttribute('data-fog-state', 'known');
  await expect(page.getByTestId('fp-expedition-sector-cell_q0_r1')).toContainText('Scouted Frontier Sector');
  await expect(page.getByTestId('fp-expedition-sector-packet-cell_q0_r1')).toContainText('Ridge Lantern packet');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Ridge Lantern packet');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Receipt-linked packet - expedition_event_packet_hq12f_cell_q0_r1');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Map evidence packet');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Selected-sector map evidence only');
  await expect(page.getByTestId('fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('type ridge lantern packet v1');
  await expect(page.getByTestId('fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('source scout sector');
  await expect(page.getByTestId('fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('receipt scout_sector_ui_001');
  await expect(page.getByTestId('fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('zero executable actions');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Mira Trailmark field party');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Vale-Desk 7');
  await expect(page.getByTestId('fp-expedition-party-roster-packet-cell_q0_r1')).toContainText('Mira Trailmark');
  await expect(page.getByTestId('fp-expedition-party-roster-packet-cell_q0_r1')).toContainText('scout');
  await expect(page.getByTestId('fp-expedition-party-roster-packet-cell_q0_r1')).toContainText('Rook Signalpost');
  await expect(page.getByTestId('fp-expedition-party-roster-packet-cell_q0_r1')).toContainText('messenger');
  await expect(page.getByTestId('fp-expedition-party-roster-packet-cell_q0_r1')).toContainText('HQ civic operator');
  await expect(page.getByTestId('fp-expedition-party-packet-cell_q0_r1')).toHaveAttribute('data-actions', '0');
  await expect(page.getByTestId('fp-expedition-party-packet-cell_q0_r1')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('data-read-only', 'true');
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('data-actions', '0');
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('data-mode', 'packet');
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('aria-label', /Review the latest packet/);
  await expect(page.getByTestId('fp-expedition-objective-strip').locator('.fp-expedition-objective-strip__copy')).toContainText('PKT');
  await expect(page.getByTestId('fp-expedition-objective-strip-boundary')).toContainText('No new server objectives');
  await expect(page.getByTestId('fp-expedition-event-packet-facts-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('Read-only');
  await expect(page.getByTestId('fp-expedition-event-packet-facts-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('true');
  await expect(page.getByTestId('fp-expedition-event-packet-facts-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('Actions');
  await expect(page.getByTestId('fp-expedition-event-packet-facts-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('0');
  await expect(page.getByTestId('fp-expedition-event-packet-boundary-cell_q0_r1')).toContainText('No packet actions');
  await expect(page.getByTestId('fp-expedition-event-packet-boundary-cell_q0_r1')).toContainText('Atlas execution');
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q0_r1')).toHaveCount(0);
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toHaveCount(0);
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q1_r0')).toHaveCount(0);
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q3_r0')).toHaveCount(0);
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await expect.poll(async () => {
    const info = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
    return info?.visualLayers?.generatedSpriteAssetsReady || 0;
  }, { timeout: 8000 }).toBeGreaterThanOrEqual(8);
  const initialRendererInfo = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
  expect(initialRendererInfo.visualLayers.commandTargetRings).toBe(true);
  expect(initialRendererInfo.visualLayers.commandTargetCount).toBeGreaterThanOrEqual(1);
  expect(initialRendererInfo.visualLayers.commandTargetRingsVisualOnly).toBe(true);
  expect(initialRendererInfo.visualLayers.commandTargetRingsReadOnly).toBe(true);
  expect(initialRendererInfo.visualLayers.commandTargetRingAuthority).toBe(false);
  expect(initialRendererInfo.commandTargets.every((target) => target.visualOnly && target.readOnly)).toBe(true);
  expect(initialRendererInfo.commandTargets.every((target) => target.executableActions === 0 && target.routeAuthority === false && target.actionAuthority === false)).toBe(true);
  expect(initialRendererInfo.commandTargets.every((target) => ['known', 'discovered', 'hinted'].includes(target.fogState))).toBe(true);
  if (initialRendererInfo.commandTargets.some((target) => target.commandId === 'scout_sector')) {
    expect(initialRendererInfo.commandTargets.find((target) => target.commandId === 'scout_sector')).toMatchObject({
      cellId: 'cell_q0_r1',
      fogState: 'hinted',
      executableActions: 0,
      routeAuthority: false,
      actionAuthority: false,
    });
  }
  expect(initialRendererInfo.commandTargets.find((target) => target.commandId === 'move_unit')).toMatchObject({
    executableActions: 0,
    routeAuthority: false,
    actionAuthority: false,
  });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12f-expedition-event-packets-ui-desktop-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12c-scout-sector-ui-desktop-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12g-expedition-party-flavor-ui-desktop-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12h-expedition-map-mobile-polish-desktop-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12k-expedition-event-packet-visual-polish-desktop-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12l-expedition-party-visual-polish-desktop-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12n-expedition-objective-strip-desktop-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq14g-visual-inspector-drawer-desktop-2026-06-01.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-expedition-map-panel')).toBeVisible();
  await expect(page.getByTestId('fp-expedition-cell-cell_q0_r1')).toHaveAttribute('data-fog-state', 'known');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Ridge Lantern packet');
  await expect(page.getByTestId('fp-expedition-event-packet-cell_q0_r1')).toContainText('Selected-sector map evidence only');
  await expect(page.getByTestId('fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1')).toContainText('zero executable actions');
  await expect(page.getByTestId('fp-expedition-party-packet-cell_q0_r1')).toContainText('Mira Trailmark field party');
  await expect(page.getByTestId('fp-expedition-party-roster-packet-cell_q0_r1')).toContainText('Rook Signalpost');
  await expect(page.getByTestId('fp-expedition-event-packet-boundary-cell_q0_r1')).toContainText('Read-only receipt metadata');
  await expect(page.getByTestId('fp-expedition-objective-strip')).toHaveAttribute('aria-label', /Review the latest packet/);
  await expect(page.getByTestId('fp-expedition-objective-strip-boundary')).toContainText('No new server objectives');
  await expect(page.getByTestId('fp-btn-scout-sector-cell_q0_r1')).toHaveCount(0);
  await expect(page.getByTestId('fp-btn-scout-sector-unit-command-cell_q0_r1')).toHaveCount(0);
  await page.locator('#fp-drawer-toggle').evaluate((node) => { node.style.display = 'none'; });
  await expect.poll(async () => {
    const info = await page.evaluate(() => window.__foundersPlotTest.getExpeditionMapInfo());
    return info?.visualLayers?.generatedSpriteAssetsReady || 0;
  }, { timeout: 8000 }).toBeGreaterThanOrEqual(8);
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12f-expedition-event-packets-ui-mobile-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12c-scout-sector-ui-mobile-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12g-expedition-party-flavor-ui-mobile-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12h-expedition-map-mobile-polish-mobile-2026-05-31.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12k-expedition-event-packet-visual-polish-mobile-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12l-expedition-party-visual-polish-mobile-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq12n-expedition-objective-strip-mobile-2026-06-01.png' });
  await page.getByTestId('fp-expedition-map-panel').screenshot({ path: 'reports/agent-town-hq14g-visual-inspector-drawer-mobile-2026-06-01.png' });

  const scoutDomProof = await page.evaluate(() => ({
    panelVisible: !!document.querySelector('[data-testid="fp-expedition-map-panel"]'),
    scoutReceiptVisible: !!document.querySelector('[data-testid="fp-scout-sector-result"]'),
    targetFogState: document.querySelector('[data-testid="fp-expedition-cell-cell_q0_r1"]')?.getAttribute('data-fog-state'),
    inspectorDrawer: (() => {
      const drawer = document.querySelector('[data-testid="fp-expedition-map-hud"]');
      const board = document.querySelector('[data-testid="fp-expedition-map-board-card"]');
      const chrome = document.querySelector('[data-testid="fp-expedition-inspector-chrome"]');
      const ledger = document.querySelector('[data-testid="fp-expedition-inspector-ledger"]');
      const selectedDetails = document.querySelector('[data-testid="fp-expedition-inspector-selected-details"]');
      const fogLedger = document.querySelector('[data-testid="fp-expedition-inspector-fog-ledger"]');
      const scoutAliases = document.querySelector('[data-testid="fp-expedition-inspector-scout-aliases"]');
      const rect = drawer?.getBoundingClientRect();
      return {
        visible: !!drawer,
        drawerKind: drawer?.getAttribute('data-drawer') || '',
        readOnly: drawer?.getAttribute('data-read-only') || '',
        actions: drawer ? drawer.querySelectorAll('button').length : 0,
        chromeText: chrome?.textContent || '',
        chromeLabel: chrome?.getAttribute('aria-label') || '',
        chipsText: document.querySelector('[data-testid="fp-expedition-inspector-chips"]')?.textContent || '',
        containsStatus: !!drawer?.querySelector('[data-testid="fp-expedition-map-status"]'),
        containsObjective: !!drawer?.querySelector('[data-testid="fp-expedition-objective-strip"]'),
        containsSelectedSector: !!drawer?.querySelector('[data-testid="fp-expedition-selected-sector"]'),
        containsEventPacket: !!drawer?.querySelector('[data-testid="fp-expedition-event-packet-cell_q0_r1"]'),
        containsSectorLedger: !!drawer?.querySelector('[data-testid="fp-expedition-sector-list"]'),
        selectedDetailsCollapsed: selectedDetails ? !selectedDetails.hasAttribute('open') : false,
        fogLedgerCollapsed: fogLedger ? !fogLedger.hasAttribute('open') : false,
        scoutAliasesCollapsed: scoutAliases ? !scoutAliases.hasAttribute('open') : true,
        scoutAliasButtonCount: scoutAliases ? scoutAliases.querySelectorAll('[data-testid^="fp-btn-scout-sector-"]').length : 0,
        ledgerCollapsed: ledger ? !ledger.hasAttribute('open') : false,
        ledgerActions: Number(ledger?.getAttribute('data-actions') || 0),
        boardBeforeDrawer: !!(board && drawer && (board.compareDocumentPosition(drawer) & Node.DOCUMENT_POSITION_FOLLOWING)),
        rect: rect ? {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        } : null,
      };
    })(),
    mapFirstHud: {
      visible: !!document.querySelector('[data-testid="fp-expedition-map-visual-hud"]'),
      selectedCellId: document.querySelector('[data-testid="fp-expedition-map-visual-hud"]')?.getAttribute('data-selected-cell-id') || '',
      fogState: document.querySelector('[data-testid="fp-expedition-map-visual-hud"]')?.getAttribute('data-fog-state') || '',
      scoutable: document.querySelector('[data-testid="fp-expedition-map-visual-hud"]')?.getAttribute('data-scoutable') || '',
      selectedSummaryText: document.querySelector('[data-testid="fp-expedition-map-selected-summary"]')?.textContent || '',
      selectedSummaryLabel: document.querySelector('[data-testid="fp-expedition-map-selected-summary"]')?.getAttribute('aria-label') || '',
      receiptTraceText: document.querySelector('[data-testid="fp-expedition-receipt-trace-map-selected"]')?.textContent || '',
      receiptTraceLabel: document.querySelector('[data-testid="fp-expedition-receipt-trace-map-selected"]')?.getAttribute('aria-label') || '',
      partyBadgesText: document.querySelector('[data-testid="fp-expedition-party-badges-map-selected"]')?.textContent || '',
      partyBadgesLabel: document.querySelector('[data-testid="fp-expedition-party-badges-map-selected"]')?.getAttribute('aria-label') || '',
      fogPipCount: document.querySelectorAll('[data-testid="fp-expedition-fog-pips"] .fp-expedition-fog-pip').length,
    },
    objectiveStrip: {
      visible: !!document.querySelector('[data-testid="fp-expedition-objective-strip"]'),
      mode: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.getAttribute('data-mode') || '',
      readOnly: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.getAttribute('data-read-only') || '',
      actions: Number(document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.getAttribute('data-actions') || 0),
      targetCellId: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.getAttribute('data-target-cell-id') || '',
      packetId: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.getAttribute('data-packet-id') || '',
      partyId: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.getAttribute('data-party-id') || '',
      label: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.getAttribute('aria-label') || '',
      text: document.querySelector('[data-testid="fp-expedition-objective-strip"]')?.textContent || '',
      visibleText: (() => {
        const strip = document.querySelector('[data-testid="fp-expedition-objective-strip"]');
        return Array.from(strip?.children || [])
          .filter((node) => node.tagName !== 'DETAILS')
          .map((node) => node.textContent || '')
          .join(' ');
      })(),
      factsText: document.querySelector('[data-testid="fp-expedition-objective-strip-facts"]')?.textContent || '',
      boundaryText: document.querySelector('[data-testid="fp-expedition-objective-strip-boundary"]')?.textContent || '',
      buttons: document.querySelectorAll('[data-testid="fp-expedition-objective-strip"] button').length,
      ledger: (() => {
        const ledger = document.querySelector('[data-testid="fp-expedition-objective-ledger-details"]');
        return {
          present: !!ledger,
          collapsed: ledger ? !ledger.hasAttribute('open') : false,
          readOnly: ledger?.getAttribute('data-read-only') || '',
          actions: Number(ledger?.getAttribute('data-actions') || 0),
          text: ledger?.textContent || '',
        };
      })(),
    },
    eventPacketCardVisible: !!document.querySelector('[data-testid="fp-expedition-event-packet-cell_q0_r1"]'),
    eventPacketHeaderText: document.querySelector('[data-testid="fp-expedition-event-packet-cell_q0_r1"] .fp-expedition-event-packet__header')?.textContent || '',
    eventPacketChipsText: document.querySelector('[data-testid="fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1"]')?.textContent || '',
    eventPacketLedeText: document.querySelector('[data-testid="fp-expedition-event-packet-cell_q0_r1"] .fp-expedition-event-packet__lede')?.textContent || '',
    eventPacketFactsText: document.querySelector('[data-testid="fp-expedition-event-packet-facts-expedition_event_packet_hq12f_cell_q0_r1"]')?.textContent || '',
    eventPacketBoundaryText: document.querySelector('[data-testid="fp-expedition-event-packet-boundary-cell_q0_r1"]')?.textContent || '',
    partyBlocks: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-party-"]')).map((node) => ({
      testid: node.getAttribute('data-testid'),
      actions: Number(node.getAttribute('data-actions') || 0),
      readOnly: node.getAttribute('data-read-only'),
      text: node.textContent || '',
    })),
    partyRosterText: document.querySelector('[data-testid="fp-expedition-party-roster-packet-cell_q0_r1"]')?.textContent || '',
    eventPacketMutationButtons: Array.from(document.querySelectorAll('[data-testid="fp-expedition-event-packet-cell_q0_r1"] button')).map((node) => ({
      testid: node.getAttribute('data-testid'),
      text: node.textContent,
    })),
    scoutButtons: Array.from(document.querySelectorAll('[data-testid^="fp-btn-scout-sector-"]')).map((node) => ({
      testid: node.getAttribute('data-testid'),
      cellId: node.getAttribute('data-cell-id'),
    })),
    sectorCards: Array.from(document.querySelectorAll('[data-testid^="fp-expedition-sector-"]')).map((node) => node.getAttribute('data-testid')),
  }));
  const mobilePolishProof = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const rectFor = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const gridColumns = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return 0;
      return getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length;
    };
    const clipped = Array.from(document.querySelectorAll([
      '[data-testid="fp-expedition-map-panel"]',
      '[data-testid="fp-expedition-map-hud"]',
      '[data-testid="fp-expedition-inspector-chrome"]',
      '[data-testid="fp-expedition-inspector-chips"]',
      '[data-testid="fp-expedition-inspector-fog-ledger"]',
      '[data-testid="fp-expedition-inspector-scout-aliases"]',
      '[data-testid="fp-expedition-inspector-ledger"]',
      '[data-testid="fp-expedition-map-status"]',
      '[data-testid="fp-expedition-objective-strip"]',
      '[data-testid="fp-expedition-objective-strip-facts"]',
      '[data-testid="fp-expedition-objective-ledger-details"]',
      '[data-testid="fp-expedition-map-board-card"]',
      '[data-testid="fp-expedition-map-visual-hud"]',
      '[data-testid="fp-expedition-map-selected-summary"]',
      '[data-testid="fp-expedition-fog-pips"]',
      '[data-testid="fp-expedition-receipt-trace-map-selected"]',
      '[data-testid="fp-expedition-party-badges-map-selected"]',
      '[data-testid="fp-expedition-selected-sector"]',
      '[data-testid="fp-expedition-event-packet-cell_q0_r1"]',
      '[data-testid="fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1"]',
      '[data-testid="fp-expedition-party-packet-cell_q0_r1"]',
      '[data-testid="fp-expedition-party-roster-packet-cell_q0_r1"]',
      '.fp-expedition-map-metrics',
      '.fp-expedition-event-packet-facts',
      '.fp-expedition-party__facts',
      '.fp-scout-sector-row',
    ].join(','))).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        testid: node.getAttribute('data-testid') || node.className,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      };
    }).filter((entry) => entry.width > 0 && (entry.left < -1 || entry.right > viewport + 1));
    const packetButtons = Array.from(document.querySelectorAll('[data-testid="fp-expedition-event-packet-cell_q0_r1"] button'));
    const partyButtons = Array.from(document.querySelectorAll('[data-testid^="fp-expedition-party-"] button'));
    return {
      viewport,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      clipped,
      surfaces: {
        panel: rectFor('[data-testid="fp-expedition-map-panel"]'),
        inspectorDrawer: rectFor('[data-testid="fp-expedition-map-hud"]'),
        inspectorChrome: rectFor('[data-testid="fp-expedition-inspector-chrome"]'),
        objectiveStrip: rectFor('[data-testid="fp-expedition-objective-strip"]'),
        threeHost: rectFor('[data-testid="fp-expedition-three-host"]'),
        mapVisualHud: rectFor('[data-testid="fp-expedition-map-visual-hud"]'),
        mapSelectedSummary: rectFor('[data-testid="fp-expedition-map-selected-summary"]'),
        selectedSector: rectFor('[data-testid="fp-expedition-selected-sector"]'),
        eventPacket: rectFor('[data-testid="fp-expedition-event-packet-cell_q0_r1"]'),
        eventPacketChips: rectFor('[data-testid="fp-expedition-event-packet-chips-expedition_event_packet_hq12f_cell_q0_r1"]'),
        partyPacket: rectFor('[data-testid="fp-expedition-party-packet-cell_q0_r1"]'),
        partyRoster: rectFor('[data-testid="fp-expedition-party-roster-packet-cell_q0_r1"]'),
      },
      gridColumns: {
        metrics: gridColumns('.fp-expedition-map-metrics'),
        objectiveFacts: gridColumns('[data-testid="fp-expedition-objective-strip-facts"]'),
        packetFacts: gridColumns('[data-testid="fp-expedition-event-packet-facts-expedition_event_packet_hq12f_cell_q0_r1"]'),
        partyFacts: gridColumns('[data-testid="fp-expedition-party-packet-cell_q0_r1"] .fp-expedition-party__facts'),
      },
      buttons: {
        packetButtons: packetButtons.length,
        partyButtons: partyButtons.length,
        scoutButtons: Array.from(document.querySelectorAll('[data-testid^="fp-btn-scout-sector-"]')).length,
      },
    };
  });
  expect(mobilePolishProof.documentScrollWidth).toBeLessThanOrEqual(mobilePolishProof.viewport + 1);
  expect(mobilePolishProof.bodyScrollWidth).toBeLessThanOrEqual(mobilePolishProof.viewport + 1);
  expect(mobilePolishProof.clipped).toEqual([]);
  expect(mobilePolishProof.gridColumns.metrics).toBeGreaterThanOrEqual(2);
  expect(mobilePolishProof.gridColumns.objectiveFacts).toBeGreaterThanOrEqual(2);
  expect(mobilePolishProof.gridColumns.packetFacts).toBeGreaterThanOrEqual(2);
  expect(mobilePolishProof.gridColumns.partyFacts).toBeGreaterThanOrEqual(2);
  expect(mobilePolishProof.surfaces.inspectorDrawer.width).toBeGreaterThan(0);
  expect(mobilePolishProof.surfaces.inspectorChrome.width).toBeGreaterThan(0);
  expect(mobilePolishProof.surfaces.objectiveStrip.width).toBeGreaterThan(0);
  expect(mobilePolishProof.surfaces.threeHost.height).toBeGreaterThanOrEqual(560);
  expect(mobilePolishProof.surfaces.mapVisualHud.width).toBeGreaterThan(0);
  expect(mobilePolishProof.surfaces.mapSelectedSummary.width).toBeGreaterThan(0);
  expect(mobilePolishProof.surfaces.eventPacketChips).not.toBeNull();
  expect(mobilePolishProof.surfaces.partyRoster).not.toBeNull();
  expect(mobilePolishProof.buttons.packetButtons).toBe(0);
  expect(mobilePolishProof.buttons.partyButtons).toBe(0);
  expect(mobilePolishProof.buttons.scoutButtons).toBe(0);
  expect(scoutDomProof.partyRosterText).toContain('Mira Trailmark');
  expect(scoutDomProof.partyRosterText).toContain('scout');
  expect(scoutDomProof.partyRosterText).toContain('Rook Signalpost');
  expect(scoutDomProof.partyRosterText).toContain('messenger');
  expect(scoutDomProof.partyRosterText).toContain('Vale-Desk 7');
  expect(scoutDomProof.objectiveStrip.visible).toBe(true);
  expect(scoutDomProof.objectiveStrip.mode).toBe('packet');
  expect(scoutDomProof.objectiveStrip.readOnly).toBe('true');
  expect(scoutDomProof.objectiveStrip.actions).toBe(0);
  expect(scoutDomProof.objectiveStrip.buttons).toBe(0);
  expect(scoutDomProof.objectiveStrip.packetId).toBe(hq12fEventPacket.packetId);
  expect(scoutDomProof.objectiveStrip.label).toContain('Review the latest packet');
  expect(scoutDomProof.objectiveStrip.visibleText).toContain('PKT');
  expect(scoutDomProof.objectiveStrip.visibleText).not.toContain('zero executable actions');
  expect(scoutDomProof.objectiveStrip.boundaryText).toContain('No new server objectives');
  expect(scoutDomProof.objectiveStrip.ledger.present).toBe(true);
  expect(scoutDomProof.objectiveStrip.ledger.collapsed).toBe(true);
  expect(scoutDomProof.objectiveStrip.ledger.readOnly).toBe('true');
  expect(scoutDomProof.objectiveStrip.ledger.actions).toBe(0);
  expect(scoutDomProof.objectiveStrip.ledger.text).toContain('Ledger detail');
  expect(scoutDomProof.inspectorDrawer.visible).toBe(true);
  expect(scoutDomProof.inspectorDrawer.drawerKind).toBe('visual-inspector');
  expect(scoutDomProof.inspectorDrawer.readOnly).toBe('true');
  expect(scoutDomProof.inspectorDrawer.actions).toBe(0);
  expect(scoutDomProof.inspectorDrawer.chromeLabel).toContain('Visual inspector');
  expect(scoutDomProof.inspectorDrawer.chromeText).toContain('VIS');
  expect(scoutDomProof.inspectorDrawer.chipsText).toContain('SRV');
  expect(scoutDomProof.inspectorDrawer.containsStatus).toBe(true);
  expect(scoutDomProof.inspectorDrawer.containsObjective).toBe(true);
  expect(scoutDomProof.inspectorDrawer.containsSelectedSector).toBe(true);
  expect(scoutDomProof.inspectorDrawer.containsEventPacket).toBe(true);
  expect(scoutDomProof.inspectorDrawer.containsSectorLedger).toBe(true);
  expect(scoutDomProof.inspectorDrawer.selectedDetailsCollapsed).toBe(true);
  expect(scoutDomProof.inspectorDrawer.fogLedgerCollapsed).toBe(true);
  expect(scoutDomProof.inspectorDrawer.scoutAliasesCollapsed).toBe(true);
  expect(scoutDomProof.inspectorDrawer.scoutAliasButtonCount).toBe(0);
  expect(scoutDomProof.inspectorDrawer.ledgerCollapsed).toBe(true);
  expect(scoutDomProof.inspectorDrawer.ledgerActions).toBe(0);
  expect(scoutDomProof.inspectorDrawer.boardBeforeDrawer).toBe(true);
  expect(scoutDomProof.mapFirstHud.visible).toBe(true);
  expect(scoutDomProof.mapFirstHud.selectedCellId).toBe('cell_q0_r1');
  expect(scoutDomProof.mapFirstHud.fogState).toBe('known');
  expect(scoutDomProof.mapFirstHud.scoutable).toBe('false');
  expect(scoutDomProof.mapFirstHud.selectedSummaryText).toContain('KNOWN');
  expect(scoutDomProof.mapFirstHud.selectedSummaryText).not.toMatch(/packet filed|cell_q0_r1|Scout unit command ready/i);
  expect(scoutDomProof.mapFirstHud.receiptTraceLabel).toContain('scout scout_sector_ui_001');
  expect(scoutDomProof.mapFirstHud.receiptTraceText).not.toContain('scout scout_sector_ui_001');
  expect(scoutDomProof.mapFirstHud.partyBadgesText).toContain('MT');
  fs.writeFileSync('reports/agent-town-hq12c-scout-sector-ui-proof-2026-05-31.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'mocked Playwright state using the verified HQ12C scout-sector backend contract; UI calls the route for one hinted sector and refreshes to known',
    capturedRequest: capturedScoutSector,
    scoutSector: scoutSectorReceipt,
    counts: expeditionMap.fog.counts,
    domProof: scoutDomProof,
    screenshots: [
      'reports/agent-town-hq12c-scout-sector-ui-desktop-2026-05-31.png',
      'reports/agent-town-hq12c-scout-sector-ui-mobile-2026-05-31.png',
    ],
    guardrails: {
      hintedScoutButtonsAfterReveal: scoutDomProof.scoutButtons,
      knownTargetNonMutating: scoutDomProof.targetFogState === 'known' && scoutDomProof.scoutButtons.every((entry) => entry.cellId !== 'cell_q0_r1'),
      lockedUnknownNonMutating: scoutDomProof.scoutButtons.every((entry) => entry.cellId !== 'cell_q3_r0'),
      routeCreation: scoutSectorReceipt.receipt.routeCreation,
      tradeRouteCreation: scoutSectorReceipt.receipt.tradeRouteCreation,
      resourceHarvesting: scoutSectorReceipt.receipt.resourceHarvesting,
      atlasExecution: scoutSectorReceipt.receipt.atlasExecution,
      publicSharing: scoutSectorReceipt.receipt.publicSharing,
      generatedUniverseRendering: scoutSectorReceipt.receipt.generatedUniverseRendering,
      crossPlotMutation: scoutSectorReceipt.receipt.crossPlotMutation,
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq12f-expedition-event-packets-ui-proof-2026-05-31.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'mocked Playwright state using verified HQ12E event packet read-model shape; UI presents packets read-only after Scout Sector receipt',
    capturedRequest: capturedScoutSector,
    eventPacket: hq12fEventPacket,
    eventPacketIds: expeditionMap.sourceSummary.eventPacketIds,
    domProof: scoutDomProof,
    screenshots: [
      'reports/agent-town-hq12f-expedition-event-packets-ui-desktop-2026-05-31.png',
      'reports/agent-town-hq12f-expedition-event-packets-ui-mobile-2026-05-31.png',
    ],
    guardrails: {
      packetButtons: scoutDomProof.eventPacketMutationButtons.length,
      scoutSectorOnlyMutationPath: scoutDomProof.scoutButtons.length === 0,
      executableActions: hq12fEventPacket.executableActions,
      readOnly: hq12fEventPacket.readOnly,
      routeCreation: hq12fEventPacket.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.boundaryFlags.resourceHarvesting,
      combat: hq12fEventPacket.boundaryFlags.combat,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      crossPlotMutation: hq12fEventPacket.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.boundaryFlags.externalEffects,
    },
  }, null, 2));
  const hq12gForbiddenGenre = /\b(cowboy|saloon|gold rush|gold-rush|gunslinger|sheriff|wild west)\b/i;
  const hq12gPartyActions = scoutDomProof.partyBlocks.reduce((total, block) => total + Number(block.actions || 0), 0);
  fs.writeFileSync('reports/agent-town-hq12g-expedition-party-flavor-ui-proof-2026-05-31.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'mocked Playwright state using HQ12F read-only event packet fields plus static existing scout/operator names for presentation-only party flavor',
    selectedCellId: 'cell_q0_r1',
    eventPacketId: hq12fEventPacket.packetId,
    partyFlavor: {
      operatorName: 'Mira Trailmark',
      scoutId: hq12fEventPacket.scoutId,
      deskOperator: 'Vale-Desk 7',
      anchor: hq12fEventPacket.packetId,
      derivedFrom: ['expeditionMap.expeditionParty', 'eventPacket.partySnapshot', 'eventPacket.scoutId', 'eventPacket.cellId', 'eventPacket.receiptLink'],
      readOnly: true,
    },
    domProof: scoutDomProof,
    screenshots: [
      'reports/agent-town-hq12g-expedition-party-flavor-ui-desktop-2026-05-31.png',
      'reports/agent-town-hq12g-expedition-party-flavor-ui-mobile-2026-05-31.png',
    ],
    guardrails: {
      scoutSectorOnlyMutationPath: scoutDomProof.scoutButtons.length === 0,
      packetActions: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      packetPartyActions: scoutDomProof.eventPacketMutationButtons.length + hq12gPartyActions,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      routeTrade: hq12fEventPacket.boundaryFlags.routeCreation || hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceMutation: hq12fEventPacket.boundaryFlags.resourceHarvesting || Object.keys(hq12fEventPacket.boundaryFlags.resourceDelta || {}).length > 0,
      combat: hq12fEventPacket.boundaryFlags.combat,
      hiddenAutonomy: hq12fEventPacket.boundaryFlags.backgroundScheduling || hq12fEventPacket.executableActions.length > 0,
      wildWestGenreDrift: scoutDomProof.partyBlocks.some((block) => hq12gForbiddenGenre.test(block.text)),
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq12h-expedition-map-mobile-polish-proof-2026-05-31.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked HQ12B/C/F/G read-model state after Scout Sector receipt; CSS-only compact mobile proof',
    selectedCellId: 'cell_q0_r1',
    eventPacketId: hq12fEventPacket.packetId,
    projectionHash: expeditionMap.projectionHash,
    mobilePolishProof,
    domProof: scoutDomProof,
    screenshots: [
      'reports/agent-town-hq12h-expedition-map-mobile-polish-desktop-2026-05-31.png',
      'reports/agent-town-hq12h-expedition-map-mobile-polish-mobile-2026-05-31.png',
    ],
    guardrails: {
      scoutSectorOnlyMutationPath: scoutDomProof.scoutButtons.length === 0,
      packetActions: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      readOnlyEventPacket: hq12fEventPacket.readOnly,
      executableActions: hq12fEventPacket.executableActions,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      routeTrade: hq12fEventPacket.boundaryFlags.routeCreation || hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceMutation: hq12fEventPacket.boundaryFlags.resourceHarvesting || Object.keys(hq12fEventPacket.boundaryFlags.resourceDelta || {}).length > 0,
      combat: hq12fEventPacket.boundaryFlags.combat,
      hiddenAutonomy: hq12fEventPacket.boundaryFlags.backgroundScheduling || hq12fEventPacket.executableActions.length > 0,
      wildWestGenreDrift: scoutDomProof.partyBlocks.some((block) => hq12gForbiddenGenre.test(block.text)),
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq12k-expedition-event-packet-visual-polish-proof-2026-06-01.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked server-owned HQ12F event packet read model after Scout Sector receipt; HQ12K verifies frontend-only visual hierarchy and read-only guardrails',
    selectedCellId: 'cell_q0_r1',
    eventPacketId: hq12fEventPacket.packetId,
    visualPolish: {
      headerText: scoutDomProof.eventPacketHeaderText,
      chipsText: scoutDomProof.eventPacketChipsText,
      ledeText: scoutDomProof.eventPacketLedeText,
      factsText: scoutDomProof.eventPacketFactsText,
      boundaryText: scoutDomProof.eventPacketBoundaryText,
      mobileFit: mobilePolishProof,
    },
    screenshots: [
      'reports/agent-town-hq12k-expedition-event-packet-visual-polish-desktop-2026-06-01.png',
      'reports/agent-town-hq12k-expedition-event-packet-visual-polish-mobile-2026-06-01.png',
    ],
    guardrails: {
      frontendOnly: true,
      scoutSectorOnlyMutationPath: scoutDomProof.scoutButtons.length === 0,
      packetButtons: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      eventPacketReadOnly: hq12fEventPacket.readOnly,
      executableActions: hq12fEventPacket.executableActions,
      routeCreation: hq12fEventPacket.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.boundaryFlags.resourceHarvesting,
      resourceDelta: hq12fEventPacket.boundaryFlags.resourceDelta,
      combat: hq12fEventPacket.boundaryFlags.combat,
      backgroundScheduling: hq12fEventPacket.boundaryFlags.backgroundScheduling,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      crossPlotMutation: hq12fEventPacket.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.boundaryFlags.externalEffects,
      wildWestGenreDrift: scoutDomProof.partyBlocks.some((block) => hq12gForbiddenGenre.test(block.text)),
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq12l-expedition-party-visual-polish-proof-2026-06-01.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked server-owned expeditionMap.expeditionParty and eventPacket.partySnapshot; HQ12L verifies read-only party visual polish',
    selectedCellId: 'cell_q0_r1',
    eventPacketId: hq12fEventPacket.packetId,
    partyPresentation: {
      manifestPartyId: hq12lExpeditionParty.partyId,
      snapshotPartyId: hq12fEventPacket.partySnapshot.partyId,
      rosterText: scoutDomProof.partyRosterText,
      partyBlocks: scoutDomProof.partyBlocks,
      mobileFit: mobilePolishProof,
    },
    screenshots: [
      'reports/agent-town-hq12l-expedition-party-visual-polish-desktop-2026-06-01.png',
      'reports/agent-town-hq12l-expedition-party-visual-polish-mobile-2026-06-01.png',
    ],
    guardrails: {
      frontendOnly: true,
      sourceFields: ['expeditionMap.expeditionParty', 'eventPacket.partySnapshot'],
      scoutSectorOnlyMutationPath: scoutDomProof.scoutButtons.length === 0,
      packetButtons: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      eventPacketReadOnly: hq12fEventPacket.readOnly,
      partyReadOnly: hq12lExpeditionParty.readOnly && hq12fEventPacket.partySnapshot.readOnly,
      executableActions: hq12fEventPacket.partySnapshot.executableActions,
      routeCreation: hq12fEventPacket.partySnapshot.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.partySnapshot.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.partySnapshot.boundaryFlags.resourceHarvesting,
      resourceDelta: hq12fEventPacket.partySnapshot.boundaryFlags.resourceDelta,
      combat: hq12fEventPacket.partySnapshot.boundaryFlags.combat,
      backgroundScheduling: hq12fEventPacket.partySnapshot.boundaryFlags.backgroundScheduling,
      publicSharing: hq12fEventPacket.partySnapshot.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.partySnapshot.boundaryFlags.generatedUniverseRendering,
      atlasExecution: hq12fEventPacket.partySnapshot.boundaryFlags.atlasExecution,
      crossPlotMutation: hq12fEventPacket.partySnapshot.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.partySnapshot.boundaryFlags.externalEffects,
      wildWestGenreDrift: scoutDomProof.partyBlocks.some((block) => hq12gForbiddenGenre.test(block.text)),
      mobileHorizontalOverflow: mobilePolishProof.clipped.length,
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq12n-expedition-objective-strip-proof-2026-06-01.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked server-owned Expedition Map, Event Packet, and Expedition Party read models; HQ12N verifies read-only current-focus objective strip',
    selectedCellId: 'cell_q0_r1',
    eventPacketId: hq12fEventPacket.packetId,
    objectiveStrip: scoutDomProof.objectiveStrip,
    mobileFit: mobilePolishProof,
    screenshots: [
      'reports/agent-town-hq12n-expedition-objective-strip-desktop-2026-06-01.png',
      'reports/agent-town-hq12n-expedition-objective-strip-mobile-2026-06-01.png',
    ],
    guardrails: {
      frontendOnly: true,
      readOnly: scoutDomProof.objectiveStrip.readOnly === 'true',
      objectiveActions: scoutDomProof.objectiveStrip.actions,
      objectiveButtons: scoutDomProof.objectiveStrip.buttons,
      sourceFields: ['expeditionMap cells', 'expedition event packets', 'expedition party manifest'],
      hiddenTruthInvented: false,
      serverObjectivesCreated: false,
      scoutSectorOnlyMutationPath: scoutDomProof.scoutButtons.length === 0,
      packetButtons: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      executableActions: hq12fEventPacket.executableActions,
      routeCreation: hq12fEventPacket.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.boundaryFlags.resourceHarvesting,
      resourceDelta: hq12fEventPacket.boundaryFlags.resourceDelta,
      combat: hq12fEventPacket.boundaryFlags.combat,
      backgroundScheduling: hq12fEventPacket.boundaryFlags.backgroundScheduling,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      crossPlotMutation: hq12fEventPacket.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.boundaryFlags.externalEffects,
      wildWestGenreDrift: scoutDomProof.partyBlocks.some((block) => hq12gForbiddenGenre.test(block.text)),
      mobileHorizontalOverflow: mobilePolishProof.clipped.length,
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq12o-expedition-sector-art-readability-proof-2026-06-01.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked server-owned Expedition Map read model; HQ12O verifies frontend-only sector art/readability and guardrails',
    changeScope: ['public/experiences/founders-plot/founders-plot.css', 'public/experiences/founders-plot/founders-plot.js', 'e2e/200_founders_plot.spec.js'],
    initialFogStates: domProof.cells.map((entry) => entry.fogState),
    initialSelectedSector: domProof.selectedSector,
    legendStates: domProof.legendStates,
    sectorCards: domProof.sectorCards,
    visualStateStyles: domProof.visualStateStyles,
    postScoutDomProof: scoutDomProof,
    mobileFit: mobilePolishProof,
    screenshots: [
      'reports/agent-town-hq12o-expedition-sector-art-readability-desktop-2026-06-01.png',
      'reports/agent-town-hq12o-expedition-sector-art-readability-mobile-2026-06-01.png',
    ],
    guardrails: {
      frontendOnly: true,
      serverAuthorityUnchanged: true,
      fogStatesPreserved: ['discovered', 'known', 'hinted', 'locked_unknown'].every((state) => domProof.cells.some((entry) => entry.fogState === state)),
      hintedSelectedNoButtons: domProof.selectedSector.fogState === 'hinted' && domProof.selectedSector.buttons === 0,
      hintedSelectedNoHiddenTruth: !/resources wood|wood \+2|food \+1|receipt scout_sector_ui_001|owned outpost: plot_hq12b_forest_outpost/i.test(domProof.selectedSector.text),
      lockedUnknownNoSectorCard: !domProof.sectorCards.some((entry) => entry.cellId === 'cell_q3_r0'),
      lockedUnknownNoScoutButton: !domProof.mutationButtons.some((entry) => entry.cellId === 'cell_q3_r0'),
      scoutSectorOnlyMutationPathBeforeReveal: domProof.mutationButtons.every((entry) => String(entry.testid || '').startsWith('fp-btn-scout-sector-') && entry.cellId === 'cell_q0_r1'),
      scoutSectorOnlyMutationPathAfterReveal: scoutDomProof.scoutButtons.length === 0,
      eventPacketButtons: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      objectiveActions: scoutDomProof.objectiveStrip.actions,
      objectiveButtons: scoutDomProof.objectiveStrip.buttons,
      executableActions: hq12fEventPacket.executableActions,
      routeCreation: hq12fEventPacket.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.boundaryFlags.resourceHarvesting,
      resourceDelta: hq12fEventPacket.boundaryFlags.resourceDelta,
      combat: hq12fEventPacket.boundaryFlags.combat,
      backgroundScheduling: hq12fEventPacket.boundaryFlags.backgroundScheduling,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      crossPlotMutation: hq12fEventPacket.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.boundaryFlags.externalEffects,
      wildWestGenreDrift: hq12gForbiddenGenre.test([
        domProof.selectedSector.text,
        domProof.hiddenSummaryText,
        ...domProof.sectorCards.map((entry) => entry.text),
        ...scoutDomProof.partyBlocks.map((block) => block.text),
      ].join(' ')),
      mobileHorizontalOverflow: mobilePolishProof.clipped.length,
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq14d-map-first-ui-playability-slice-proof-2026-06-01.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked server-owned Expedition Map, Scout Sector receipt, Event Packet, and Expedition Party read models; HQ14D verifies map-first UI affordances only',
    changeScope: [
      'public/experiences/founders-plot/founders-plot.js',
      'public/experiences/founders-plot/founders-plot.css',
      'e2e/200_founders_plot.spec.js',
    ],
    initialMapFirstHud: domProof.mapFirstHud,
    postScoutMapFirstHud: scoutDomProof.mapFirstHud,
    mobileFit: mobilePolishProof,
    screenshots: [
      'reports/agent-town-hq14d-map-first-ui-playability-slice-desktop-2026-06-01.png',
      'reports/agent-town-hq14d-map-first-ui-playability-slice-mobile-2026-06-01.png',
    ],
    guardrails: {
      frontendOnly: true,
      serverAuthorityUnchanged: true,
      mapFirstHudVisible: domProof.mapFirstHud.visible && scoutDomProof.mapFirstHud.visible,
      fogPips: domProof.mapFirstHud.fogPipCount,
      selectedHintedNoHiddenTruth: !/wood \+2|food \+1|owned outpost: plot_hq12b_forest_outpost|receipt scout_sector_ui_001/i.test(domProof.mapFirstHud.selectedSummaryText),
      receiptTraceHiddenProvenanceSealed: /Provenance sealed/i.test(domProof.mapFirstHud.receiptTraceLabel) && !/Provenance sealed/i.test(domProof.mapFirstHud.receiptTraceText),
      postScoutReceiptTraceFromServerReceipt: /scout scout_sector_ui_001/i.test(scoutDomProof.mapFirstHud.receiptTraceLabel) && !/scout scout_sector_ui_001/i.test(scoutDomProof.mapFirstHud.receiptTraceText),
      partyBadgesFromReadModel: /MT/.test(domProof.mapFirstHud.partyBadgesText) && /party member/i.test(domProof.mapFirstHud.partyBadgesLabel),
      scoutSectorOnlyMutationPathBeforeReveal: domProof.mutationButtons.every((entry) => String(entry.testid || '').startsWith('fp-btn-scout-sector-') && entry.cellId === 'cell_q0_r1'),
      scoutSectorOnlyMutationPathAfterReveal: scoutDomProof.scoutButtons.length === 0,
      mapControlsNonMutating: domProof.mapControlButtons.length,
      eventPacketButtons: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      objectiveActions: scoutDomProof.objectiveStrip.actions,
      objectiveButtons: scoutDomProof.objectiveStrip.buttons,
      executableActions: hq12fEventPacket.executableActions,
      routeCreation: hq12fEventPacket.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.boundaryFlags.resourceHarvesting,
      resourceDelta: hq12fEventPacket.boundaryFlags.resourceDelta,
      combat: hq12fEventPacket.boundaryFlags.combat,
      backgroundScheduling: hq12fEventPacket.boundaryFlags.backgroundScheduling,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      crossPlotMutation: hq12fEventPacket.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.boundaryFlags.externalEffects,
      wildWestGenreDrift: hq12gForbiddenGenre.test([
        domProof.mapFirstHud.selectedSummaryText,
        domProof.hiddenSummaryText,
        ...domProof.sectorCards.map((entry) => entry.text),
        ...scoutDomProof.partyBlocks.map((block) => block.text),
      ].join(' ')),
      mobileHorizontalOverflow: mobilePolishProof.clipped.length,
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq14g-visual-inspector-drawer-proof-2026-06-01.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked server-owned Expedition Map, Scout Sector receipt, Event Packet, and Expedition Party read models; HQ14G verifies the map-first visual inspector drawer',
    changeScope: [
      'public/experiences/founders-plot/founders-plot.js',
      'public/experiences/founders-plot/founders-plot.css',
      'e2e/200_founders_plot.spec.js',
    ],
    selectedCellId: 'cell_q0_r1',
    eventPacketId: hq12fEventPacket.packetId,
    inspectorDrawer: scoutDomProof.inspectorDrawer,
    mobileFit: mobilePolishProof,
    screenshots: [
      'reports/agent-town-hq14g-visual-inspector-drawer-desktop-2026-06-01.png',
      'reports/agent-town-hq14g-visual-inspector-drawer-mobile-2026-06-01.png',
    ],
    guardrails: {
      frontendOnly: true,
      serverAuthorityUnchanged: true,
      drawerReadOnly: scoutDomProof.inspectorDrawer.readOnly === 'true' && scoutDomProof.inspectorDrawer.actions === 0,
      drawerContainsExistingReadModels: [
        scoutDomProof.inspectorDrawer.containsStatus,
        scoutDomProof.inspectorDrawer.containsObjective,
        scoutDomProof.inspectorDrawer.containsSelectedSector,
        scoutDomProof.inspectorDrawer.containsEventPacket,
        scoutDomProof.inspectorDrawer.containsSectorLedger,
      ].every(Boolean),
      boardBeforeDrawer: scoutDomProof.inspectorDrawer.boardBeforeDrawer,
      selectedDetailsCollapsed: scoutDomProof.inspectorDrawer.selectedDetailsCollapsed,
      fogLedgerCollapsed: scoutDomProof.inspectorDrawer.fogLedgerCollapsed,
      sectorActionAliasesCollapsed: scoutDomProof.inspectorDrawer.scoutAliasesCollapsed,
      sectorActionAliasButtonsAfterReveal: scoutDomProof.inspectorDrawer.scoutAliasButtonCount,
      legacySectorLedgerCollapsed: scoutDomProof.inspectorDrawer.ledgerCollapsed,
      scoutSectorOnlyMutationPathAfterReveal: scoutDomProof.scoutButtons.length === 0,
      eventPacketButtons: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      objectiveActions: scoutDomProof.objectiveStrip.actions,
      objectiveButtons: scoutDomProof.objectiveStrip.buttons,
      executableActions: hq12fEventPacket.executableActions,
      routeCreation: hq12fEventPacket.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.boundaryFlags.resourceHarvesting,
      resourceDelta: hq12fEventPacket.boundaryFlags.resourceDelta,
      combat: hq12fEventPacket.boundaryFlags.combat,
      backgroundScheduling: hq12fEventPacket.boundaryFlags.backgroundScheduling,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      crossPlotMutation: hq12fEventPacket.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.boundaryFlags.externalEffects,
      wildWestGenreDrift: hq12gForbiddenGenre.test([
        scoutDomProof.inspectorDrawer.chromeText,
        scoutDomProof.mapFirstHud.selectedSummaryText,
        scoutDomProof.eventPacketHeaderText,
        ...scoutDomProof.partyBlocks.map((block) => block.text),
      ].join(' ')),
      mobileHorizontalOverflow: mobilePolishProof.clipped.length,
    },
  }, null, 2));
  fs.writeFileSync('reports/agent-town-hq15s-fog-selected-inspector-symbol-compaction-proof-2026-06-02.json', JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'FP-E2E-022 mocked server-owned Expedition Map, Event Packet, Expedition Party, and Expedition Unit read models; HQ15S verifies symbol-first fog, selected summary, objective, and inspector surfaces',
    changeScope: [
      'public/experiences/founders-plot/founders-plot.js',
      'public/experiences/founders-plot/founders-plot.css',
      'e2e/200_founders_plot.spec.js',
    ],
    initialMapFirstHud: domProof.mapFirstHud,
    postScoutMapFirstHud: scoutDomProof.mapFirstHud,
    objectiveStrip: scoutDomProof.objectiveStrip,
    inspectorDrawer: scoutDomProof.inspectorDrawer,
    mobileFit: mobilePolishProof,
    screenshots: [
      'reports/agent-town-hq15s-fog-selected-inspector-symbol-compaction-desktop-2026-06-02.png',
      'reports/agent-town-hq15s-fog-selected-inspector-symbol-compaction-mobile-2026-06-02.png',
    ],
    guardrails: {
      frontendOnly: true,
      serverAuthorityUnchanged: true,
      fogPipsSymbolFirst: domProof.mapFirstHud.fogPipCount === 4 && !/DISCOVERED|HINTED|LOCKED/.test(domProof.mapFirstHud.fogPipTexts.join(' ')),
      fogMeaningsAccessible: /Discovered/.test(domProof.mapFirstHud.fogPipLabels.join(' ')) && /Locked/.test(domProof.mapFirstHud.fogPipLabels.join(' ')),
      selectedSummaryNoRawCellOrProse: !/cell_q0_r1|Scout unit command ready|Scout Sector eligible|Provenance sealed|HQ civic operator/i.test(domProof.mapFirstHud.selectedSummaryText),
      selectedSummaryAccessibilityKeepsFacts: /Scout Sector eligible/.test(domProof.mapFirstHud.selectedSummaryLabel) && /Provenance sealed/.test(domProof.mapFirstHud.receiptTraceLabel),
      receiptTraceCompactVisible: !/Provenance sealed|scout scout_sector_ui_001/i.test([domProof.mapFirstHud.receiptTraceText, scoutDomProof.mapFirstHud.receiptTraceText].join(' ')),
      partyBadgesCompactVisible: /MT/.test(domProof.mapFirstHud.partyBadgesText) && !/HQ civic operator|messenger|scout/i.test(domProof.mapFirstHud.partyBadgesText),
      semanticObjectiveCompact: /PKT/.test(scoutDomProof.objectiveStrip.visibleText) && !/zero executable actions|No new server objectives/.test(scoutDomProof.objectiveStrip.visibleText),
      objectiveLedgerCollapsed: scoutDomProof.objectiveStrip.ledger.collapsed && scoutDomProof.objectiveStrip.ledger.actions === 0,
      inspectorChromeCompact: /VIS/.test(scoutDomProof.inspectorDrawer.chromeText) && /SRV/.test(scoutDomProof.inspectorDrawer.chipsText),
      inspectorLedgersCollapsed: [
        scoutDomProof.inspectorDrawer.selectedDetailsCollapsed,
        scoutDomProof.inspectorDrawer.fogLedgerCollapsed,
        scoutDomProof.inspectorDrawer.scoutAliasesCollapsed,
        scoutDomProof.inspectorDrawer.ledgerCollapsed,
      ].every(Boolean),
      scoutSectorOnlyMutationPathBeforeReveal: domProof.mutationButtons.every((entry) => String(entry.testid || '').startsWith('fp-btn-scout-sector-') && entry.cellId === 'cell_q0_r1'),
      scoutSectorOnlyMutationPathAfterReveal: scoutDomProof.scoutButtons.length === 0,
      eventPacketButtons: scoutDomProof.eventPacketMutationButtons.length,
      partyActions: hq12gPartyActions,
      objectiveActions: scoutDomProof.objectiveStrip.actions,
      objectiveButtons: scoutDomProof.objectiveStrip.buttons,
      executableActions: hq12fEventPacket.executableActions,
      routeCreation: hq12fEventPacket.boundaryFlags.routeCreation,
      tradeRouteCreation: hq12fEventPacket.boundaryFlags.tradeRouteCreation,
      resourceHarvesting: hq12fEventPacket.boundaryFlags.resourceHarvesting,
      atlasExecution: hq12fEventPacket.boundaryFlags.atlasExecution,
      publicSharing: hq12fEventPacket.boundaryFlags.publicSharing,
      generatedUniverseRendering: hq12fEventPacket.boundaryFlags.generatedUniverseRendering,
      crossPlotMutation: hq12fEventPacket.boundaryFlags.crossPlotMutation,
      externalEffects: hq12fEventPacket.boundaryFlags.externalEffects,
      mobileHorizontalOverflow: mobilePolishProof.clipped.length,
    },
  }, null, 2));
});

test('FP-E2E-017 UI records HQ10B civic proposals as advisory memory only', async ({ page }) => {
  const plotId = 'plot_hq10b_civic_proposal_ui';
  const proposalId = 'civic_proposal_ui_001';
  let mode = 'locked';
  let capturedCreate = null;
  let releaseCreate = () => {};
  const createGate = new Promise((resolve) => { releaseCreate = resolve; });

  function proposal(status = 'REVIEWED') {
    return {
      proposalId,
      plotId,
      status,
      title: 'Outpost Welcome Board',
      category: 'civic_memory',
      summary: 'Record a review-only welcome-board idea for the first founded outpost.',
      scope: {
        source: 'world_grid_read_model',
        proposalOnly: true,
        executionAllowed: false,
        plotId,
        worldGridProjectionHash: 'hq10b-ui-world-grid',
        knownPlotCount: 2,
        outpostCount: 1,
        relatedPlotIds: ['plot_hq10b_outpost'],
      },
      review: {
        note: status === 'REVIEWED' ? 'Reviewed as memory only.' : '',
        reviewedBy: status === 'REVIEWED' ? 'HUMAN' : null,
        reviewStatus: status === 'REVIEWED' ? 'reviewed_record_only' : 'unreviewed',
        executionDecision: 'not_executable',
      },
      authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
      createdBy: 'HUMAN',
      approvedBy: null,
      createdAt: 1700_020_000_000,
      updatedAt: 1700_020_000_000,
      reviewedAt: status === 'REVIEWED' ? 1700_020_000_000 : null,
      archivedAt: null,
    };
  }

  function proposals() {
    return mode === 'created' ? [proposal('REVIEWED')] : [];
  }

  function civicModel() {
    const records = proposals();
    const reviewedCount = records.filter((entry) => entry.status === 'REVIEWED').length;
    const draftCount = records.filter((entry) => entry.status === 'DRAFT').length;
    const archivedCount = records.filter((entry) => entry.status === 'ARCHIVED').length;
    return {
      status: mode === 'locked' ? 'LOCKED' : 'RECORDING_READY',
      title: 'Civic Proposal Records',
      implementation: 'hq10b_server_owned_civic_proposal_records_v1',
      proposalOnly: true,
      readOnlyExecution: true,
      authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
      allowedStatuses: ['DRAFT', 'REVIEWED', 'ARCHIVED'],
      allowedCategories: ['coordination', 'public_work', 'route_study', 'civic_memory'],
      requirements: {
        items: [
          { key: 'hq.level.6', label: 'HQ6 Settlement Charter', satisfied: true, current: 10, required: 6 },
          { key: 'settlement.outpost.founded', label: 'Founded outpost', satisfied: true, current: 1, required: 1 },
          { key: 'doctrine.survey_discipline.selected', label: 'Survey Discipline selected', satisfied: true, current: 'survey_discipline', required: 'survey_discipline' },
          { key: 'work_order.collect_ready_outputs_once.available', label: 'Collect-ready work-order executor available', satisfied: mode !== 'locked', current: mode !== 'locked', required: true },
        ],
        blockedBy: mode === 'locked' ? ['work_order.collect_ready_outputs_once.available'] : [],
        satisfiedCount: mode === 'locked' ? 3 : 4,
        totalCount: 4,
      },
      worldGridProjectionHash: 'hq10b-ui-world-grid',
      counts: {
        total: records.length,
        byStatus: { DRAFT: draftCount, REVIEWED: reviewedCount, ARCHIVED: archivedCount },
        draftCount,
        reviewedCount,
        archivedCount,
      },
      proposals: records,
    };
  }

  function worldGrid() {
    return {
      status: 'READ_MODEL_READY',
      readOnly: true,
      executableActions: [],
      authorityBoundary: 'server_owned_read_only_world_grid_projection_no_civic_mutation_v1',
      requirements: civicModel().requirements,
      scope: { homePlotId: plotId, activePlotId: plotId, knownPlotCount: 2, outpostCount: 1, knownClaimCount: 1 },
      claims: { total: 1, byStatus: { FOUNDED: 1 }, foundedOutpostCount: 1, foundedPlotIds: ['plot_hq10b_outpost'] },
      civicProposals: {
        proposalOnly: true,
        executionAllowed: false,
        authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
        total: proposals().length,
        byStatus: civicModel().counts.byStatus,
        latestProposalId: proposals()[0]?.proposalId || null,
      },
      civicReadiness: {
        ready: mode !== 'locked',
        nextPromotableSlice: mode === 'locked' ? null : 'HQ10B_CIVIC_PROPOSAL_RECORDS',
        blockedBy: mode === 'locked' ? ['work_order.collect_ready_outputs_once.available'] : [],
        signals: [
          { key: 'multi_plot_visibility', ready: true, value: 2 },
          { key: 'claim_receipts', ready: true, value: 1 },
          { key: 'doctrine_context', ready: true, value: 'survey_discipline' },
          { key: 'bounded_work_orders', ready: mode !== 'locked', value: mode !== 'locked' },
        ],
        prohibitedCapabilities: ['civic_mutation', 'trade_routes', 'background_scheduling', 'arbitrary_tool_execution', 'resource_spending', 'atlas_owned_execution'],
      },
      projectionHash: 'hq10b-ui-world-grid',
    };
  }

  function makeState() {
    const state = {
      plot: {
        plotId,
        pairId: 'pair:hq10b-civic-proposal-ui',
        hqLevel: 10,
        townXp: 430,
        inventory: { wood: 150, stone: 130, food: 100, coin: 40 },
      },
      buildings: [{ buildingId: 'bldg_hq_hq10b_ui', type: 'HQ', x: 1, y: 0, level: 10, state: 'READY' }],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'civic-proposals', title: 'Record civic memory', body: 'Civic proposals are advisory records only.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      settlementClaims: [{ claimId: 'claim_hq10b_outpost', status: 'FOUNDED', foundedPlotId: 'plot_hq10b_outpost' }],
      ownedPlots: [],
      research: {},
      cohortPlanner: {},
      workOrderTemplates: [],
      workOrders: [],
      worldGrid: worldGrid(),
      civicProposals: civicModel(),
      publicSummary: {
        worldGridReady: true,
        worldGridStatus: 'READ_MODEL_READY',
        civicProposalCount: proposals().length,
        civicProposalReviewedCount: civicModel().counts.reviewedCount,
      },
      visualActors: [],
      audit: { stateHash: `hq10b-civic-proposal-ui-${mode}` },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        homePlotId: plotId,
        activePlotId: plotId,
        plots: [
          { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 10, active: true },
          { plotId: 'plot_hq10b_outpost', role: 'OUTPOST', title: 'First Outpost', hqLevel: 1, active: false },
        ],
        settlementClaims: [{ claimId: 'claim_hq10b_outpost', status: 'FOUNDED', foundedPlotId: 'plot_hq10b_outpost' }],
      }),
    });
  });

  await page.route('**/api/founders-plot/civic-proposals**', async (route) => {
    if (route.request().method() === 'POST') {
      capturedCreate = route.request().postDataJSON();
      expect(capturedCreate.plotId).toBe(plotId);
      expect(capturedCreate.title).toBe('Outpost welcome review');
      expect(capturedCreate.category).toBe('civic_memory');
      expect(capturedCreate.status).toBe('REVIEWED');
      expect(capturedCreate.summary).toContain('memory-only');
      expect(capturedCreate.actor).toBe('HUMAN');
      expect(capturedCreate.idempotencyKey).toMatch(/^fp-civic-proposal-/);
      await createGate;
      mode = 'created';
      const body = makeState();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...body, civicProposal: proposal('REVIEWED'), proposalOnly: true, executionAllowed: false, civicProposals: civicModel() }),
      });
      return;
    }
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, civicProposals: civicModel(), proposals: proposals() }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-civic-proposals-panel')).toBeVisible();
  await expect(page.getByTestId('fp-civic-proposals-status')).toContainText('LOCKED - proposal only');
  await expect(page.getByTestId('fp-civic-proposals-locked')).toContainText('Collect-ready work-order executor available');
  await expect(page.getByTestId('fp-civic-proposal-form')).toHaveCount(0);

  mode = 'available';
  await page.reload();
  await expect(page.getByTestId('fp-civic-proposals-status')).toContainText('RECORDING READY - proposal only');
  await expect(page.getByTestId('fp-civic-proposals-boundary')).toContainText('Records are for review and memory');
  await expect(page.getByTestId('fp-civic-proposal-form')).toBeVisible();
  await page.getByTestId('fp-civic-proposal-title').fill('Outpost welcome review');
  await page.getByTestId('fp-civic-proposal-category').selectOption('civic_memory');
  await page.getByTestId('fp-civic-proposal-status-select').selectOption('REVIEWED');
  await page.getByTestId('fp-civic-proposal-summary').fill('Review-only memory-only proposal for a future welcome board near the first outpost.');
  await page.getByTestId('fp-civic-proposal-review-note').fill('Reviewed as a record only.');
  await page.waitForTimeout(5_500);
  await expect(page.getByTestId('fp-civic-proposal-title')).toHaveValue('Outpost welcome review');
  await expect(page.getByTestId('fp-civic-proposal-category')).toHaveValue('civic_memory');
  await expect(page.getByTestId('fp-civic-proposal-status-select')).toHaveValue('REVIEWED');
  await expect(page.getByTestId('fp-civic-proposal-summary')).toHaveValue('Review-only memory-only proposal for a future welcome board near the first outpost.');
  await expect(page.getByTestId('fp-civic-proposal-review-note')).toHaveValue('Reviewed as a record only.');

  await page.getByTestId('fp-btn-create-civic-proposal').click();
  await expect(page.getByTestId('fp-btn-create-civic-proposal')).toHaveText('Recording...');
  releaseCreate();

  await expect(page.getByTestId(`fp-civic-proposal-status-${proposalId}`)).toContainText('REVIEWED');
  await expect(page.getByTestId(`fp-civic-proposal-${proposalId}`)).toContainText('proposalOnly true');
  await expect(page.getByTestId(`fp-civic-proposal-${proposalId}`)).toContainText('execution not implemented');
  await expect(page.getByTestId(`fp-civic-proposal-${proposalId}`)).toContainText('server_owned_civic_proposal_record_no_execution_v1');
  const panelButtons = await page.getByTestId('fp-civic-proposals-panel').getByRole('button').allTextContents();
  expect(panelButtons.join(' ')).not.toMatch(/\b(execute|apply|route|trade|spend|public|share|schedule)\b/i);
  expect(capturedCreate).toBeTruthy();
});

test('FP-E2E-018 UI records HQ10C Generated Universe overlay packs as presentation-only memory', async ({ page }) => {
  const plotId = 'plot_hq10c_overlay_pack_ui';
  const proposalId = 'civic_proposal_overlay_ui_001';
  const overlayPackId = 'overlay_pack_ui_001';
  let mode = 'locked';
  let capturedCreate = null;
  let releaseCreate = () => {};
  const createGate = new Promise((resolve) => { releaseCreate = resolve; });

  function proposal() {
    return {
      proposalId,
      plotId,
      status: 'REVIEWED',
      title: 'Lantern Welcome Review',
      category: 'civic_memory',
      summary: 'Reviewed civic memory for a presentation-only Generated Universe overlay pack.',
      scope: {
        source: 'world_grid_read_model',
        proposalOnly: true,
        executionAllowed: false,
        plotId,
        worldGridProjectionHash: 'hq10c-ui-world-grid',
        knownPlotCount: 2,
        outpostCount: 1,
        relatedPlotIds: ['plot_hq10c_outpost'],
      },
      review: {
        note: 'Reviewed as memory only for visual proposal records.',
        reviewedBy: 'HUMAN',
        reviewStatus: 'reviewed_record_only',
        executionDecision: 'not_executable',
      },
      authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
      createdBy: 'HUMAN',
      approvedBy: null,
      createdAt: 1700_030_000_000,
      updatedAt: 1700_030_000_000,
      reviewedAt: 1700_030_000_000,
      archivedAt: null,
    };
  }

  function proposals() {
    return mode === 'locked' ? [] : [proposal()];
  }

  function overlayPack() {
    return {
      overlayPackId,
      plotId,
      sourceProposalId: proposalId,
      status: 'DRAFT',
      title: 'Lantern Grid Overlay',
      theme: 'lantern_grid',
      summary: 'Presentation-only labels, skins, and display hints for World Grid and Atlas nodes.',
      targetSurfaceIds: ['progression_atlas', 'world_grid'],
      targetNodeIds: ['world_grid.read_model', 'generated_universe.overlay_pack_records'],
      displayHints: { labels: { world_grid: 'Lantern Grid' }, skins: ['lantern'] },
      prompt: {
        sanitizedPrompt: 'Warm civic lantern overlay, presentation only.',
        promptDigest: 'e16edc05edceabd7',
        redactionLevel: 'private_internal',
        rawPromptStored: false,
      },
      provenance: {
        source: 'founders_plot_overlay_pack_ui',
        provider: 'none',
        model: 'none',
        sourceProposalId: proposalId,
        publicSharing: false,
        externalEffects: false,
      },
      presentationOnly: true,
      visualOnly: true,
      gameplayMutationPolicy: 'presentation_only',
      authorityBoundary: 'server_owned_generated_universe_overlay_pack_presentation_only_v1',
      createdBy: 'HUMAN',
      approvedBy: null,
      createdAt: 1700_030_100_000,
      updatedAt: 1700_030_100_000,
      reviewedAt: null,
      archivedAt: null,
    };
  }

  function packs() {
    return mode === 'created' ? [overlayPack()] : [];
  }

  function civicModel() {
    const records = proposals();
    return {
      status: 'RECORDING_READY',
      title: 'Civic Proposal Records',
      implementation: 'hq10b_server_owned_civic_proposal_records_v1',
      proposalOnly: true,
      readOnlyExecution: true,
      authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
      allowedStatuses: ['DRAFT', 'REVIEWED', 'ARCHIVED'],
      allowedCategories: ['coordination', 'public_work', 'route_study', 'civic_memory'],
      requirements: {
        items: [
          { key: 'hq.level.6', label: 'HQ6 Settlement Charter', satisfied: true, current: 10, required: 6 },
          { key: 'settlement.outpost.founded', label: 'Founded outpost', satisfied: true, current: 1, required: 1 },
          { key: 'doctrine.survey_discipline.selected', label: 'Survey Discipline selected', satisfied: true, current: 'survey_discipline', required: 'survey_discipline' },
          { key: 'work_order.collect_ready_outputs_once.available', label: 'Collect-ready work-order executor available', satisfied: true, current: true, required: true },
        ],
        blockedBy: [],
        satisfiedCount: 4,
        totalCount: 4,
      },
      worldGridProjectionHash: 'hq10c-ui-world-grid',
      counts: {
        total: records.length,
        byStatus: { DRAFT: 0, REVIEWED: records.length, ARCHIVED: 0 },
        draftCount: 0,
        reviewedCount: records.length,
        archivedCount: 0,
      },
      proposals: records,
    };
  }

  function overlayModel() {
    const records = packs();
    const reviewed = proposals().length > 0;
    return {
      status: reviewed ? 'RECORDING_READY' : 'LOCKED',
      title: 'Generated Universe Overlay Packs',
      implementation: 'hq10c_server_owned_generated_universe_overlay_pack_records_v1',
      presentationOnly: true,
      visualOnly: true,
      gameplayMutationPolicy: 'presentation_only',
      stableGameplayHashExcluded: true,
      executableActions: [],
      publicSharing: false,
      renderingImplemented: false,
      authorityBoundary: 'server_owned_generated_universe_overlay_pack_presentation_only_v1',
      allowedStatuses: ['DRAFT', 'REVIEWED', 'ARCHIVED'],
      requirements: {
        items: [
          { key: 'hq.level.6', label: 'HQ6 Settlement Charter', satisfied: true, current: 10, required: 6 },
          { key: 'settlement.outpost.founded', label: 'Founded outpost', satisfied: true, current: 1, required: 1 },
          { key: 'doctrine.survey_discipline.selected', label: 'Survey Discipline selected', satisfied: true, current: 'survey_discipline', required: 'survey_discipline' },
          { key: 'work_order.collect_ready_outputs_once.available', label: 'Collect-ready work-order executor available', satisfied: true, current: true, required: true },
          { key: 'civic_proposal.reviewed', label: 'Reviewed civic proposal', satisfied: reviewed, current: reviewed ? 1 : 0, required: 1 },
        ],
        blockedBy: reviewed ? [] : ['civic_proposal.reviewed'],
        satisfiedCount: reviewed ? 5 : 4,
        totalCount: 5,
      },
      sourceProposalIds: reviewed ? [proposalId] : [],
      counts: {
        total: records.length,
        byStatus: { DRAFT: records.length, REVIEWED: 0, ARCHIVED: 0 },
        draftCount: records.length,
        reviewedCount: 0,
        archivedCount: 0,
      },
      packs: records,
    };
  }

  function worldGrid() {
    return {
      status: 'READ_MODEL_READY',
      readOnly: true,
      executableActions: [],
      authorityBoundary: 'server_owned_read_only_world_grid_projection_no_civic_mutation_v1',
      requirements: civicModel().requirements,
      scope: { homePlotId: plotId, activePlotId: plotId, knownPlotCount: 2, outpostCount: 1, knownClaimCount: 1 },
      claims: { total: 1, byStatus: { FOUNDED: 1 }, foundedOutpostCount: 1, foundedPlotIds: ['plot_hq10c_outpost'] },
      civicProposals: {
        proposalOnly: true,
        executionAllowed: false,
        authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
        total: proposals().length,
        byStatus: civicModel().counts.byStatus,
        latestProposalId: proposals()[0]?.proposalId || null,
      },
      civicReadiness: {
        ready: true,
        nextPromotableSlice: 'HQ10C_GENERATED_UNIVERSE_OVERLAY_PACK_RECORDS',
        blockedBy: [],
        signals: [
          { key: 'multi_plot_visibility', ready: true, value: 2 },
          { key: 'claim_receipts', ready: true, value: 1 },
          { key: 'doctrine_context', ready: true, value: 'survey_discipline' },
          { key: 'bounded_work_orders', ready: true, value: true },
        ],
        prohibitedCapabilities: ['civic_mutation', 'trade_routes', 'background_scheduling', 'arbitrary_tool_execution', 'resource_spending', 'atlas_owned_execution'],
      },
      projectionHash: 'hq10c-ui-world-grid',
    };
  }

  function makeState() {
    const state = {
      plot: {
        plotId,
        pairId: 'pair:hq10c-overlay-pack-ui',
        hqLevel: 10,
        townXp: 460,
        inventory: { wood: 150, stone: 130, food: 100, coin: 40 },
      },
      buildings: [{ buildingId: 'bldg_hq_hq10c_ui', type: 'HQ', x: 1, y: 0, level: 10, state: 'READY' }],
      jobs: [],
      policy: {},
      permissions: {},
      pendingApprovals: [],
      rewards: [],
      quest: { id: 'overlay-packs', title: 'Record Generated Universe memory', body: 'Overlay packs are presentation-only records.' },
      unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
      buildingDefs: {},
      hqUpgrade: null,
      scoutReports: [],
      sitePlans: [],
      settlementClaims: [{ claimId: 'claim_hq10c_outpost', status: 'FOUNDED', foundedPlotId: 'plot_hq10c_outpost' }],
      ownedPlots: [],
      research: {},
      cohortPlanner: {},
      workOrderTemplates: [],
      workOrders: [],
      worldGrid: worldGrid(),
      civicProposals: civicModel(),
      overlayPacks: overlayModel(),
      publicSummary: {
        worldGridReady: true,
        worldGridStatus: 'READ_MODEL_READY',
        civicProposalCount: proposals().length,
        civicProposalReviewedCount: civicModel().counts.reviewedCount,
        overlayPackCount: packs().length,
        overlayPackDraftCount: overlayModel().counts.draftCount,
      },
      visualActors: [],
      audit: { stateHash: `hq10c-overlay-pack-ui-${mode}` },
    };
    return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeState()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId,
        homePlotId: plotId,
        activePlotId: plotId,
        plots: [
          { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 10, active: true },
          { plotId: 'plot_hq10c_outpost', role: 'OUTPOST', title: 'First Outpost', hqLevel: 1, active: false },
        ],
        settlementClaims: [{ claimId: 'claim_hq10c_outpost', status: 'FOUNDED', foundedPlotId: 'plot_hq10c_outpost' }],
      }),
    });
  });

  await page.route('**/api/founders-plot/overlay-packs**', async (route) => {
    if (route.request().method() === 'POST') {
      capturedCreate = route.request().postDataJSON();
      expect(capturedCreate.plotId).toBe(plotId);
      expect(capturedCreate.sourceProposalId).toBe(proposalId);
      expect(capturedCreate.title).toBe('Lantern Grid Overlay');
      expect(capturedCreate.theme).toBe('lantern_grid');
      expect(capturedCreate.status).toBe('DRAFT');
      expect(capturedCreate.summary).toContain('Presentation-only');
      expect(capturedCreate.prompt).toContain('presentation only');
      expect(capturedCreate.targetSurfaceIds).toEqual(['progression_atlas', 'world_grid']);
      expect(capturedCreate.targetNodeIds).toContain('generated_universe.overlay_pack_records');
      expect(capturedCreate.actor).toBe('HUMAN');
      expect(capturedCreate.idempotencyKey).toMatch(/^fp-overlay-pack-/);
      await createGate;
      mode = 'created';
      const body = makeState();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...body,
          overlayPack: overlayPack(),
          pack: overlayPack(),
          presentationOnly: true,
          visualOnly: true,
          executionAllowed: false,
          gameplayMutationPolicy: 'presentation_only',
          overlayPacks: overlayModel(),
        }),
      });
      return;
    }
    const body = makeState();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...body, overlayPacks: overlayModel(), packs: packs() }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-overlay-packs-panel')).toBeVisible();
  await expect(page.getByTestId('fp-overlay-packs-status')).toContainText('LOCKED - presentation only');
  await expect(page.getByTestId('fp-overlay-packs-requirements')).toContainText('Blocked: Reviewed civic proposal');
  await expect(page.getByTestId('fp-overlay-packs-locked')).toContainText('civic proposal reviewed');
  await expect(page.getByTestId('fp-overlay-pack-form')).toHaveCount(0);

  mode = 'available';
  await page.reload();
  await expect(page.getByTestId('fp-overlay-packs-status')).toContainText('RECORDING READY - presentation only');
  await expect(page.getByTestId('fp-overlay-packs-boundary')).toContainText('presentation-only memory/proposal artifacts');
  await expect(page.getByTestId('fp-overlay-packs-omitted-capabilities')).toContainText('actual Generated Universe rendering');
  await expect(page.getByTestId('fp-overlay-pack-form')).toBeVisible();
  await page.getByTestId('fp-overlay-pack-source-proposal').selectOption(proposalId);
  await page.getByTestId('fp-overlay-pack-title').fill('Lantern Grid Overlay');
  await page.getByTestId('fp-overlay-pack-theme').fill('lantern_grid');
  await page.getByTestId('fp-overlay-pack-status-select').selectOption('DRAFT');
  await page.getByTestId('fp-overlay-pack-summary').fill('Presentation-only labels, skins, and display hints for World Grid and Atlas nodes.');
  await page.getByTestId('fp-overlay-pack-prompt').fill('Warm civic lantern overlay, presentation only.');
  await page.waitForTimeout(5_500);
  await expect(page.getByTestId('fp-overlay-pack-source-proposal')).toHaveValue(proposalId);
  await expect(page.getByTestId('fp-overlay-pack-title')).toHaveValue('Lantern Grid Overlay');
  await expect(page.getByTestId('fp-overlay-pack-theme')).toHaveValue('lantern_grid');
  await expect(page.getByTestId('fp-overlay-pack-status-select')).toHaveValue('DRAFT');
  await expect(page.getByTestId('fp-overlay-pack-summary')).toHaveValue('Presentation-only labels, skins, and display hints for World Grid and Atlas nodes.');
  await expect(page.getByTestId('fp-overlay-pack-prompt')).toHaveValue('Warm civic lantern overlay, presentation only.');

  await page.getByTestId('fp-btn-create-overlay-pack').click();
  await expect(page.getByTestId('fp-btn-create-overlay-pack')).toHaveText('Recording...');
  releaseCreate();

  await expect(page.getByTestId(`fp-overlay-pack-status-${overlayPackId}`)).toContainText('DRAFT');
  await expect(page.getByTestId(`fp-overlay-pack-${overlayPackId}`)).toContainText('presentationOnly true');
  await expect(page.getByTestId(`fp-overlay-pack-${overlayPackId}`)).toContainText('visualOnly true');
  await expect(page.getByTestId(`fp-overlay-pack-${overlayPackId}`)).toContainText('execution disabled');
  await expect(page.getByTestId(`fp-overlay-pack-${overlayPackId}`)).toContainText('raw prompt stored false');
  await expect(page.getByTestId(`fp-overlay-pack-${overlayPackId}`)).toContainText('public sharing false');
  await expect(page.getByTestId(`fp-overlay-pack-${overlayPackId}`)).toContainText('server_owned_generated_universe_overlay_pack_presentation_only_v1');
  await expect(page.getByTestId('fp-overlay-application-preview')).toBeVisible();
  await expect(page.getByTestId('fp-overlay-preview-active')).toContainText('No local overlay applied');
  await page.getByTestId('fp-overlay-pack-preview-select').selectOption(overlayPackId);
  await expect(page.getByTestId('fp-overlay-preview-world-grid')).toContainText('Lantern Grid');
  await expect(page.getByTestId('fp-overlay-preview-atlas')).toContainText('Lantern Grid Overlay');
  await page.getByTestId('fp-btn-apply-overlay-pack').click();
  await expect(page.getByTestId('fp-overlay-preview-active')).toContainText('Applied locally: Lantern Grid Overlay');
  await expect(page.getByTestId('fp-world-grid-local-overlay-proof')).toContainText('Lantern Grid Overlay');
  await expect(page.getByTestId('fp-world-grid-status')).toContainText('Lantern Grid');
  await expect(page.getByTestId('fp-overlay-preview-boundary')).toContainText('browser-local UI preview');
  const panelButtons = await page.getByTestId('fp-overlay-packs-panel').getByRole('button').allTextContents();
  expect(panelButtons.join(' ')).not.toMatch(/\b(execute|render|publish|share|trade|spend|schedule)\b/i);
  expect(capturedCreate).toBeTruthy();

  await page.getByTestId('fp-overlay-packs-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'reports/agent-town-hq10c-generated-universe-overlay-pack-ui-proof-2026-05-31.png', fullPage: true });
});

test('FP-E2E-019 UI applies HQ10C overlay pack as a local World Grid and Atlas preview', async ({ page }) => {
  await mockDenseFoundersPlotRoutes(page);

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-overlay-packs-panel')).toBeVisible();
  await page.getByTestId('fp-overlay-packs-panel').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('fp-overlay-application-preview')).toBeVisible();
  await expect(page.getByTestId('fp-overlay-preview-active')).toContainText('No local overlay applied');

  await page.getByTestId('fp-overlay-pack-preview-select').selectOption('overlay_pack_dense_mobile');
  await expect(page.getByTestId('fp-overlay-preview-world-grid')).toContainText('Dense Lantern');
  await expect(page.getByTestId('fp-overlay-preview-atlas')).toContainText('Dense Lantern Overlay');
  await page.getByTestId('fp-btn-apply-overlay-pack').click();

  await expect(page.getByTestId('fp-overlay-preview-active')).toContainText('Applied locally: Dense Lantern Overlay');
  await expect(page.getByTestId('fp-world-grid-local-overlay-proof')).toContainText('Dense Lantern Overlay');
  await expect(page.getByTestId('fp-world-grid-status')).toContainText('Dense Lantern');
  await expect(page.getByTestId('fp-world-grid-body')).toHaveAttribute('data-local-overlay-pack-id', 'overlay_pack_dense_mobile');
  await expect(page.getByTestId('fp-overlay-preview-boundary')).toContainText('browser-local UI preview');
  await page.screenshot({ path: 'reports/agent-town-hq10d-overlay-application-ui-desktop-2026-05-31.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId('fp-overlay-preview-active')).toContainText('Applied locally: Dense Lantern Overlay');
  await expect(page.getByTestId('fp-world-grid-local-overlay-proof')).toContainText('Dense Lantern Overlay');
  await page.getByTestId('fp-overlay-packs-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'reports/agent-town-hq10d-overlay-application-ui-mobile-2026-05-31.png', fullPage: true });
});

test('FP-E2E-020 UI preserves HQ10 form drafts across state polling and renders stored overlay records', async ({ page }) => {
  const civicProposalId = 'civic_proposal_poll_stable';
  const overlayPackId = 'overlay_pack_poll_stable';
  let stateHits = 0;
  let capturedCivic = null;
  let capturedOverlay = null;
  let createdCivic = null;
  let createdOverlay = null;

  function countStatuses(records) {
    return records.reduce((acc, record) => {
      const status = String(record?.status || 'DRAFT').toUpperCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  function makeEnvelope() {
    const envelope = denseFoundersPlotEnvelope();
    const baseCivics = envelope.state.civicProposals.proposals || [];
    const civicRecords = [...baseCivics, ...(createdCivic ? [createdCivic] : [])];
    const civicStatuses = countStatuses(civicRecords);
    envelope.state.civicProposals.proposals = civicRecords;
    envelope.state.civicProposals.counts = {
      total: civicRecords.length,
      byStatus: civicStatuses,
      draftCount: civicStatuses.DRAFT || 0,
      reviewedCount: civicStatuses.REVIEWED || 0,
      archivedCount: civicStatuses.ARCHIVED || 0,
    };

    const basePacks = envelope.state.overlayPacks.packs || [];
    const overlayRecords = [...basePacks, ...(createdOverlay ? [createdOverlay] : [])];
    const overlayStatuses = countStatuses(overlayRecords);
    envelope.state.overlayPacks.packs = [null, ...overlayRecords];
    envelope.state.overlayPacks.counts = {
      total: overlayRecords.length,
      byStatus: overlayStatuses,
      draftCount: overlayStatuses.DRAFT || 0,
      reviewedCount: overlayStatuses.REVIEWED || 0,
      archivedCount: overlayStatuses.ARCHIVED || 0,
    };
    envelope.state.publicSummary.civicProposalCount = civicRecords.length;
    envelope.state.publicSummary.civicProposalReviewedCount = civicStatuses.REVIEWED || 0;
    envelope.state.publicSummary.overlayPackCount = overlayRecords.length;
    envelope.state.publicSummary.overlayPackDraftCount = overlayStatuses.DRAFT || 0;
    envelope.state.audit.stateHash = `poll-stability-${stateHits}-${civicRecords.length}-${overlayRecords.length}`;
    envelope.stateHash = envelope.state.audit.stateHash;
    return envelope;
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    stateHits += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeEnvelope()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    const envelope = makeEnvelope();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId: envelope.plotId,
        homePlotId: envelope.plotId,
        activePlotId: envelope.plotId,
        plots: envelope.state.ownedPlots,
        settlementClaims: envelope.state.settlementClaims,
      }),
    });
  });

  await page.route('**/api/founders-plot/civic-proposals**', async (route) => {
    const envelope = makeEnvelope();
    if (route.request().method() === 'POST') {
      capturedCivic = route.request().postDataJSON();
      const source = envelope.state.civicProposals.proposals[0];
      createdCivic = {
        ...source,
        proposalId: civicProposalId,
        title: capturedCivic.title,
        category: capturedCivic.category,
        status: capturedCivic.status,
        summary: capturedCivic.summary,
        review: {
          note: capturedCivic.reviewNote,
          reviewedBy: 'HUMAN',
          reviewStatus: 'reviewed_record_only',
          executionDecision: 'not_executable',
        },
        createdAt: 1700_040_000_000,
        updatedAt: 1700_040_000_000,
        reviewedAt: 1700_040_000_000,
      };
      const body = makeEnvelope();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...body, civicProposal: createdCivic, civicProposals: body.state.civicProposals }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, plotId: envelope.plotId, civicProposals: envelope.state.civicProposals, proposals: envelope.state.civicProposals.proposals }),
    });
  });

  await page.route('**/api/founders-plot/overlay-packs**', async (route) => {
    const envelope = makeEnvelope();
    if (route.request().method() === 'POST') {
      capturedOverlay = route.request().postDataJSON();
      const source = envelope.state.overlayPacks.packs.find((pack) => pack?.overlayPackId === 'overlay_pack_dense_mobile');
      createdOverlay = {
        ...source,
        overlayPackId,
        sourceProposalId: capturedOverlay.sourceProposalId,
        title: capturedOverlay.title,
        theme: capturedOverlay.theme,
        status: capturedOverlay.status,
        summary: capturedOverlay.summary,
        prompt: {
          sanitizedPrompt: capturedOverlay.prompt,
          promptDigest: 'pollstable123456',
          rawPromptStored: false,
        },
        displayHints: {
          labels: { world_grid: capturedOverlay.title, generated_universe: capturedOverlay.title },
          notes: capturedOverlay.summary,
          colorway: capturedOverlay.theme,
        },
        createdAt: 1700_040_100_000,
        updatedAt: 1700_040_100_000,
      };
      const body = makeEnvelope();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...body, overlayPack: createdOverlay, overlayPacks: body.state.overlayPacks }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, plotId: envelope.plotId, overlayPacks: envelope.state.overlayPacks, packs: envelope.state.overlayPacks.packs }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-overlay-pack-overlay_pack_dense_mobile')).toContainText('Dense Lantern Overlay');

  await page.getByTestId('fp-civic-proposal-title').fill('Poll stable civic proposal');
  await page.getByTestId('fp-civic-proposal-category').selectOption('civic_memory');
  await page.getByTestId('fp-civic-proposal-status-select').selectOption('REVIEWED');
  await page.getByTestId('fp-civic-proposal-summary').fill('Typed civic proposal draft should survive the 5s state poll before submit.');
  await page.getByTestId('fp-civic-proposal-review-note').fill('Poll-stability review note.');
  const beforeCivicPoll = stateHits;
  await expect.poll(() => stateHits, { timeout: 7_000 }).toBeGreaterThan(beforeCivicPoll);
  await expect(page.getByTestId('fp-civic-proposal-title')).toHaveValue('Poll stable civic proposal');
  await expect(page.getByTestId('fp-civic-proposal-category')).toHaveValue('civic_memory');
  await expect(page.getByTestId('fp-civic-proposal-status-select')).toHaveValue('REVIEWED');
  await expect(page.getByTestId('fp-civic-proposal-summary')).toHaveValue('Typed civic proposal draft should survive the 5s state poll before submit.');
  await expect(page.getByTestId('fp-civic-proposal-review-note')).toHaveValue('Poll-stability review note.');
  await page.getByTestId('fp-btn-create-civic-proposal').click();
  await expect(page.getByTestId(`fp-civic-proposal-status-${civicProposalId}`)).toContainText('REVIEWED');

  await page.getByTestId('fp-overlay-pack-source-proposal').selectOption('civic_proposal_dense_overlay_source');
  await page.getByTestId('fp-overlay-pack-title').fill('Poll Stable Overlay');
  await page.getByTestId('fp-overlay-pack-theme').fill('poll_stable_lantern');
  await page.getByTestId('fp-overlay-pack-status-select').selectOption('DRAFT');
  await page.getByTestId('fp-overlay-pack-summary').fill('Typed overlay draft should survive the 5s state poll before submit.');
  await page.getByTestId('fp-overlay-pack-prompt').fill('Poll-stable lantern overlay, presentation only.');
  const beforeOverlayPoll = stateHits;
  await expect.poll(() => stateHits, { timeout: 7_000 }).toBeGreaterThan(beforeOverlayPoll);
  await expect(page.getByTestId('fp-overlay-pack-source-proposal')).toHaveValue('civic_proposal_dense_overlay_source');
  await expect(page.getByTestId('fp-overlay-pack-title')).toHaveValue('Poll Stable Overlay');
  await expect(page.getByTestId('fp-overlay-pack-theme')).toHaveValue('poll_stable_lantern');
  await expect(page.getByTestId('fp-overlay-pack-status-select')).toHaveValue('DRAFT');
  await expect(page.getByTestId('fp-overlay-pack-summary')).toHaveValue('Typed overlay draft should survive the 5s state poll before submit.');
  await expect(page.getByTestId('fp-overlay-pack-prompt')).toHaveValue('Poll-stable lantern overlay, presentation only.');
  await page.getByTestId('fp-btn-create-overlay-pack').click();
  await expect(page.getByTestId(`fp-overlay-pack-status-${overlayPackId}`)).toContainText('DRAFT');
  await expect(page.getByTestId(`fp-overlay-pack-${overlayPackId}`)).toContainText('presentationOnly true');
  expect(capturedCivic).toMatchObject({ title: 'Poll stable civic proposal', status: 'REVIEWED' });
  expect(capturedOverlay).toMatchObject({ title: 'Poll Stable Overlay', theme: 'poll_stable_lantern' });

  await page.getByTestId('fp-overlay-packs-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'reports/agent-town-hq10-form-poll-stability-fix-proof-2026-05-31.png', fullPage: true });
});

test('FP-E2E-021 UI inspects an active civic project through the bounded HQ11 route', async ({ page }) => {
  const civicProjectId = 'civic_project_living_world_001';
  const operationId = 'civic_operation_beacon_round_002';
  let inspected = false;
  let capturedInspection = null;

  function makeEnvelope() {
    const envelope = denseFoundersPlotEnvelope();
    const { plotId } = envelope;
    const inspectionReceipt = inspected
      ? {
        kind: 'civic_project_inspection',
        actionName: 'et.plot.inspect_civic_project',
        projectId: civicProjectId,
        inspectionType: 'baseline_readiness',
        inspectedBy: 'HUMAN',
        authorityBoundary: 'server_owned_civic_project_inspection_baseline_readiness_v1',
        inspectedAt: 1700_050_400_000,
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        backgroundScheduling: false,
        externalEffects: false,
        atlasExecution: false,
        crossPlotMutation: false,
      }
      : null;
    const civicProject = {
      projectId: civicProjectId,
      plotId,
      sourceProposalId: 'civic_proposal_dense_overlay_source',
      status: 'ACTIVE',
      projectType: 'civic_beacon',
      title: 'Civic Beacon',
      summary: 'Local public-work beacon lit from a reviewed civic proposal.',
      effect: {
        effectId: 'local_civic_beacon_v1',
        kind: 'local_civic_beacon',
        scope: 'local_plot',
        readinessDelta: 1,
        moraleMarker: 'civic_beacon_lit',
        publicWork: true,
        visibleInWorldGrid: true,
        resourceDelta: {},
        routeCreation: false,
        tradeRouteCreation: false,
        backgroundScheduling: false,
        externalEffects: false,
        inspection: inspected
          ? { baselineReadinessInspected: true, inspectionCount: 1, latestInspectedAt: 1700_050_400_000 }
          : { baselineReadinessInspected: false, inspectionCount: 0 },
      },
      receipt: {
        kind: 'civic_project_activation',
        worldGridProjectionHash: 'living-world-hq11-proof',
        routeCreation: false,
        backgroundScheduling: false,
        externalEffects: false,
        inspections: inspectionReceipt ? [inspectionReceipt] : [],
      },
      authorityBoundary: 'server_owned_civic_project_activation_local_public_work_v1',
      createdBy: 'HUMAN',
      approvedBy: null,
      createdAt: 1700_050_000_000,
      updatedAt: 1700_050_000_000,
      activatedAt: 1700_050_000_000,
    };
    const civicOperations = {
      status: 'AVAILABLE',
      implementation: 'hq11_server_owned_civic_operations_v1',
      authorityBoundary: 'server_owned_civic_operation_local_living_world_v1',
      operationAllowed: true,
      allowedOperationTypes: ['beacon_round'],
      counts: { total: 2, completedCount: 2, beaconRoundCount: 2 },
      activeEffects: {
        localCareScore: 2,
        maxLocalCareScore: 3,
        moraleMarkers: ['civic_rounds_started', 'civic_rounds_observed'],
      },
      lifecycle: { phase: 'beacon_rounds', status: 'observing', next: 'civic_rounds_stable' },
      readiness: {
        items: [
          { key: 'active_civic_beacon', label: 'Active Civic Beacon', ready: true },
          { key: 'world_grid.ready', label: 'World Grid ready', ready: true },
        ],
        blockedBy: [],
      },
      progress: { current: 2, max: 3, percent: 67, label: '2/3 local care' },
      operations: [
        {
          operationId,
          projectId: civicProjectId,
          operationType: 'beacon_round',
          status: 'COMPLETED',
          title: 'Beacon Round',
          summary: 'Completed local check-in around the Civic Beacon.',
          effect: { effectId: 'local_beacon_round_v1' },
          authorityBoundary: 'server_owned_civic_operation_local_living_world_v1',
          createdAt: 1700_050_200_000,
          updatedAt: 1700_050_200_000,
        },
      ],
    };
    envelope.state.civicProjects = {
      status: 'ACTIVE',
      title: 'Civic Project Activation',
      implementation: 'hq10d_server_owned_civic_project_activation_v1',
      activationAllowed: true,
      publicWork: true,
      authorityBoundary: 'server_owned_civic_project_activation_local_public_work_v1',
      allowedProjectTypes: ['civic_beacon'],
      counts: { total: 1, activeCount: 1, archivedCount: 0, byStatus: { ACTIVE: 1, ARCHIVED: 0 }, byType: { civic_beacon: 1 } },
      activeEffects: { localCivicBeacon: true, activeBeaconCount: 1, localReadinessDelta: 1, moraleMarkers: ['civic_beacon_lit'] },
      projects: [civicProject],
    };
    envelope.state.civicOperations = civicOperations;
    envelope.state.worldGrid.civicProjects = {
      publicWork: true,
      activationAllowed: true,
      authorityBoundary: 'server_owned_civic_project_activation_local_public_work_v1',
      total: 1,
      activeCount: 1,
      byStatus: { ACTIVE: 1, ARCHIVED: 0 },
      byType: { civic_beacon: 1 },
      localCivicBeaconActive: true,
      localReadinessDelta: 1,
      inspectionCount: inspected ? 1 : 0,
      baselineInspectedCount: inspected ? 1 : 0,
      inspectionReadinessDelta: inspected ? 1 : 0,
      latestProjectId: civicProjectId,
    };
    envelope.state.worldGrid.civicOperations = {
      localOnly: true,
      operationAllowed: true,
      total: 2,
      completedBeaconRounds: 2,
      localCareScore: 2,
      maxLocalCareScore: 3,
      latestOperationId: operationId,
      authorityBoundary: 'server_owned_civic_operation_local_living_world_v1',
      lifecycle: civicOperations.lifecycle,
      readiness: civicOperations.readiness,
      progress: civicOperations.progress,
    };
    envelope.state.worldGrid.civicReadiness.nextPromotableSlice = 'HQ11_CIVIC_OPERATIONS';
    envelope.state.worldGrid.civicReadiness.localProjectReadinessScore = 1;
    envelope.state.worldGrid.civicReadiness.moraleMarkers = ['civic_beacon_lit', 'civic_rounds_started', 'civic_rounds_observed'];
    envelope.state.worldGrid.civicReadiness.signals = [
      ...envelope.state.worldGrid.civicReadiness.signals,
      { key: 'local_civic_beacon', ready: true, value: 1 },
      { key: 'local_civic_operations', ready: true, value: 2 },
    ];
    envelope.state.publicSummary.civicProjectCount = 1;
    envelope.state.publicSummary.civicProjectActiveCount = 1;
    envelope.state.publicSummary.civicBeaconActive = true;
    envelope.state.publicSummary.civicReadinessScore = 1;
    envelope.stateHash = 'hq11-civic-operations-ui-proof';
    envelope.state.audit.stateHash = envelope.stateHash;
    return envelope;
  }

  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeEnvelope()),
    });
  });

  await page.route('**/api/founders-plot/plots**', async (route) => {
    const envelope = makeEnvelope();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId: envelope.plotId,
        homePlotId: envelope.plotId,
        activePlotId: envelope.plotId,
        plots: envelope.state.ownedPlots,
        settlementClaims: envelope.state.settlementClaims,
      }),
    });
  });

  await page.route('**/api/founders-plot/civic-projects**', async (route) => {
    if (route.request().method() === 'POST' && route.request().url().includes('/inspect')) {
      capturedInspection = route.request().postDataJSON();
      expect(capturedInspection).toMatchObject({
        plotId: 'plot_dense_mobile_followup',
        projectId: civicProjectId,
        inspectionType: 'baseline_readiness',
        actor: 'HUMAN',
      });
      expect(capturedInspection.idempotencyKey).toMatch(/^fp-inspect-civic-project-civic_project_living_world_001-/);
      inspected = true;
      const envelope = makeEnvelope();
      const project = envelope.state.civicProjects.projects[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...envelope,
          civicProject: project,
          project,
          inspection: project.receipt.inspections[0],
          alreadyInspected: false,
          inspectionApplied: true,
          civicProjects: envelope.state.civicProjects,
        }),
      });
      return;
    }
    const envelope = makeEnvelope();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId: envelope.plotId,
        worldDelta: [],
        civicProjects: envelope.state.civicProjects,
        projects: envelope.state.civicProjects.projects,
      }),
    });
  });

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-civic-operations-panel')).toBeVisible();
  await expect(page.getByTestId('fp-civic-operations-status')).toContainText('Civic Operations');
  await expect(page.getByTestId('fp-civic-operations-status')).toContainText('AVAILABLE - SERVER READ MODEL');
  await expect(page.getByTestId('fp-civic-operations-status')).toContainText('1 civic project tracked');
  await expect(page.getByTestId('fp-civic-operations-status')).toContainText('1 active public work');
  await expect(page.getByTestId('fp-civic-operations-status')).toContainText('readiness +1');
  await expect(page.getByTestId('fp-civic-operations-metrics')).toContainText('Care');
  await expect(page.getByTestId('fp-civic-operations-metrics')).toContainText('2/3');
  await expect(page.getByTestId('fp-civic-operations-boundary')).toContainText('records one human inspection receipt');
  await expect(page.getByTestId('fp-civic-operations-boundary')).toContainText('Atlas control');
  await expect(page.getByTestId('fp-civic-operations-progress')).toContainText('2/3 local care');
  await expect(page.getByTestId('fp-civic-operations-progress')).toContainText('2 server receipts');
  await expect(page.getByTestId('fp-civic-operations-progress-meter')).toHaveAttribute('aria-valuenow', '67');
  await expect(page.getByTestId('fp-civic-operations-readiness')).toContainText('Ready: Active Civic Beacon');
  await expect(page.getByTestId('fp-civic-operations-readiness')).toContainText('Ready: local civic operations');
  await expect(page.getByTestId('fp-civic-operation-project-civic_project_living_world_001')).toContainText('Civic Beacon');
  await expect(page.getByTestId('fp-civic-operation-project-civic_project_living_world_001')).toContainText('readiness +1');
  await expect(page.getByTestId('fp-civic-operation-project-civic_project_living_world_001')).toContainText('baseline readiness pending');
  await expect(page.getByTestId(`fp-civic-operation-receipt-${operationId}`)).toContainText('Beacon Round');
  await expect(page.getByTestId('fp-civic-project-inspection')).toContainText('Next action: inspect the active work');
  await expect(page.getByTestId('fp-civic-project-inspection')).toContainText('HUMAN INSPECTION READY');
  await expect(page.getByTestId('fp-civic-project-inspection')).toContainText('one receipt only');
  await expect(page.getByTestId(`fp-btn-inspect-civic-project-${civicProjectId}`)).toBeVisible();
  await expect(page.getByTestId(`fp-btn-inspect-civic-project-${civicProjectId}`)).toHaveText('Record Inspection Receipt');
  const civicOperationButtons = (await page.getByTestId('fp-civic-operations-panel').locator('button').allTextContents()).join(' ');
  expect(civicOperationButtons).not.toMatch(/\b(execute|apply|render|publish|share|trade|spend|schedule|route)\b/i);
  await page.getByTestId(`fp-btn-inspect-civic-project-${civicProjectId}`).click();
  await expect(page.getByTestId('fp-civic-project-inspection')).toContainText('RECEIPT RECORDED');
  await expect(page.getByTestId('fp-civic-project-inspection')).toContainText('Receipt stored by server');
  await expect(page.getByTestId('fp-civic-project-inspection-receipt')).toContainText('Project');
  await expect(page.getByTestId('fp-civic-project-inspection-receipt')).toContainText('Civic Beacon');
  await expect(page.getByTestId('fp-civic-project-inspection-receipt')).toContainText('Actor');
  await expect(page.getByTestId('fp-civic-project-inspection-receipt')).toContainText('HUMAN');
  await expect(page.getByTestId(`fp-btn-inspect-civic-project-${civicProjectId}`)).toHaveCount(0);
  await expect(page.getByTestId('fp-civic-operation-project-civic_project_living_world_001')).toContainText('baseline readiness inspected');
  expect(capturedInspection).toBeTruthy();

  await page.getByTestId('fp-civic-operations-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'reports/agent-town-hq11-user-ready-ux-polish-desktop-2026-05-31.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByTestId('fp-civic-operations-panel').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('fp-civic-operations-progress')).toContainText('2/3 local care');
  await expect(page.getByTestId('fp-civic-project-inspection')).toContainText('RECEIPT RECORDED');
  const mobileWidths = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(mobileWidths.doc).toBeLessThanOrEqual(mobileWidths.viewport);
  expect(mobileWidths.body).toBeLessThanOrEqual(mobileWidths.viewport);
  await page.screenshot({ path: 'reports/agent-town-hq11-user-ready-ux-polish-mobile-2026-05-31.png', fullPage: true });
});

test('FP-E2E-015 mobile dense Founders Plot fits a 390px viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockDenseFoundersPlotRoutes(page);

  await page.goto('/founders-plot');
  await expect(page.getByTestId('fp-root')).toBeVisible();
  await expect(page.getByTestId('fp-world-grid-panel')).toBeVisible();

  const layout = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const selectors = [
      '.fp-header',
      '.fp-main',
      '.fp-plot__scene',
      '.fp-side',
      '.fp-panel',
      '.fp-scout-report',
      '.fp-site-plan',
      '.fp-settlement-claim',
      '.fp-doctrine-card',
      '.fp-work-order-card',
      '.fp-world-grid-card',
      '.fp-civic-proposal-card',
      '.fp-civic-proposal-form',
      '.fp-overlay-pack-card',
      '.fp-overlay-pack-form',
      '.fp-overlay-preview-card',
    ];
    const clipped = Array.from(document.querySelectorAll(selectors.join(',')))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          testid: node.getAttribute('data-testid') || node.className,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((entry) => entry.width > 0 && (entry.left < -1 || entry.right > viewport + 1));
    return {
      viewport,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      clipped,
    };
  });

  expect(layout.documentScrollWidth).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.clipped).toEqual([]);
  await page.screenshot({ path: 'reports/agent-town-hq10c-generated-universe-overlay-pack-ui-mobile-proof-2026-05-31.png', fullPage: true });
});

test('FP-E2E-016 dense 3x3 Expedition Board tile selects and exposes scout affordance', async ({ page }) => {
  await mockDenseFoundersPlotRoutes(page);

  await page.goto('/founders-plot');
  await expect(page.getByTestId('founders-plot-stage')).toBeVisible();
  await expect(page.getByTestId('fp-tile-2-1')).toHaveAttribute('aria-label', /Expedition Board/);

  await page.getByTestId('fp-tile-2-1').click();

  await expect(page.getByTestId('fp-building-panel')).toContainText('Expedition Board');
  await expect(page.getByTestId('fp-production-requirements-EXPEDITION_BOARD')).toContainText('food: 80/6');
  await expect(page.getByTestId('fp-production-requirements-EXPEDITION_BOARD')).toContainText('wood: 120/4');
  await expect(page.getByTestId('fp-btn-scout')).toBeVisible();
});

async function mockDenseFoundersPlotRoutes(page) {
  const envelope = denseFoundersPlotEnvelope();
  await page.route('**/api/founders-plot/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(envelope),
    });
  });
  await page.route('**/api/founders-plot/plots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        plotId: envelope.plotId,
        homePlotId: envelope.plotId,
        activePlotId: envelope.plotId,
        plots: envelope.state.ownedPlots,
        settlementClaims: envelope.state.settlementClaims,
      }),
    });
  });
}

function denseFoundersPlotEnvelope() {
  const plotId = 'plot_dense_mobile_followup';
  const pairId = 'pair:dense-mobile-followup';
  const now = 1700_010_000_000;
  const buildings = [
    { buildingId: 'bldg_lumber_dense', type: 'LUMBER_CAMP', x: 0, y: 0, level: 2, state: 'OUTPUT_READY', outputBuffer: { wood: 14 } },
    { buildingId: 'bldg_hq_dense', type: 'HQ', x: 1, y: 0, level: 10, state: 'READY' },
    { buildingId: 'bldg_farm_dense', type: 'FARM_PLOT', x: 2, y: 0, level: 2, state: 'READY', canQueue: true },
    { buildingId: 'bldg_quarry_dense', type: 'QUARRY', x: 0, y: 1, level: 2, state: 'READY', canQueue: true },
    { buildingId: 'bldg_workshop_dense', type: 'WORKSHOP', x: 1, y: 1, level: 1, state: 'READY', canQueue: true },
    { buildingId: 'bldg_expedition_board_dense', type: 'EXPEDITION_BOARD', x: 2, y: 1, level: 1, state: 'READY', canQueue: true },
    { buildingId: 'bldg_market_dense', type: 'MARKET_STALL', x: 0, y: 2, level: 1, state: 'READY', canQueue: true },
    { buildingId: 'bldg_lumber_aux_dense', type: 'LUMBER_CAMP', x: 1, y: 2, level: 1, state: 'READY', canQueue: true },
    { buildingId: 'bldg_farm_aux_dense', type: 'FARM_PLOT', x: 2, y: 2, level: 1, state: 'OUTPUT_READY', outputBuffer: { food: 8 } },
  ];
  const scoutReport = {
    reportId: 'scout_report_dense_forest_ridge',
    originPlotId: plotId,
    title: 'Forest Ridge Survey',
    summary: 'A nearby ridge has timber, surface stone, and enough flat ground for a future outpost.',
    siteType: 'forest_edge',
    risk: 'low',
    traits: ['wood-rich', 'sheltered', 'near road'],
    sequence: 2,
    recommendedNext: 'Save this report as the first candidate for a later Site Plan draft.',
    createdAt: now - 600_000,
  };
  const sitePlan = {
    planId: 'site_plan_dense_forest_ridge',
    reportId: scoutReport.reportId,
    originPlotId: plotId,
    title: 'Forest Ridge Survey Site Plan',
    summary: 'Balanced settlement plan from Forest Ridge Survey. A nearby ridge has timber, surface stone, and enough flat ground for a future outpost.',
    focus: 'balanced',
    siteType: 'forest_edge',
    risk: 'low',
    traits: ['wood-rich', 'sheltered', 'near road'],
    status: 'FOUNDED',
    promotionStatus: 'settlement_founded',
    reviewStatus: 'reviewed',
    authorityBoundary: 'claim_ready_planning_only_no_territory',
    claimId: 'claim_dense_forest_ridge',
    foundedPlotId: 'plot_dense_forest_outpost',
    reviewedAt: now - 500_000,
    createdAt: now - 550_000,
  };
  const claim = {
    claimId: 'claim_dense_forest_ridge',
    ownerPairId: pairId,
    originPlotId: plotId,
    sitePlanId: sitePlan.planId,
    reportId: scoutReport.reportId,
    foundedPlotId: 'plot_dense_forest_outpost',
    convoyJobId: 'job_dense_convoy',
    status: 'FOUNDED',
    title: 'Forest Ridge Survey Site Plan',
    focus: 'balanced',
    siteType: 'forest_edge',
    risk: 'low',
    traits: ['wood-rich', 'sheltered', 'near road'],
    cost: { wood: 32, food: 20, stone: 12, coin: 8 },
    receipt: { kind: 'settlement_founded', foundedPlotId: 'plot_dense_forest_outpost' },
    createdBy: 'HUMAN',
    createdAt: now - 450_000,
    updatedAt: now - 300_000,
    foundedAt: now - 300_000,
  };
  const workOrder = {
    workOrderId: 'work_order_dense_collect_once',
    plotId,
    templateId: 'collect_ready_outputs_once',
    status: 'COMPLETED',
    title: 'Collect Ready Outputs Once',
    scope: { mode: 'all_ready_outputs', plotId, buildingIds: [], targetState: 'OUTPUT_READY', maxBuildings: 2 },
    allowedActions: ['et.plot.collect_outputs'],
    caps: {
      maxChildActions: 2,
      maxResourceSpend: { wood: 0, stone: 0, food: 0, coin: 0 },
      maxRuntimeMs: 120000,
      allowedPlotScope: 'current_plot_only',
    },
    childReceipts: [
      { parentWorkOrderId: 'work_order_dense_collect_once', childAction: 'et.plot.collect_outputs', buildingId: 'bldg_lumber_dense' },
      { parentWorkOrderId: 'work_order_dense_collect_once', childAction: 'et.plot.collect_outputs', buildingId: 'bldg_farm_aux_dense' },
    ],
    createdBy: 'HUMAN',
    createdAt: now - 120_000,
    updatedAt: now - 30_000,
    expiresAt: now + 24 * 60 * 60 * 1000,
  };
  const worldGrid = {
    status: 'READ_MODEL_READY',
    readOnly: true,
    executableActions: [],
    authorityBoundary: 'server_owned_read_only_world_grid_projection_no_civic_mutation_v1',
    requirements: {
      items: [
        { key: 'hq.level.6', label: 'HQ6 Settlement Charter', satisfied: true, current: 10, required: 6 },
        { key: 'settlement.outpost.founded', label: 'Founded outpost', satisfied: true, current: 1, required: 1 },
        { key: 'doctrine.survey_discipline.selected', label: 'Survey Discipline selected', satisfied: true, current: 'survey_discipline', required: 'survey_discipline' },
        { key: 'work_order.collect_ready_outputs_once.available', label: 'Collect-ready work-order executor available', satisfied: true, current: true, required: true },
      ],
      blockedBy: [],
      satisfiedCount: 4,
      totalCount: 4,
    },
    scope: { homePlotId: plotId, activePlotId: plotId, knownPlotCount: 2, outpostCount: 1, knownClaimCount: 1 },
    claims: { total: 1, byStatus: { FOUNDED: 1 }, foundedOutpostCount: 1, foundedPlotIds: ['plot_dense_forest_outpost'] },
    doctrine: { selectedDoctrineId: 'survey_discipline', status: 'SELECTED', activeEffects: [{ effectKind: 'scout_duration_modifier', reductionPct: 5 }] },
    workOrders: { draftCount: 0, completedCount: 1, executionAvailable: true, templateIds: ['collect_ready_outputs_once'] },
    civicReadiness: {
      ready: true,
      nextPromotableSlice: 'HQ10B_CIVIC_PROPOSAL_RECORDS',
      blockedBy: [],
      signals: [
        { key: 'multi_plot_visibility', ready: true, value: 2 },
        { key: 'claim_receipts', ready: true, value: 1 },
        { key: 'doctrine_context', ready: true, value: 'survey_discipline' },
        { key: 'bounded_work_orders', ready: true, value: true },
      ],
      prohibitedCapabilities: ['civic_mutation', 'trade_routes', 'background_scheduling', 'arbitrary_tool_execution', 'resource_spending', 'atlas_owned_execution'],
    },
    projectionHash: 'dense-followup-world-grid',
  };
  const civicProposal = {
    proposalId: 'civic_proposal_dense_overlay_source',
    plotId,
    status: 'REVIEWED',
    title: 'Dense Mobile Civic Memory',
    category: 'civic_memory',
    summary: 'Reviewed civic memory used as the source for one presentation-only overlay record.',
    scope: { proposalOnly: true, executionAllowed: false, plotId, knownPlotCount: 2, outpostCount: 1 },
    review: { reviewStatus: 'reviewed_record_only', executionDecision: 'not_executable', reviewedBy: 'HUMAN' },
    authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
    createdBy: 'HUMAN',
    createdAt: now - 250_000,
    updatedAt: now - 250_000,
    reviewedAt: now - 250_000,
  };
  const overlayPack = {
    overlayPackId: 'overlay_pack_dense_mobile',
    plotId,
    sourceProposalId: civicProposal.proposalId,
    status: 'DRAFT',
    title: 'Dense Lantern Overlay',
    theme: 'lantern_grid',
    summary: 'Presentation-only labels and display hints for dense mobile proof.',
    targetSurfaceIds: ['progression_atlas', 'world_grid'],
    targetNodeIds: ['world_grid.read_model', 'generated_universe.overlay_pack_records'],
    displayHints: { labels: { world_grid: 'Dense Lantern' }, skins: ['lantern'] },
    prompt: { sanitizedPrompt: 'Warm lantern overlay, presentation only.', promptDigest: 'dense1234abcd5678', rawPromptStored: false },
    provenance: { source: 'dense_mobile_fixture', provider: 'none', model: 'none', publicSharing: false, externalEffects: false },
    presentationOnly: true,
    visualOnly: true,
    gameplayMutationPolicy: 'presentation_only',
    authorityBoundary: 'server_owned_generated_universe_overlay_pack_presentation_only_v1',
    createdBy: 'HUMAN',
    createdAt: now - 200_000,
    updatedAt: now - 200_000,
    reviewedAt: null,
    archivedAt: null,
  };
  const overlayPacks = {
    status: 'RECORDING_READY',
    title: 'Generated Universe Overlay Packs',
    implementation: 'hq10c_server_owned_generated_universe_overlay_pack_records_v1',
    presentationOnly: true,
    visualOnly: true,
    gameplayMutationPolicy: 'presentation_only',
    stableGameplayHashExcluded: true,
    executableActions: [],
    publicSharing: false,
    renderingImplemented: false,
    authorityBoundary: 'server_owned_generated_universe_overlay_pack_presentation_only_v1',
    allowedStatuses: ['DRAFT', 'REVIEWED', 'ARCHIVED'],
    requirements: {
      items: [
        ...(worldGrid.requirements.items || []),
        { key: 'civic_proposal.reviewed', label: 'Reviewed civic proposal', satisfied: true, current: 1, required: 1 },
      ],
      blockedBy: [],
      satisfiedCount: 5,
      totalCount: 5,
    },
    sourceProposalIds: [civicProposal.proposalId],
    counts: { total: 1, byStatus: { DRAFT: 1, REVIEWED: 0, ARCHIVED: 0 }, draftCount: 1, reviewedCount: 0, archivedCount: 0 },
    packs: [overlayPack],
  };
  const state = {
    plot: {
      plotId,
      pairId,
      hqLevel: 10,
      townXp: 420,
      inventory: { wood: 120, stone: 95, food: 80, coin: 28 },
      storageCaps: { wood: 220, stone: 220, food: 220 },
      doctrineState: { status: 'SELECTED', selectedDoctrineId: 'survey_discipline', selectedAt: now - 240_000, selectedBy: 'HUMAN' },
    },
    pads: Array.from({ length: 9 }, (_, index) => ({ x: index % 3, y: Math.floor(index / 3) })),
    buildings,
    jobs: [],
    policy: {},
    permissions: {},
    pendingApprovals: [],
    rewards: [],
    quest: { id: 'world-grid', title: 'Keep the settlement honest', body: 'Use bounded work orders and the read-only World Grid to plan the next civic slice.' },
    unlockedBuildings: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'EXPEDITION_BOARD', 'WORKSHOP', 'MARKET_STALL'],
    buildingDefs: {},
    hqUpgrade: null,
    scoutReports: [scoutReport],
    sitePlans: [sitePlan],
    settlementClaims: [claim],
    ownedPlots: [
      { plotId, role: 'HOME', title: 'Founders Plot', hqLevel: 10, townXp: 420, status: 'ACTIVE', active: true },
      { plotId: 'plot_dense_forest_outpost', role: 'OUTPOST', title: 'Forest Ridge Survey Site Plan', hqLevel: 1, townXp: 0, status: 'ACTIVE', active: false },
    ],
    activePlotId: plotId,
    homePlotId: plotId,
    research: {
      lodge: { status: 'OPERATIONAL_READY', title: 'Research Lodge', buildingRequired: false, engineOwnedEffect: true },
      doctrineState: { status: 'SELECTED', selectedDoctrineId: 'survey_discipline', selectedAt: now - 240_000, selectedBy: 'HUMAN' },
      selectedDoctrine: {
        doctrineId: 'survey_discipline',
        title: 'Survey Discipline',
        summary: 'Research Lodge doctrine that trims Expedition Board SCOUT job duration by 5% while preserving costs, outputs, and settlement rules.',
        selected: true,
      },
      activeEffects: [{ doctrineId: 'survey_discipline', effectKind: 'scout_duration_modifier', buildingType: 'EXPEDITION_BOARD', jobKind: 'SCOUT', durationMultiplier: 0.95, reductionPct: 5 }],
      doctrineCatalog: [],
    },
    cohortPlanner: {
      status: 'DRAFTING_READY',
      title: 'Cohort Work Orders',
      executionAvailable: true,
      authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1',
      templates: [{
        templateId: 'collect_ready_outputs_once',
        title: 'Collect Ready Outputs Once',
        status: 'EXECUTOR_AVAILABLE',
        summary: 'Drafts and explicitly executes a bounded cohort work order for collecting up to two ready outputs once.',
        allowedActions: ['et.plot.collect_outputs'],
        caps: workOrder.caps,
        authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1',
        availability: { unlocked: true, blockedBy: [] },
      }],
      workOrders: [workOrder],
    },
    workOrderTemplates: [],
    workOrders: [workOrder],
    worldGrid,
    civicProposals: {
      status: 'RECORDING_READY',
      title: 'Civic Proposal Records',
      implementation: 'hq10b_server_owned_civic_proposal_records_v1',
      proposalOnly: true,
      readOnlyExecution: true,
      authorityBoundary: 'server_owned_civic_proposal_record_no_execution_v1',
      allowedStatuses: ['DRAFT', 'REVIEWED', 'ARCHIVED'],
      allowedCategories: ['coordination', 'public_work', 'route_study', 'civic_memory'],
      requirements: worldGrid.requirements,
      counts: { total: 1, byStatus: { REVIEWED: 1 }, draftCount: 0, reviewedCount: 1, archivedCount: 0 },
      proposals: [civicProposal],
    },
    overlayPacks,
    visualActors: [{
      actorId: 'dense_scout_on_board',
      canonicalRoleId: 'scout',
      sourceDomain: 'building',
      sourceObjectId: 'bldg_expedition_board_dense',
      sourceStateHash: 'dense-board-ready',
      visualState: 'SCOUT_REPORT_READY',
      actionKind: 'SCOUT_REPORT_READY',
      progress: 1,
      target: { kind: 'building', id: 'bldg_expedition_board_dense' },
      selectionKey: 'building:bldg_expedition_board_dense',
    }],
    publicSummary: {
      worldGridReady: true,
      worldGridStatus: 'READ_MODEL_READY',
      worldGridProjectionHash: 'dense-followup-world-grid',
      civicProposalCount: 1,
      civicProposalReviewedCount: 1,
      overlayPackCount: 1,
      overlayPackDraftCount: 1,
    },
    audit: { stateHash: 'dense-followup' },
  };

  return { ok: true, plotId, state, stateHash: state.audit.stateHash, recap: null };
}

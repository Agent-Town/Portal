const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  generateRegion,
  normalizeOwnerIdentity
} = require('../server/world_grid/region');
const { loadPlotByPairId } = require('../server/founders_plot/store');

async function withWorldGridServer({ identity, envPatch = {} }, fn) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    FEATURE_WORLD_GRID_V50_REGION: process.env.FEATURE_WORLD_GRID_V50_REGION,
    WORLD_GRID_FEATURE_FLAGS: process.env.WORLD_GRID_FEATURE_FLAGS
  };
  for (const [key, value] of Object.entries(envPatch)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: (req) => (typeof identity === 'function' ? identity(req) : identity)
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function withDynamicWorldGridServer(envPatch, fn) {
  return await withWorldGridServer({
    identity: (req) => ({
      pairId: String(req.header('x-test-pair-id') || 'session:dynamic-unused'),
      houseId: null
    }),
    envPatch
  }, async (baseUrl) => {
    return await fn(baseUrl, (pairId) => ({ 'x-test-pair-id': pairId }));
  });
}

test('V5.0 region generation is deterministic with stable cells and home settlement', () => {
  const identity = { pairId: 'wallet:solana:WorldGridOwner111', houseId: null };
  const one = generateRegion(identity, { nowMs: 1_000, hqLevel: 2 });
  const two = generateRegion(identity, { nowMs: 2_000, hqLevel: 2 });

  assert.equal(one.regionId, two.regionId);
  assert.equal(one.ownerAccountId, two.ownerAccountId);
  assert.equal(one.seed, two.seed);
  assert.equal(one.cells.length, 19);
  assert.deepEqual(
    one.cells.map((cell) => [cell.cellId, cell.q, cell.r, cell.terrain, cell.state, cell.feature, cell.risk]),
    two.cells.map((cell) => [cell.cellId, cell.q, cell.r, cell.terrain, cell.state, cell.feature, cell.risk])
  );
  assert.equal(one.settlements[0].kind, 'home');
  assert.equal(one.cells.filter((cell) => cell.state === 'claimed').length, 1);
  assert.ok(one.cells.every((cell) => cell.cellId.startsWith(`${one.regionId}:`)));
});

test('world grid API is gated off by default and can be enabled by server config', async () => {
  await withWorldGridServer({
    identity: { pairId: 'session:world-grid-default-off' },
    envPatch: { NODE_ENV: 'production', FEATURE_WORLD_GRID_V50_REGION: undefined }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/region`);
    const body = await response.json();
    assert.equal(response.status, 403, JSON.stringify(body));
    assert.equal(body.error.code, 'FEATURE_DISABLED');
  });

  await withWorldGridServer({
    identity: { pairId: 'session:world-grid-server-on' },
    envPatch: { NODE_ENV: 'production', FEATURE_WORLD_GRID_V50_REGION: '1' }
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/region`);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.ok, true);
    assert.equal(body.featureFlags.FEATURE_WORLD_GRID_V50_REGION, true);
    assert.equal(body.region.settlements[0].name, 'Founders Plot');
  });
});

test('production world grid query overrides are ignored unless admin authorized', async () => {
  await withWorldGridServer({
    identity: { pairId: 'session:world-grid-production-query' },
    envPatch: {
      NODE_ENV: 'production',
      ADMIN_TOKEN: 'admin-secret',
      FEATURE_WORLD_GRID_V50_REGION: undefined,
      WORLD_GRID_FEATURE_FLAGS: undefined
    }
  }, async (baseUrl) => {
    const playerResponse = await fetch(`${baseUrl}/api/world/region?worldGridFeatureFlags=all`, {
      headers: { 'x-world-grid-feature-flags': 'all' }
    });
    const playerBody = await playerResponse.json();
    assert.equal(playerResponse.status, 403, JSON.stringify(playerBody));
    assert.equal(playerBody.error.code, 'FEATURE_DISABLED');

    const adminResponse = await fetch(`${baseUrl}/api/world/region`, {
      headers: {
        'x-admin-token': 'admin-secret',
        'x-world-grid-feature-flags': 'all'
      }
    });
    const adminBody = await adminResponse.json();
    assert.equal(adminResponse.status, 200, JSON.stringify(adminBody));
    assert.equal(adminBody.region.cells.length, 19);
  });
});

test('world grid focus and read-only tools do not mutate Founders Plot state', async () => {
  const identity = { pairId: 'session:world-grid-readonly' };
  const expectedOwner = normalizeOwnerIdentity(identity);
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    const stateResponse = await fetch(`${baseUrl}/api/world/region`);
    const stateBody = await stateResponse.json();
    assert.equal(stateResponse.status, 200, JSON.stringify(stateBody));
    assert.equal(stateBody.region.regionId, expectedOwner.regionId);

    const target = stateBody.region.cells.find((cell) => cell.state === 'claimable');
    assert.ok(target);

    const focusResponse = await fetch(`${baseUrl}/api/world/region/focus-cell`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: target.cellId })
    });
    const focusBody = await focusResponse.json();
    assert.equal(focusResponse.status, 200, JSON.stringify(focusBody));
    assert.equal(focusBody.preferences.selectedCellId, target.cellId);

    const toolResponse = await fetch(`${baseUrl}/api/world/tool/et.world.region.explain_cell`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: target.cellId })
    });
    const toolBody = await toolResponse.json();
    assert.equal(toolResponse.status, 200, JSON.stringify(toolBody));
    assert.equal(toolBody.data.cell.cellId, target.cellId);
    assert.equal(toolBody.data.canClaimNow, false);

    const wrongOwnerResponse = await fetch(`${baseUrl}/api/world/region?regionId=region_wrong_owner`);
    const wrongOwnerBody = await wrongOwnerResponse.json();
    assert.equal(wrongOwnerResponse.status, 403, JSON.stringify(wrongOwnerBody));
    assert.equal(wrongOwnerBody.error.code, 'FORBIDDEN');
  });
});

test('V5.1 territory claim tools plan and complete one adjacent claim with exact resource spend', async () => {
  const identity = { pairId: `session:world-grid-v51-claim-${Date.now()}-${Math.random().toString(16).slice(2)}` };
  await withWorldGridServer({
    identity,
    envPatch: { NODE_ENV: 'test', WORLD_GRID_FEATURE_FLAGS: 'all' }
  }, async (baseUrl) => {
    const toolsResponse = await fetch(`${baseUrl}/api/world/tools`);
    const toolsBody = await toolsResponse.json();
    assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
    assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.territory.complete_claim'), true);

    const optionsResponse = await fetch(`${baseUrl}/api/world/territory/claim-options`);
    const optionsBody = await optionsResponse.json();
    assert.equal(optionsResponse.status, 200, JSON.stringify(optionsBody));
    assert.ok(optionsBody.options.length >= 2);

    const option = optionsBody.options.find((candidate) => (candidate.cost.coin || 0) <= 20) || optionsBody.options[0];

    const planResponse = await fetch(`${baseUrl}/api/world/territory/plan-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cellId: option.cellId })
    });
    const planBody = await planResponse.json();
    assert.equal(planResponse.status, 200, JSON.stringify(planBody));
    assert.equal(planBody.claim.cellId, option.cellId);
    assert.equal(planBody.claim.status, 'planned');
    assert.deepEqual(planBody.claim.cost, option.cost);

    const completeResponse = await fetch(`${baseUrl}/api/world/territory/complete-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claimId: planBody.claim.claimId })
    });
    const completeBody = await completeResponse.json();
    assert.equal(completeResponse.status, 200, JSON.stringify(completeBody));
    assert.equal(completeBody.claim.status, 'claimed');
    assert.equal(completeBody.region.cells.find((cell) => cell.cellId === option.cellId)?.state, 'claimed');
    assert.equal(completeBody.region.routes.some((route) => route.status === 'open' && route.pathCellIds.includes(option.cellId)), true);

    const plot = loadPlotByPairId(identity.pairId);
    assert.ok(plot?.plot?.inventory);
    assert.equal(plot.plot.inventory.wood, 0 - (option.cost.wood || 0));
    assert.equal(plot.plot.inventory.food, 0 - (option.cost.food || 0));
    assert.equal(plot.plot.inventory.stone, 0 - (option.cost.stone || 0));
    assert.equal(plot.plot.inventory.coin, 20 - (option.cost.coin || 0));

    const replayCompleteResponse = await fetch(`${baseUrl}/api/world/territory/complete-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claimId: planBody.claim.claimId })
    });
    const replayCompleteBody = await replayCompleteResponse.json();
    assert.equal(replayCompleteResponse.status, 200, JSON.stringify(replayCompleteBody));
    const plotAfterReplay = loadPlotByPairId(identity.pairId);
    assert.deepEqual(plotAfterReplay.plot.inventory, plot.plot.inventory);
  });
});

test('V5.2 public presence is opt-in, redacted, followable, and removable', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const ownerA = `session:world-grid-public-a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ownerB = `session:world-grid-public-b-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const optInA = await fetch(`${baseUrl}/api/world/public-presence/opt-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerA) },
      body: JSON.stringify({
        displayName: 'Founder A',
        townName: 'Copper Lantern',
        privacy: { showOperatingStyle: true, showRegion: true, allowVisits: true }
      })
    });
    const optInABody = await optInA.json();
    assert.equal(optInA.status, 200, JSON.stringify(optInABody));
    assert.equal(optInABody.town.townName, 'Copper Lantern');

    const listA = await fetch(`${baseUrl}/api/world/public-towns`, {
      headers: headersFor(ownerB)
    });
    const listABody = await listA.json();
    assert.equal(listA.status, 200, JSON.stringify(listABody));
    assert.equal(listABody.towns.some((town) => town.publicTownId === optInABody.town.publicTownId), true);
    const serialized = JSON.stringify(listABody);
    assert.equal(serialized.includes(ownerA), false);
    assert.equal(/brain|wallet|runtime|provider|secret/i.test(serialized), false);

    const follow = await fetch(`${baseUrl}/api/world/follow-town`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerB) },
      body: JSON.stringify({ publicTownId: optInABody.town.publicTownId })
    });
    const followBody = await follow.json();
    assert.equal(follow.status, 200, JSON.stringify(followBody));
    assert.equal(followBody.followed, true);

    const summarize = await fetch(`${baseUrl}/api/world/tool/et.world.public.summarize_neighbor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerB) },
      body: JSON.stringify({ publicTownId: optInABody.town.publicTownId })
    });
    const summarizeBody = await summarize.json();
    assert.equal(summarize.status, 200, JSON.stringify(summarizeBody));
    assert.match(summarizeBody.data.summary, /Copper Lantern/);

    const optOutA = await fetch(`${baseUrl}/api/world/public-presence/opt-out`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersFor(ownerA) },
      body: JSON.stringify({})
    });
    const optOutABody = await optOutA.json();
    assert.equal(optOutA.status, 200, JSON.stringify(optOutABody));
    assert.equal(optOutABody.removed, true);

    const listAfter = await fetch(`${baseUrl}/api/world/public-towns`, {
      headers: headersFor(ownerB)
    });
    const listAfterBody = await listAfter.json();
    assert.equal(listAfterBody.towns.some((town) => town.publicTownId === optInABody.town.publicTownId), false);
  });
});

test('V5.3 agent services redact inputs and never mutate world state on accept', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const owner = `session:world-grid-services-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const headers = headersFor(owner);
    const ownerIdentity = normalizeOwnerIdentity({ pairId: owner });

    const beforeRegionResponse = await fetch(`${baseUrl}/api/world/region`, { headers });
    const beforeRegion = await beforeRegionResponse.json();
    assert.equal(beforeRegionResponse.status, 200, JSON.stringify(beforeRegion));
    const stableRegionSnapshot = (region) => JSON.stringify({
      regionId: region.regionId,
      ownerAccountId: region.ownerAccountId,
      seed: region.seed,
      activeSettlementId: region.activeSettlementId,
      cells: region.cells,
      settlements: region.settlements,
      routes: region.routes
    });
    const beforeRegionJson = stableRegionSnapshot(beforeRegion.region);

    const servicesResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const servicesBody = await servicesResponse.json();
    assert.equal(servicesResponse.status, 200, JSON.stringify(servicesBody));
    assert.ok(servicesBody.services.length >= 3);
    assert.equal(servicesBody.services.some((service) => service.serviceId === 'service_route_advisor'), true);

    const requestResponse = await fetch(`${baseUrl}/api/world/services/request-advice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({
        serviceId: 'service_route_advisor',
        input: {
          selectedCell: beforeRegion.region.cells.find((cell) => cell.state === 'claimable'),
          regionSummary: { cellCount: beforeRegion.region.cells.length },
          brainSecrets: 'sk-live-secret',
          walletSecrets: 'wallet-secret',
          providerConfig: { token: 'provider-token' },
          privateEventLog: ['private'],
          workerTraffic: ['debug']
        }
      })
    });
    const requestBody = await requestResponse.json();
    assert.equal(requestResponse.status, 200, JSON.stringify(requestBody));
    assert.equal(requestBody.request.serviceId, 'service_route_advisor');
    assert.equal(requestBody.request.providerAccountId, 'civic_service_route_office');
    assert.equal(requestBody.request.requesterAccountId, ownerIdentity.ownerAccountId);
    assert.equal(requestBody.request.requesterAccountId.includes(owner), false);
    assert.deepEqual(Object.keys(requestBody.request.input).sort(), ['regionSummary', 'selectedCell']);
    assert.equal(JSON.stringify(requestBody.request.input).includes('sk-live-secret'), false);
    assert.equal(JSON.stringify(requestBody.request.input).includes('wallet-secret'), false);
    assert.equal(JSON.stringify(requestBody.request.input).includes('provider-token'), false);
    assert.equal(requestBody.request.output.recommendation.length > 0, true);
    assert.equal(typeof requestBody.request.output.rationale, 'string');
    assert.equal(typeof requestBody.request.output.nextStep, 'string');

    const acceptResponse = await fetch(`${baseUrl}/api/world/services/accept-result`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ requestId: requestBody.request.requestId })
    });
    const acceptBody = await acceptResponse.json();
    assert.equal(acceptResponse.status, 200, JSON.stringify(acceptBody));
    assert.equal(acceptBody.mutationApplied, false);
    assert.equal(acceptBody.request.status, 'accepted');

    const afterRegionResponse = await fetch(`${baseUrl}/api/world/region`, { headers });
    const afterRegion = await afterRegionResponse.json();
    assert.equal(stableRegionSnapshot(afterRegion.region), beforeRegionJson);

    const afterServicesResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const afterServices = await afterServicesResponse.json();
    const routeAdvisor = afterServices.services.find((service) => service.serviceId === 'service_route_advisor');
    assert.equal(routeAdvisor.reputation.completedJobs >= 1, true);

    const reportResponse = await fetch(`${baseUrl}/api/world/services/report-issue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ requestId: requestBody.request.requestId, reason: 'Advice was not relevant.' })
    });
    const reportBody = await reportResponse.json();
    assert.equal(reportResponse.status, 200, JSON.stringify(reportBody));
    assert.equal(reportBody.request.status, 'reported');

    const afterReportResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const afterReport = await afterReportResponse.json();
    const routeAdvisorAfterReport = afterReport.services.find((service) => service.serviceId === 'service_route_advisor');
    assert.equal(routeAdvisorAfterReport.reputation.disputeCount >= 1, true);

    const duplicateReportResponse = await fetch(`${baseUrl}/api/world/services/report-issue`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ requestId: requestBody.request.requestId, reason: 'Duplicate report.' })
    });
    const duplicateReportBody = await duplicateReportResponse.json();
    assert.equal(duplicateReportResponse.status, 200, JSON.stringify(duplicateReportBody));

    const afterDuplicateResponse = await fetch(`${baseUrl}/api/world/services`, { headers });
    const afterDuplicate = await afterDuplicateResponse.json();
    const routeAdvisorAfterDuplicate = afterDuplicate.services.find((service) => service.serviceId === 'service_route_advisor');
    assert.equal(routeAdvisorAfterDuplicate.reputation.disputeCount, routeAdvisorAfterReport.reputation.disputeCount);

    const acceptAfterReportResponse = await fetch(`${baseUrl}/api/world/services/accept-result`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ requestId: requestBody.request.requestId })
    });
    const acceptAfterReportBody = await acceptAfterReportResponse.json();
    assert.equal(acceptAfterReportResponse.status, 409, JSON.stringify(acceptAfterReportBody));
    assert.equal(acceptAfterReportBody.error.code, 'INVALID_SERVICE_REQUEST_STATE');
  });
});

test('V5.4 world events enforce caps, idempotency, conservation, and cosmetic rewards', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const ownerA = `session:world-grid-events-a-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ownerB = `session:world-grid-events-b-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const headersA = headersFor(ownerA);
    const headersB = headersFor(ownerB);
    const ownerAIdentity = normalizeOwnerIdentity({ pairId: ownerA });

    const toolsResponse = await fetch(`${baseUrl}/api/world/tools`, { headers: headersA });
    const toolsBody = await toolsResponse.json();
    assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
    assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.events.contribute'), true);

    const stateResponse = await fetch(`${baseUrl}/api/world/events`, { headers: headersA });
    const stateBody = await stateResponse.json();
    assert.equal(stateResponse.status, 200, JSON.stringify(stateBody));
    const eventId = stateBody.events[0].event.eventId;
    assert.equal(eventId, 'event_great_ridge_bridge');
    assert.equal(stateBody.events[0].event.status, 'active');

    const previewResponse = await fetch(`${baseUrl}/api/world/events/preview-contribution`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 2 } })
    });
    const previewBody = await previewResponse.json();
    assert.equal(previewResponse.status, 200, JSON.stringify(previewBody));
    assert.equal(previewBody.preview.accepted.coin, 2);
    assert.equal(previewBody.preview.allowed, true);

    const contributeResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 2 }, idempotencyKey: 'bridge-day-1' })
    });
    const contributeBody = await contributeResponse.json();
    assert.equal(contributeResponse.status, 200, JSON.stringify(contributeBody));
    assert.equal(contributeBody.duplicate, false);
    assert.equal(contributeBody.contribution.bundle.coin, 2);
    assert.equal(contributeBody.events[0].event.totalContributions.coin >= 2, true);

    const plotAfterContribution = loadPlotByPairId(ownerA);
    assert.equal(
      plotAfterContribution.plot.inventory.coin,
      contributeBody.contribution.inventoryBefore.coin - contributeBody.contribution.bundle.coin
    );

    const duplicateResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 5 }, idempotencyKey: 'bridge-day-1' })
    });
    const duplicateBody = await duplicateResponse.json();
    assert.equal(duplicateResponse.status, 200, JSON.stringify(duplicateBody));
    assert.equal(duplicateBody.duplicate, true);
    assert.equal(duplicateBody.contribution.contributionId, contributeBody.contribution.contributionId);
    assert.deepEqual(loadPlotByPairId(ownerA).plot.inventory, plotAfterContribution.plot.inventory);

    const capFillResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 99 }, idempotencyKey: 'bridge-day-2' })
    });
    const capFillBody = await capFillResponse.json();
    assert.equal(capFillResponse.status, 200, JSON.stringify(capFillBody));
    assert.equal(capFillBody.contribution.bundle.coin, 3);

    const overCapResponse = await fetch(`${baseUrl}/api/world/events/contribute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId, bundle: { coin: 1 }, idempotencyKey: 'bridge-day-3' })
    });
    const overCapBody = await overCapResponse.json();
    assert.equal(overCapResponse.status, 409, JSON.stringify(overCapBody));
    assert.equal(overCapBody.error.code, 'CONTRIBUTION_CAP_EXCEEDED');

    const wrongOwnerReward = await fetch(`${baseUrl}/api/world/events/claim-reward`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersB },
      body: JSON.stringify({ eventId, ownerAccountId: ownerAIdentity.ownerAccountId })
    });
    const wrongOwnerRewardBody = await wrongOwnerReward.json();
    assert.equal(wrongOwnerReward.status, 403, JSON.stringify(wrongOwnerRewardBody));
    assert.equal(wrongOwnerRewardBody.error.code, 'FORBIDDEN');

    const inventoryBeforeReward = { ...loadPlotByPairId(ownerA).plot.inventory };
    const rewardResponse = await fetch(`${baseUrl}/api/world/events/claim-reward`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId })
    });
    const rewardBody = await rewardResponse.json();
    assert.equal(rewardResponse.status, 200, JSON.stringify(rewardBody));
    assert.equal(rewardBody.mutationApplied, false);
    assert.equal(rewardBody.reward.kind, 'cosmetic_status');
    assert.deepEqual(loadPlotByPairId(ownerA).plot.inventory, inventoryBeforeReward);

    const rewardReplay = await fetch(`${baseUrl}/api/world/events/claim-reward`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headersA },
      body: JSON.stringify({ eventId })
    });
    const rewardReplayBody = await rewardReplay.json();
    assert.equal(rewardReplay.status, 200, JSON.stringify(rewardReplayBody));
    assert.equal(rewardReplayBody.reward.rewardId, rewardBody.reward.rewardId);
  });
});

test('V5.5 sandbox districts moderate typed actions, rollback, and keep private towns untouched', async () => {
  await withDynamicWorldGridServer({
    NODE_ENV: 'test',
    WORLD_GRID_FEATURE_FLAGS: 'all'
  }, async (baseUrl, headersFor) => {
    const owner = `session:world-grid-sandbox-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const headers = headersFor(owner);
    assert.equal(loadPlotByPairId(owner), null);

    const toolsResponse = await fetch(`${baseUrl}/api/world/tools`, { headers });
    const toolsBody = await toolsResponse.json();
    assert.equal(toolsResponse.status, 200, JSON.stringify(toolsBody));
    assert.equal(toolsBody.tools.some((tool) => tool.name === 'et.world.sandbox.place_prop'), true);

    const enterResponse = await fetch(`${baseUrl}/api/world/sandbox/enter`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({})
    });
    const enterBody = await enterResponse.json();
    assert.equal(enterResponse.status, 200, JSON.stringify(enterBody));
    assert.match(enterBody.participant.publicId, /^sandbox_/);
    assert.equal(JSON.stringify(enterBody).includes(owner), false);

    const propCount = (sandbox) => sandbox.district.cells.reduce((sum, cell) => sum + cell.props.length, 0);

    const placeResponse = await fetch(`${baseUrl}/api/world/sandbox/place-prop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ payload: { cellId: 'sandbox_cell_0', propId: 'lantern' } })
    });
    const placeBody = await placeResponse.json();
    assert.equal(placeResponse.status, 200, JSON.stringify(placeBody));
    assert.equal(placeBody.action.moderationStatus, 'auto-approved');
    assert.equal(placeBody.action.payload.propId, 'lantern');
    assert.equal(propCount(placeBody.sandbox), 1);

    const rejectedResponse = await fetch(`${baseUrl}/api/world/sandbox/place-prop`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ payload: { cellId: 'sandbox_cell_0', propId: 'uploaded-dragon' } })
    });
    const rejectedBody = await rejectedResponse.json();
    assert.equal(rejectedResponse.status, 200, JSON.stringify(rejectedBody));
    assert.equal(rejectedBody.action.moderationStatus, 'rejected');
    assert.equal(propCount(rejectedBody.sandbox), 1);

    const demoResponse = await fetch(`${baseUrl}/api/world/sandbox/agent-demo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ payload: { cellId: 'sandbox_cell_1', demoKind: 'route-signpost' } })
    });
    const demoBody = await demoResponse.json();
    assert.equal(demoResponse.status, 200, JSON.stringify(demoBody));
    assert.equal(demoBody.action.kind, 'agent_demo');
    assert.equal(demoBody.action.moderationStatus, 'auto-approved');
    assert.equal(propCount(demoBody.sandbox), 2);

    const rejectedDemoResponse = await fetch(`${baseUrl}/api/world/sandbox/agent-demo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ payload: { cellId: 'sandbox_cell_1', demoKind: 'freeform-chat' } })
    });
    const rejectedDemoBody = await rejectedDemoResponse.json();
    assert.equal(rejectedDemoResponse.status, 200, JSON.stringify(rejectedDemoBody));
    assert.equal(rejectedDemoBody.action.moderationStatus, 'rejected');

    const rollbackDemoResponse = await fetch(`${baseUrl}/api/world/sandbox/rollback-last`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({})
    });
    const rollbackDemoBody = await rollbackDemoResponse.json();
    assert.equal(rollbackDemoResponse.status, 200, JSON.stringify(rollbackDemoBody));
    assert.equal(rollbackDemoBody.restored, true);
    assert.equal(propCount({ district: rollbackDemoBody.district }), 1);

    const rollbackLanternResponse = await fetch(`${baseUrl}/api/world/sandbox/rollback-last`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({})
    });
    const rollbackLanternBody = await rollbackLanternResponse.json();
    assert.equal(rollbackLanternResponse.status, 200, JSON.stringify(rollbackLanternBody));
    assert.equal(propCount({ district: rollbackLanternBody.district }), 0);

    const leaveResponse = await fetch(`${baseUrl}/api/world/sandbox/leave`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({})
    });
    const leaveBody = await leaveResponse.json();
    assert.equal(leaveResponse.status, 200, JSON.stringify(leaveBody));
    assert.equal(leaveBody.removed, true);
    assert.equal(loadPlotByPairId(owner), null);
  });
});

const http = require('node:http');
const express = require('express');

const { createInitialPlot } = require('../server/founders_plot/engine');
const { savePlotGraph } = require('../server/founders_plot/store');
const { closeWorldGridIdempotencyStore } = require('../server/world_grid/idempotency');
const { createWorldGridRouter } = require('../server/world_grid/routes');
const {
  closeWorldGridServiceStore,
  createWorldGridServiceStore
} = require('../server/world_grid/services');

const OWNER_ID = 'session:world-grid-durable-services';

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function seedFoundersPlot() {
  savePlotGraph(createInitialPlot({ pairId: OWNER_ID, nowMs: 1_779_984_000_000 }));
}

async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldGridRouter({
    resolveIdentity: () => ({ pairId: OWNER_ID, houseId: null })
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeWorldGridIdempotencyStore();
    closeWorldGridServiceStore();
  }
}

async function getJson(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`);
  return {
    status: response.status,
    body: await response.json()
  };
}

async function postJson(baseUrl, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

function durableSnapshot(sqlitePath, ownerAccountId) {
  const store = createWorldGridServiceStore({ sqlitePath });
  try {
    return {
      counts: store.counts(),
      requests: store.requestsForOwner(ownerAccountId),
      routeAdvisorReputation: store.getReputation('service_route_advisor'),
      publicWorksReputation: store.getReputation('service_public_works_planner'),
      metadata: store.metadata()
    };
  } finally {
    store.close();
  }
}

function summarizeServices(body = {}) {
  const routeAdvisor = (body.services || []).find((service) => service.serviceId === 'service_route_advisor') || {};
  const publicWorks = (body.services || []).find((service) => service.serviceId === 'service_public_works_planner') || {};
  return {
    requestCount: (body.requests || []).length,
    requestStatuses: (body.requests || []).map((request) => request.status).sort(),
    routeAdvisorReputation: routeAdvisor.reputation || null,
    publicWorksReputation: publicWorks.reputation || null
  };
}

async function main() {
  const mode = process.argv[2];
  const servicesPath = process.argv[3];
  const storePath = process.argv[4];
  const acceptedRequestId = process.argv[5] || '';
  const reportedRequestId = process.argv[6] || '';
  if (!mode || !servicesPath || !storePath) throw new Error('WORLD_GRID_SERVICES_RESTART_ARGS_REQUIRED');

  process.env.NODE_ENV = 'test';
  process.env.STORE_PATH = storePath;
  process.env.WORLD_GRID_FEATURE_FLAGS = 'all';
  process.env.WORLD_GRID_SERVICES_SQLITE_PATH = servicesPath;

  if (mode === 'seed') seedFoundersPlot();

  await withServer(async (baseUrl) => {
    const region = await getJson(baseUrl, '/api/world/region');
    const ownerAccountId = region.body.owner?.ownerAccountId || '';
    const firstOption = region.body.region?.cells?.find((cell) => cell.state === 'claimable') || {};
    let acceptedRequest = { status: 0, body: {} };
    let reportedRequest = { status: 0, body: {} };
    let followup = { status: 0, body: {} };

    if (mode === 'seed') {
      acceptedRequest = await postJson(baseUrl, '/api/world/services/request-advice', {
        serviceId: 'service_route_advisor',
        idempotencyKey: 'durable_services_request_accept_001',
        input: {
          selectedCell: firstOption,
          regionSummary: { cellCount: region.body.region.cells.length },
          brainSecrets: 'sk-live-secret',
          walletSecrets: 'wallet-secret',
          providerConfig: { token: 'provider-token' },
          privateEventLog: ['private-event'],
          workerTraffic: ['debug-packet']
        }
      });
      followup = await postJson(baseUrl, '/api/world/services/accept-result', {
        requestId: acceptedRequest.body.request?.requestId,
        idempotencyKey: 'durable_services_accept_001'
      });
      reportedRequest = await postJson(baseUrl, '/api/world/services/request-advice', {
        serviceId: 'service_public_works_planner',
        idempotencyKey: 'durable_services_request_report_001',
        input: {
          claimSummary: firstOption,
          brainSecrets: 'sk-report-secret'
        }
      });
      followup = await postJson(baseUrl, '/api/world/services/report-issue', {
        requestId: reportedRequest.body.request?.requestId,
        reason: 'Advice was not relevant.',
        idempotencyKey: 'durable_services_report_001'
      });
    } else if (mode === 'accept-again') {
      followup = await postJson(baseUrl, '/api/world/services/accept-result', {
        requestId: acceptedRequestId,
        idempotencyKey: 'durable_services_accept_again_001'
      });
    } else if (mode === 'report-again') {
      followup = await postJson(baseUrl, '/api/world/services/report-issue', {
        requestId: reportedRequestId,
        reason: 'Duplicate report.',
        idempotencyKey: 'durable_services_report_again_001'
      });
    }

    const services = await getJson(baseUrl, '/api/world/services');
    const snapshot = durableSnapshot(servicesPath, ownerAccountId);
    const serialized = JSON.stringify({
      responseRequests: services.body.requests || [],
      durableRequests: snapshot.requests || []
    });
    writeJson({
      ok: region.status === 200 && services.status === 200 && [0, 200].includes(followup.status),
      mode,
      acceptedRequestStatus: acceptedRequest.status,
      reportedRequestStatus: reportedRequest.status,
      followupStatus: followup.status,
      acceptedRequestId: acceptedRequest.body.request?.requestId || acceptedRequestId,
      reportedRequestId: reportedRequest.body.request?.requestId || reportedRequestId,
      containsPrivateText: /sk-live-secret|wallet-secret|provider-token|private-event|debug-packet|brainSecrets|walletSecrets|providerConfig|privateEventLog|workerTraffic/i.test(serialized),
      ...summarizeServices(services.body),
      ...snapshot
    });
  });
}

main().catch((error) => {
  writeJson({ ok: false, error: error.message });
  process.exitCode = 1;
});

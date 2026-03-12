async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function getHouseWorkerDeployments(request, { teamId = '' } = {}) {
  const search = new URLSearchParams();
  if (teamId) search.set('teamId', String(teamId || '').trim());
  const response = await request.get(
    search.toString()
      ? `/api/platform/house-workers/deployments?${search.toString()}`
      : '/api/platform/house-workers/deployments',
    { failOnStatusCode: false }
  );
  return readJsonResponse(response);
}

async function getHouseWorkerCollections(request, { teamId = '' } = {}) {
  const search = new URLSearchParams();
  if (teamId) search.set('teamId', String(teamId || '').trim());
  const response = await request.get(
    search.toString()
      ? `/api/platform/house-workers?${search.toString()}`
      : '/api/platform/house-workers',
    { failOnStatusCode: false }
  );
  return readJsonResponse(response);
}

async function installHouseWorker(request, payload = {}) {
  const response = await request.post('/api/platform/house-workers/install', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function shareHouseWorker(request, payload = {}) {
  const response = await request.post('/api/platform/house-workers/share', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function listHouseWorkerShares(request) {
  const response = await request.get('/api/platform/house-workers/shares', {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function getHouseWorkerShare(request, shareId) {
  const response = await request.get(`/api/platform/house-workers/shares/${encodeURIComponent(String(shareId || ''))}`, {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function revokeHouseWorkerShare(request, shareId) {
  const response = await request.post(`/api/platform/house-workers/shares/${encodeURIComponent(String(shareId || ''))}/revoke`, {
    data: {},
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function installSharedHouseWorker(request, payload = {}) {
  const response = await request.post('/api/platform/house-workers/install-shared', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function listHouseWorkerSessions(request, { teamId = '' } = {}) {
  const search = new URLSearchParams();
  if (teamId) search.set('teamId', String(teamId || '').trim());
  const response = await request.get(
    search.toString()
      ? `/api/platform/house-workers/sessions?${search.toString()}`
      : '/api/platform/house-workers/sessions',
    { failOnStatusCode: false }
  );
  return readJsonResponse(response);
}

async function listHouseWorkerRuntimeInstances(request, { teamId = '' } = {}) {
  const search = new URLSearchParams();
  if (teamId) search.set('teamId', String(teamId || '').trim());
  const response = await request.get(
    search.toString()
      ? `/api/platform/house-workers/runtime-instances?${search.toString()}`
      : '/api/platform/house-workers/runtime-instances',
    { failOnStatusCode: false }
  );
  return readJsonResponse(response);
}

async function listHouseWorkerTransportMessages(request, { houseWorkerSessionId = '', teamId = '' } = {}) {
  const search = new URLSearchParams();
  if (houseWorkerSessionId) search.set('houseWorkerSessionId', String(houseWorkerSessionId || '').trim());
  if (teamId) search.set('teamId', String(teamId || '').trim());
  const response = await request.get(
    search.toString()
      ? `/api/platform/house-workers/transport?${search.toString()}`
      : '/api/platform/house-workers/transport',
    { failOnStatusCode: false }
  );
  return readJsonResponse(response);
}

async function listHouseWorkerWorkspaceSnapshots(request, { runtimeInstanceId = '', teamId = '' } = {}) {
  const search = new URLSearchParams();
  if (teamId) search.set('teamId', String(teamId || '').trim());
  const response = await request.get(
    search.toString()
      ? `/api/platform/house-workers/runtime-instances/${encodeURIComponent(String(runtimeInstanceId || '').trim())}/snapshots?${search.toString()}`
      : `/api/platform/house-workers/runtime-instances/${encodeURIComponent(String(runtimeInstanceId || '').trim())}/snapshots`,
    { failOnStatusCode: false }
  );
  return readJsonResponse(response);
}

async function getHouseWorkerWorkspaceSnapshot(request, workspaceSnapshotRef) {
  const response = await request.get(`/api/platform/house-workers/workspace-snapshots/${encodeURIComponent(String(workspaceSnapshotRef || '').trim())}`, {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function getHouseWorkerLiveReadiness(request) {
  const response = await request.get('/api/platform/house-workers/live-readiness', {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function spawnHouseWorker(request, payload = {}) {
  const response = await request.post('/api/platform/house-workers/spawn', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function messageHouseWorker(request, payload = {}) {
  const response = await request.post('/api/platform/house-workers/message', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function stopHouseWorker(request, payload = {}) {
  const response = await request.post('/api/platform/house-workers/stop', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function offloadHouseWorker(request, payload = {}) {
  const response = await request.post('/api/platform/house-workers/offload', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function updateHouseWorkerDeploymentLifecycle(request, deploymentId, action) {
  const response = await request.post(`/api/platform/house-workers/deployments/${encodeURIComponent(String(deploymentId || ''))}/lifecycle`, {
    data: {
      action,
    },
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function readHouseWorkerSupervisorSnapshot(page) {
  return await page.evaluate(() => {
    const api = window.__agentTownHouseWorkerSupervisor;
    if (!api || typeof api.getSnapshot !== 'function') return null;
    return api.getSnapshot();
  });
}

async function readHouseWorkerExecutorSnapshot(page) {
  return await page.evaluate(() => {
    const api = window.__agentTownHouseWorkerExecutors;
    if (!api || typeof api.getSnapshot !== 'function') return null;
    return api.getSnapshot();
  });
}

async function readHouseWorkerSessionsFromPage(page, { teamId = '' } = {}) {
  return await page.evaluate(async ({ teamId }) => {
    const api = window.__agentTownHouseWorkerSupervisor;
    if (!api || typeof api.sync !== 'function') {
      return {
        status: 503,
        json: null,
      };
    }
    const sessions = await api.sync({ teamId }).catch(() => null);
    return {
      status: 200,
      json: {
        ok: true,
        data: {
          sessions: Array.isArray(sessions) ? sessions : [],
        },
      },
    };
  }, { teamId: String(teamId || '').trim() });
}

async function readHouseWorkerLiveReadinessFromPage(page) {
  return await page.evaluate(async () => {
    const api = window.__agentTownHouseWorkerLiveReadiness;
    if (!api || typeof api.refresh !== 'function') {
      return {
        status: 503,
        json: null,
      };
    }
    const snapshot = await api.refresh().catch(() => null);
    return {
      status: 200,
      json: {
        ok: true,
        data: snapshot && typeof snapshot === 'object' ? snapshot : null,
      },
    };
  });
}

module.exports = {
  getHouseWorkerCollections,
  getHouseWorkerDeployments,
  getHouseWorkerLiveReadiness,
  getHouseWorkerShare,
  installHouseWorker,
  installSharedHouseWorker,
  listHouseWorkerShares,
  listHouseWorkerSessions,
  listHouseWorkerRuntimeInstances,
  listHouseWorkerWorkspaceSnapshots,
  listHouseWorkerTransportMessages,
  messageHouseWorker,
  offloadHouseWorker,
  getHouseWorkerWorkspaceSnapshot,
  readHouseWorkerExecutorSnapshot,
  readHouseWorkerSessionsFromPage,
  readHouseWorkerLiveReadinessFromPage,
  readHouseWorkerSupervisorSnapshot,
  revokeHouseWorkerShare,
  shareHouseWorker,
  spawnHouseWorker,
  stopHouseWorker,
  updateHouseWorkerDeploymentLifecycle,
};

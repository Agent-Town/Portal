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

async function getHouseWorkerShare(request, shareId) {
  const response = await request.get(`/api/platform/house-workers/shares/${encodeURIComponent(String(shareId || ''))}`, {
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

async function readHouseWorkerSupervisorSnapshot(page) {
  return await page.evaluate(() => {
    const api = window.__agentTownHouseWorkerSupervisor;
    if (!api || typeof api.getSnapshot !== 'function') return null;
    return api.getSnapshot();
  });
}

async function readHouseWorkerSessionsFromPage(page, { teamId = '' } = {}) {
  return await page.evaluate(async () => {
    const api = window.__agentTownHouseWorkerSupervisor;
    if (!api || typeof api.sync !== 'function') {
      return {
        status: 503,
        json: null,
      };
    }
    const sessions = await api.sync().catch(() => null);
    return {
      status: 200,
      json: {
        ok: true,
        data: {
          sessions: Array.isArray(sessions) ? sessions : [],
        },
      },
    };
  });
}

module.exports = {
  getHouseWorkerCollections,
  getHouseWorkerDeployments,
  getHouseWorkerShare,
  installHouseWorker,
  installSharedHouseWorker,
  listHouseWorkerSessions,
  messageHouseWorker,
  readHouseWorkerSessionsFromPage,
  readHouseWorkerSupervisorSnapshot,
  shareHouseWorker,
  spawnHouseWorker,
  stopHouseWorker,
};

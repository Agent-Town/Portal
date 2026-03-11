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

module.exports = {
  getHouseWorkerDeployments,
  getHouseWorkerShare,
  installHouseWorker,
  installSharedHouseWorker,
  shareHouseWorker,
};

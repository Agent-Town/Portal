const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function getRegistryWebPokerStats(request) {
  const response = await request.get('/__test__/registry-web-poker/stats', {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function listRegistryWebPokerFixtures(request) {
  const response = await request.get('/__test__/registry-web-poker/fixtures', {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function getRegistryWebPokerFixture(request, family) {
  const response = await request.get(`/__test__/registry-web-poker/fixtures/${encodeURIComponent(String(family || ''))}`, {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function getRegistryHealth(request) {
  const response = await request.get('/api/registry/health', {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function getRegistryFamily(request, familySlug) {
  const response = await request.get(`/api/registry/families/${encodeURIComponent(String(familySlug || ''))}`, {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function startRegistryClaim(request, payload) {
  const response = await request.post('/api/registry/claim/start', {
    data: payload,
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function getRegistryReviewQueue(request) {
  const response = await request.get('/api/registry/review-queue', {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

async function getRegistryProof(request, registryId) {
  const response = await request.get(`/api/registry/proof/${encodeURIComponent(String(registryId || ''))}`, {
    failOnStatusCode: false,
  });
  return readJsonResponse(response);
}

module.exports = {
  getRegistryFamily,
  getRegistryHealth,
  getRegistryProof,
  getRegistryReviewQueue,
  getRegistryWebPokerFixture,
  getRegistryWebPokerStats,
  listRegistryWebPokerFixtures,
  startRegistryClaim,
};

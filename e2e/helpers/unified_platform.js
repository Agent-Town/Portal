const { gotoAppWithLite } = require('./trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function getUnifiedPlatformStats(request) {
  const resp = await request.get('/__test__/unified-platform/stats', {
    headers: { 'x-test-reset': resetToken },
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok()) {
    throw new Error(`UNIFIED_PLATFORM_STATS_FAILED:${resp.status()}:${JSON.stringify(body)}`);
  }
  return body?.stats || { counts: {}, tables: [] };
}

async function listUnifiedPlatformFixtureFamilies(request) {
  const resp = await request.get('/__test__/unified-platform/fixtures', {
    headers: { 'x-test-reset': resetToken },
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok()) {
    throw new Error(`UNIFIED_PLATFORM_FIXTURE_LIST_FAILED:${resp.status()}:${JSON.stringify(body)}`);
  }
  return Array.isArray(body?.families) ? body.families : [];
}

async function getUnifiedPlatformFixture(request, family) {
  const resp = await request.get(`/__test__/unified-platform/fixtures/${encodeURIComponent(String(family || ''))}`, {
    headers: { 'x-test-reset': resetToken },
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok()) {
    throw new Error(`UNIFIED_PLATFORM_FIXTURE_FAILED:${resp.status()}:${JSON.stringify(body)}`);
  }
  return body?.fixture || null;
}

async function getWorkerSessionId(page) {
  return await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    if (!api || typeof api.getWorkerSessionId !== 'function') return '';
    return await api.getWorkerSessionId();
  });
}

module.exports = {
  getUnifiedPlatformFixture,
  getUnifiedPlatformStats,
  getWorkerSessionId,
  gotoAppWithLite,
  listUnifiedPlatformFixtureFamilies,
};

const { gotoAppWithLite } = require('./trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function getPlatformCounts(request) {
  const response = await request.get('/__test__/unified-platform/stats', {
    headers: { 'x-test-reset': resetToken },
  });
  const payload = await response.json();
  return {
    ok: payload?.ok === true,
    counts: payload?.stats?.counts || {},
  };
}

async function getPlatformFixture(request, family) {
  const response = await request.get(`/__test__/unified-platform/fixtures/${encodeURIComponent(String(family || ''))}`, {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function listPlatformFixtures(request) {
  const response = await request.get('/__test__/unified-platform/fixtures', {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function readWorkerSessionId(page) {
  await gotoAppWithLite(page);
  await page.waitForFunction(async () => {
    try {
      if (!window.__openclawLiteTest || typeof window.__openclawLiteTest.runtimeSessionContext !== 'function') {
        return false;
      }
      const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
        runtimeContext: {
          origin: window.location.origin,
          teamCode: '',
          houseId: '',
        },
        runtimeState: {},
      });
      const data = snapshot?.data || snapshot || null;
      return typeof data?.sessionId === 'string' && data.sessionId.trim().length > 0;
    } catch {
      return false;
    }
  }, null, { timeout: 10000 });
  return await page.evaluate(async () => {
    const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
      runtimeContext: {
        origin: window.location.origin,
        teamCode: '',
        houseId: '',
      },
      runtimeState: {},
    });
    const data = snapshot?.data || snapshot || null;
    return String(data?.sessionId || '').trim();
  });
}

module.exports = {
  getPlatformCounts,
  getPlatformFixture,
  listPlatformFixtures,
  readWorkerSessionId,
};

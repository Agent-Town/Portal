const { gotoAppWithLite } = require('./trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const DEFAULT_COMPILED_PACK_MANIFEST_PATH = 'workspace/.agent-town/default-pack/manifest.json';

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

async function compileDefaultSkillPack(page, { idempotencyKey = '', force = false } = {}) {
  return await page.evaluate(async ({ compileIdempotencyKey, compileForce }) => {
    const api = window.__openclawLiteTest;
    if (!api || typeof api.compileDefaultSkillPack !== 'function') return null;
    return await api.compileDefaultSkillPack({
      idempotencyKey: compileIdempotencyKey,
      force: compileForce,
    });
  }, {
    compileIdempotencyKey: String(idempotencyKey || ''),
    compileForce: force === true,
  });
}

async function getDefaultCompiledPackManifest(page) {
  return await page.evaluate(async () => {
    const api = window.__openclawLiteTest;
    if (!api || typeof api.getDefaultCompiledPackManifest !== 'function') return null;
    return await api.getDefaultCompiledPackManifest();
  });
}

async function seedPlatformConfigVersion(request, {
  configVersionId = '',
  houseId = '',
  teamId = 'team_main',
  status = 'active',
  manifest = null,
} = {}) {
  const response = await request.post('/__test__/unified-platform/config-versions', {
    headers: {
      'content-type': 'application/json',
      'x-test-reset': resetToken,
    },
    data: JSON.stringify({
      configVersionId,
      houseId,
      teamId,
      status,
      manifest,
    }),
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: response.status(),
      contentType: response.headers()['content-type'] || '',
      raw: text,
    };
  }
}

module.exports = {
  compileDefaultSkillPack,
  DEFAULT_COMPILED_PACK_MANIFEST_PATH,
  getDefaultCompiledPackManifest,
  getPlatformCounts,
  getPlatformFixture,
  listPlatformFixtures,
  readWorkerSessionId,
  seedPlatformConfigVersion,
};

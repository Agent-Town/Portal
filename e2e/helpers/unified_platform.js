const { houseAuthHeadersFromKeyB64 } = require('./phase1');
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

async function createPlatformConfigVersion(request, {
  houseId = '',
  houseAuthKey = '',
  idempotencyKey = '',
  payload = null,
} = {}) {
  const path = `/v1/houses/${encodeURIComponent(String(houseId || '').trim())}/configs`;
  const body = JSON.stringify(payload && typeof payload === 'object' ? payload : {});
  const response = await request.post(path, {
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': String(idempotencyKey || ''),
      ...houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey),
    },
    data: body,
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function createPlatformRun(request, {
  houseId = '',
  houseAuthKey = '',
  experienceId = 'agent_town_coop_v1',
  teamId = 'team_main',
  configVersionId = '',
  entryMode = 'normal',
  metadata = {},
  idempotencyKey = '',
} = {}) {
  const path = `/v1/experiences/${encodeURIComponent(String(experienceId || '').trim())}/runs`;
  const body = JSON.stringify({
    teamId,
    configVersionId,
    entryMode,
    metadata,
  });
  const response = await request.post(path, {
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': String(idempotencyKey || ''),
      ...houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey),
    },
    data: body,
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function promotePlatformConfigVersion(request, {
  houseId = '',
  houseAuthKey = '',
  configVersionId = '',
  teamId = 'team_main',
  idempotencyKey = '',
} = {}) {
  const path = `/v1/houses/${encodeURIComponent(String(houseId || '').trim())}/configs/${encodeURIComponent(String(configVersionId || '').trim())}/promote`;
  const body = JSON.stringify({ teamId });
  const response = await request.post(path, {
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': String(idempotencyKey || ''),
      ...houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey),
    },
    data: body,
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function getPlatformTeamBinding(request, {
  houseId = '',
  houseAuthKey = '',
  teamId = 'team_main',
} = {}) {
  const path = `/v1/houses/${encodeURIComponent(String(houseId || '').trim())}/team`;
  const requestPath = `${path}?teamId=${encodeURIComponent(String(teamId || '').trim())}`;
  const response = await request.get(requestPath, {
    headers: houseAuthHeadersFromKeyB64(houseId, 'GET', path, '', houseAuthKey),
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function resolvePlatformIntegration(request, {
  houseId = '',
  houseAuthKey = '',
  targetUrl = '',
  preferredMode = 'auto',
  sourceHints = {},
  idempotencyKey = '',
} = {}) {
  const path = '/v1/integrations/resolve';
  const body = JSON.stringify({
    targetUrl,
    preferredMode,
    sourceHints: sourceHints && typeof sourceHints === 'object' ? sourceHints : {},
  });
  const response = await request.post(path, {
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': String(idempotencyKey || ''),
      ...houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey),
    },
    data: body,
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function ingestPlatformTraceRecords(request, {
  houseId = '',
  houseAuthKey = '',
  runId = '',
  records = [],
  idempotencyKey = '',
} = {}) {
  const path = '/v1/traces/ingestions';
  const body = JSON.stringify({
    runId,
    records,
  });
  const response = await request.post(path, {
    headers: {
      'content-type': 'application/json',
      'Idempotency-Key': String(idempotencyKey || ''),
      ...houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey),
    },
    data: body,
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function getPlatformTraceEvents(request, traceId) {
  const response = await request.get(`/__test__/unified-platform/traces/${encodeURIComponent(String(traceId || ''))}/events`, {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function getPlatformConfigVersionRecord(request, configVersionId) {
  const response = await request.get(`/__test__/unified-platform/config-versions/${encodeURIComponent(String(configVersionId || ''))}`, {
    headers: { 'x-test-reset': resetToken },
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function setPlatformRunStatus(request, runId, status) {
  const response = await request.post(`/__test__/unified-platform/runs/${encodeURIComponent(String(runId || ''))}/status`, {
    headers: {
      'content-type': 'application/json',
      'x-test-reset': resetToken,
    },
    data: JSON.stringify({ status }),
    failOnStatusCode: false,
  });
  return await response.json();
}

module.exports = {
  compileDefaultSkillPack,
  createPlatformConfigVersion,
  createPlatformRun,
  DEFAULT_COMPILED_PACK_MANIFEST_PATH,
  getDefaultCompiledPackManifest,
  getPlatformConfigVersionRecord,
  getPlatformCounts,
  getPlatformFixture,
  getPlatformTeamBinding,
  getPlatformTraceEvents,
  listPlatformFixtures,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  readWorkerSessionId,
  resolvePlatformIntegration,
  seedPlatformConfigVersion,
  setPlatformRunStatus,
};

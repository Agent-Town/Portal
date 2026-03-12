const { houseAuthHeadersFromKeyB64 } = require('./phase1');
const { gotoAppWithLite, waitForRuntimeSessionContext } = require('./trainer');

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

async function getPlatformStats(request) {
  const response = await request.get('/__test__/unified-platform/stats', {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function getPlatformPackCompatibility(request) {
  const response = await request.get('/api/platform/pack-compatibility', {
    failOnStatusCode: false,
  });
  return {
    status: response.status(),
    json: await response.json(),
  };
}

async function verifyPlatformPackCompatibility(request, payload = {}) {
  const response = await request.post('/api/platform/pack-compatibility/verify', {
    headers: {
      'content-type': 'application/json',
    },
    data: JSON.stringify(payload && typeof payload === 'object' ? payload : {}),
    failOnStatusCode: false,
  });
  return {
    status: response.status(),
    json: await response.json(),
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

async function getRouteManifest(request) {
  const response = await request.get('/__test__/route-manifest', {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function getLiveSuiteManifest(request) {
  const response = await request.get('/__test__/live-suites', {
    headers: { 'x-test-reset': resetToken },
  });
  return await response.json();
}

async function exportPlatformSnapshot(request) {
  const response = await request.get('/__test__/platform-export', {
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

async function inspectHouseOfficePrivacyStorage(request, {
  houseId = '',
  teamId = '',
} = {}) {
  const exported = await exportPlatformSnapshot(request);
  const rows = Array.isArray(exported?.json?.snapshot?.tables?.house_staff_assignments)
    ? exported.json.snapshot.tables.house_staff_assignments
    : [];
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const filteredRows = rows.filter((row) => {
    const rowHouseId = String(row?.house_id || '').trim();
    const rowTeamId = String(row?.team_id || '').trim();
    if (normalizedHouseId && rowHouseId !== normalizedHouseId) return false;
    if (normalizedTeamId && rowTeamId !== normalizedTeamId) return false;
    return true;
  });
  return {
    ok: exported?.status === 200 && exported?.json?.ok === true,
    rowCount: filteredRows.length,
    rows: filteredRows,
    snapshot: exported?.json?.snapshot || null,
  };
}

async function importPlatformSnapshot(request, snapshot, { reset = true } = {}) {
  const response = await request.post('/__test__/platform-import', {
    headers: {
      'content-type': 'application/json',
      'x-test-reset': resetToken,
    },
    data: JSON.stringify({ snapshot, reset }),
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function verifyPlatformSnapshot(request, snapshot) {
  const response = await request.post('/__test__/platform-verify', {
    headers: {
      'content-type': 'application/json',
      'x-test-reset': resetToken,
    },
    data: JSON.stringify({ snapshot }),
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function attachHouseToPageSession(page, {
  houseId = '',
  teamId = '',
} = {}) {
  const result = await page.evaluate(async ({ nextHouseId, nextTeamId, testResetToken }) => {
    const response = await fetch('/__test__/session/attach-house', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': testResetToken,
      },
      body: JSON.stringify({
        houseId: nextHouseId,
        teamId: nextTeamId,
      }),
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  }, {
    nextHouseId: String(houseId || ''),
    nextTeamId: String(teamId || ''),
    testResetToken: resetToken,
  });
  if (result?.status === 200) {
    const expectedHouseId = String(houseId || '').trim();
    const expectedTeamId = String(teamId || '').trim();
    const deadlineAt = Date.now() + 10_000;
    let lastContext = null;
    let ready = false;
    while (Date.now() < deadlineAt) {
      const response = await page.request.get('/api/platform/context', {
        failOnStatusCode: false,
      });
      const payload = await response.json().catch(() => null);
      const data = payload?.data || payload || null;
      lastContext = data;
      const attachedHouseId = String(data?.houseId || '').trim();
      const attachedTeamId = String(data?.activeTeamId || '').trim();
      const houseReady = attachedHouseId === expectedHouseId;
      const teamReady = !expectedTeamId || attachedTeamId === expectedTeamId;
      if (response.ok() && houseReady && teamReady) {
        ready = true;
        break;
      }
      await page.waitForTimeout(100);
    }
    result.context = lastContext;
    if (!ready) {
      throw new Error(`ATTACH_HOUSE_CONTEXT_TIMEOUT:${JSON.stringify({
        expectedHouseId,
        expectedTeamId,
        context: lastContext,
      })}`);
    }
  }
  return result;
}

async function getPlatformContextFromPage(page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/platform/context', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
    return await response.json();
  });
}

async function readWorkerSessionId(page) {
  const hasRuntimeContext = await page.evaluate(() => {
    return !!(
      window.__openclawLiteTest
      && typeof window.__openclawLiteTest.runtimeSessionContext === 'function'
    );
  }).catch(() => false);
  if (!hasRuntimeContext) {
    await gotoAppWithLite(page);
  }
  return await waitForRuntimeSessionContext(page);
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

function buildDeterministicPlatformConfigPayload(configVersionId, {
  teamId = 'team_main',
  branch = 'house-worker-runtime',
} = {}) {
  const normalizedConfigVersionId = String(configVersionId || '').trim();
  const suffix = normalizedConfigVersionId || 'cfg_house_worker_runtime_default';
  return {
    configVersionId: normalizedConfigVersionId,
    teamId,
    displayVersion: `${suffix}@2026.03.12`,
    branch,
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: `hpv_${suffix}`,
      teamCompositionVersionId: `tcv_${suffix}`,
      agentConfigVersionIds: [`agv_${suffix}`],
      officePolicyVersionIds: [],
      experiencePresetVersionId: `epv_${suffix}`,
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: `tpv_${suffix}`,
    },
  };
}

async function ensureActivePlatformConfigVersion(request, {
  houseId = '',
  houseAuthKey = '',
  teamId = 'team_main',
  configVersionId = '',
  idempotencyPrefix = 'house-worker-runtime',
  branch = 'house-worker-runtime',
} = {}) {
  const normalizedConfigVersionId = String(configVersionId || '').trim();
  if (!normalizedConfigVersionId) {
    throw new Error('ACTIVE_PLATFORM_CONFIG_VERSION_ID_REQUIRED');
  }
  const normalizedPrefix = String(idempotencyPrefix || 'house-worker-runtime').trim() || 'house-worker-runtime';
  const created = await createPlatformConfigVersion(request, {
    houseId,
    houseAuthKey,
    idempotencyKey: `${normalizedPrefix}:create:${normalizedConfigVersionId}`,
    payload: buildDeterministicPlatformConfigPayload(normalizedConfigVersionId, {
      teamId,
      branch,
    }),
  });
  if (created.status !== 201 || created.json?.ok !== true) {
    throw new Error(`ACTIVE_PLATFORM_CONFIG_CREATE_FAILED:${JSON.stringify(created)}`);
  }
  const promoted = await promotePlatformConfigVersion(request, {
    houseId,
    houseAuthKey,
    configVersionId: normalizedConfigVersionId,
    teamId,
    idempotencyKey: `${normalizedPrefix}:promote:${normalizedConfigVersionId}`,
  });
  if (promoted.status !== 200 || promoted.json?.ok !== true) {
    throw new Error(`ACTIVE_PLATFORM_CONFIG_PROMOTE_FAILED:${JSON.stringify(promoted)}`);
  }
  return normalizedConfigVersionId;
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

async function listPlatformExperiences(request, {
  houseId = '',
  houseAuthKey = '',
  includeAuth = true,
} = {}) {
  const path = '/v1/experiences';
  const response = await request.get(path, {
    headers: includeAuth ? houseAuthHeadersFromKeyB64(houseId, 'GET', path, '', houseAuthKey) : {},
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

async function compilePlatformIntegration(request, {
  houseId = '',
  houseAuthKey = '',
  integrationId = '',
  idempotencyKey = '',
  payload = {},
} = {}) {
  const path = `/v1/integrations/${encodeURIComponent(String(integrationId || '').trim())}/compilations`;
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

async function executePlatformIntegration(request, {
  houseId = '',
  houseAuthKey = '',
  integrationId = '',
  idempotencyKey = '',
  payload = {},
} = {}) {
  const path = `/v1/integrations/${encodeURIComponent(String(integrationId || '').trim())}/executions`;
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

async function createPlatformTrainerJob(request, {
  houseId = '',
  houseAuthKey = '',
  idempotencyKey = '',
  payload = {},
} = {}) {
  const path = '/v1/trainer/jobs';
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

async function getPlatformTrainerJob(request, {
  houseId = '',
  houseAuthKey = '',
  trainerJobId = '',
} = {}) {
  const path = `/v1/trainer/jobs/${encodeURIComponent(String(trainerJobId || '').trim())}`;
  const response = await request.get(path, {
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

async function getPlatformTrainerResult(request, {
  houseId = '',
  houseAuthKey = '',
  trainerResultId = '',
} = {}) {
  const path = `/v1/trainer/results/${encodeURIComponent(String(trainerResultId || '').trim())}`;
  const response = await request.get(path, {
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

async function promotePlatformTrainerResultPatch(request, {
  houseId = '',
  houseAuthKey = '',
  trainerResultId = '',
  idempotencyKey = '',
  payload = {},
} = {}) {
  const path = `/v1/trainer/results/${encodeURIComponent(String(trainerResultId || '').trim())}/promote-patch`;
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

async function seedPlatformSealedContext(request, {
  houseId = '',
  traceId = '',
  runId = '',
  releasePolicy = 'manual',
  status = 'active',
} = {}) {
  const response = await request.post('/__test__/unified-platform/sealed-contexts/seed', {
    headers: {
      'content-type': 'application/json',
      'x-test-reset': resetToken,
    },
    data: JSON.stringify({
      houseId,
      traceId,
      runId,
      releasePolicy,
      status,
    }),
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function getPlatformSealedContext(request, {
  houseId = '',
  houseAuthKey = '',
  sealedContextId = '',
  includeAuth = true,
} = {}) {
  const path = `/v1/seals/${encodeURIComponent(String(sealedContextId || '').trim())}`;
  const response = await request.get(path, {
    headers: includeAuth ? houseAuthHeadersFromKeyB64(houseId, 'GET', path, '', houseAuthKey) : {},
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
}

async function releasePlatformSealedContext(request, {
  houseId = '',
  houseAuthKey = '',
  sealedContextId = '',
  payload = {},
  includeAuth = true,
} = {}) {
  const path = `/v1/seals/${encodeURIComponent(String(sealedContextId || '').trim())}/release`;
  const body = JSON.stringify(payload && typeof payload === 'object' ? payload : {});
  const response = await request.post(path, {
    headers: {
      'content-type': 'application/json',
      ...(includeAuth ? houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey) : {}),
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

async function reportPlatformSealedContextViolation(request, {
  houseId = '',
  houseAuthKey = '',
  sealedContextId = '',
  payload = {},
  includeAuth = true,
} = {}) {
  const path = `/v1/seals/${encodeURIComponent(String(sealedContextId || '').trim())}/violation`;
  const body = JSON.stringify(payload && typeof payload === 'object' ? payload : {});
  const response = await request.post(path, {
    headers: {
      'content-type': 'application/json',
      ...(includeAuth ? houseAuthHeadersFromKeyB64(houseId, 'POST', path, body, houseAuthKey) : {}),
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

async function ingestPlatformPokerOperatorTrace(request, {
  houseId = '',
  houseAuthKey = '',
  teamId = 'team_main',
  records = [],
  idempotencyKey = '',
} = {}) {
  const path = '/v1/traces/poker-operator-ingestions';
  const body = JSON.stringify({
    teamId,
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

async function getPlatformTraceSummary(request, {
  houseId = '',
  houseAuthKey = '',
  traceId = '',
} = {}) {
  const path = `/v1/traces/${encodeURIComponent(String(traceId || '').trim())}`;
  const response = await request.get(path, {
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

async function getPlatformLiveTraceEvents(request, {
  houseId = '',
  houseAuthKey = '',
  traceId = '',
  cursor = '',
  limit = 50,
  readerId = '',
  readerSource = '',
  includeAuth = true,
} = {}) {
  const searchParams = new URLSearchParams();
  if (cursor) searchParams.set('cursor', String(cursor));
  if (Number.isFinite(Number(limit)) && Number(limit) > 0) searchParams.set('limit', String(Math.floor(Number(limit))));
  if (readerId) searchParams.set('readerId', String(readerId));
  if (readerSource) searchParams.set('readerSource', String(readerSource));
  const path = `/v1/traces/${encodeURIComponent(String(traceId || '').trim())}/events`;
  const query = searchParams.toString();
  const response = await request.get(query ? `${path}?${query}` : path, {
    headers: includeAuth ? houseAuthHeadersFromKeyB64(houseId, 'GET', path, '', houseAuthKey) : {},
    failOnStatusCode: false,
  });
  const text = await response.text();
  try {
    return { status: response.status(), json: JSON.parse(text) };
  } catch {
    return { status: response.status(), json: null, raw: text };
  }
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
  compilePlatformIntegration,
  compileDefaultSkillPack,
  ensureActivePlatformConfigVersion,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  DEFAULT_COMPILED_PACK_MANIFEST_PATH,
  executePlatformIntegration,
  exportPlatformSnapshot,
  getDefaultCompiledPackManifest,
  getLiveSuiteManifest,
  getPlatformConfigVersionRecord,
  getPlatformContextFromPage,
  getPlatformCounts,
  getPlatformPackCompatibility,
  getPlatformStats,
  getPlatformFixture,
  getPlatformTeamBinding,
  getPlatformTrainerJob,
  getPlatformTrainerResult,
  getPlatformSealedContext,
  getPlatformLiveTraceEvents,
  getPlatformTraceEvents,
  getPlatformTraceSummary,
  getRouteManifest,
  importPlatformSnapshot,
  inspectHouseOfficePrivacyStorage,
  listPlatformFixtures,
  listPlatformExperiences,
  attachHouseToPageSession,
  ingestPlatformPokerOperatorTrace,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  promotePlatformTrainerResultPatch,
  readWorkerSessionId,
  releasePlatformSealedContext,
  reportPlatformSealedContextViolation,
  resolvePlatformIntegration,
  seedPlatformSealedContext,
  seedPlatformConfigVersion,
  setPlatformRunStatus,
  verifyPlatformPackCompatibility,
  verifyPlatformSnapshot,
};
